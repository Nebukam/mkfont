// ============================================================
// Workspace: the open documents (one tab each) and the active one.
//
// Each document has its own store (data, history, file). The view around it
// (selection, range, search, Back / Forward) is put aside while its tab is in
// the background and comes back with it.
// ============================================================

import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { activeDocStore, createDocStore, selectDirty, setActiveDocStore, type DocStore } from './doc-store'
import { usePairSelectionStore, useSelectionStore, type SelectionState } from './selection-store'
import { cancelNavRecording, flushNavRecording, freshView, useUIStore, viewOf, type ViewState } from './ui-store'
import { useInspectorStore } from './inspector-store'
import { commitFieldEdit, commitFieldForSwitch } from '../components/ui/focus'
import { pathKey } from '../platform'

export interface Session {
  /** Tab id (stable while the tab is open). */
  id: number
  store: DocStore
}

interface WorkspaceState {
  sessions: Session[]
  activeId: number | null
}

export const useWorkspace = create<WorkspaceState>()(() => ({ sessions: [], activeId: null }))

type SelectionView = Pick<SelectionState, 'keys' | 'set' | 'active' | 'anchor'>

// A field commits typed text into whatever it shows when it commits. A click in the grid
// selects on mouse down, and the inspector shows the new glyphs before focus leaves the
// field: commit it while it still shows the glyphs it was typed for.
for (const store of [useSelectionStore, usePairSelectionStore]) {
  store.subscribe((s, prev) => {
    if (s.keys !== prev.keys || s.active !== prev.active) commitFieldEdit()
  })
}

interface TabView {
  selection: SelectionView
  pairs: SelectionView
  ui: ViewState
}

/** The view of each background tab. */
const views = new Map<number, TabView>()
let nextSessionId = 0

function emptySelection(): SelectionView {
  return { keys: [], set: new Set(), active: null, anchor: null }
}

function selectionView(s: SelectionState): SelectionView {
  return { keys: s.keys, set: s.set, active: s.active, anchor: s.anchor }
}

function captureView(): TabView {
  // A selection made just before switching is a Back step of that tab.
  flushNavRecording()
  return {
    selection: selectionView(useSelectionStore.getState()),
    pairs: selectionView(usePairSelectionStore.getState()),
    ui: viewOf(useUIStore.getState())
  }
}

function showView(view: TabView | undefined): void {
  useSelectionStore.setState(view?.selection ?? emptySelection())
  usePairSelectionStore.setState(view?.pairs ?? emptySelection())
  useUIStore.setState(view?.ui ?? freshView())
  // The restored selection is where the tab was left, not a new Back step.
  cancelNavRecording()
  useInspectorStore.setState({ layerFocus: null, layerSelection: null, layerDraft: null })
}

export function activeSession(): Session | null {
  const ws = useWorkspace.getState()
  return ws.sessions.find((s) => s.id === ws.activeId) ?? null
}

/** The open document showing `path`, if any. */
export function sessionForPath(path: string): Session | null {
  const key = pathKey(path)
  return (
    useWorkspace.getState().sessions.find((s) => {
      const p = s.store.getState().filePath
      return !!p && pathKey(p) === key
    }) ?? null
  )
}

/** The store of a document by id: open tabs, else the active store (tests load into it directly). */
export function storeForDoc(docId: number): DocStore | null {
  for (const s of useWorkspace.getState().sessions) if (s.store.getState().docId === docId) return s.store
  const active = activeDocStore()
  return active.getState().docId === docId ? active : null
}

/** Every document that is open (the active store too when no tab was opened, as in tests). */
export function openStores(): DocStore[] {
  const sessions = useWorkspace.getState().sessions
  return sessions.length ? sessions.map((s) => s.store) : [activeDocStore()]
}

const leaving = new Set<() => void>()

/**
 * Run `fn` just before another document is shown, while the page still shows the one
 * being left: view state kept outside the stores (the grid's scroll position) saves itself.
 */
export function onLeaveDocument(fn: () => void): () => void {
  leaving.add(fn)
  return () => {
    leaving.delete(fn)
  }
}

/** Show a tab: its document, and the view it had when it was left. */
export function activateSession(id: number): void {
  const ws = useWorkspace.getState()
  const target = ws.sessions.find((s) => s.id === id)
  if (!target || ws.activeId === id) return
  commitFieldForSwitch()
  for (const fn of [...leaving]) fn()
  if (ws.activeId !== null) views.set(ws.activeId, captureView())
  setActiveDocStore(target.store)
  showView(views.get(id))
  views.delete(id)
  useWorkspace.setState({ activeId: id })
}

/** Open a document in a new tab and show it. `init` loads the new store. */
export function openSession(init: (store: DocStore) => void): Session {
  const store = createDocStore()
  init(store)
  const session: Session = { id: ++nextSessionId, store }
  useWorkspace.setState((s) => ({ sessions: [...s.sessions, session] }))
  activateSession(session.id)
  return session
}

/** Close a tab (the caller has asked about unsaved changes). A neighbour takes its place. */
export function closeSession(id: number): void {
  const ws = useWorkspace.getState()
  const index = ws.sessions.findIndex((s) => s.id === id)
  if (index < 0) return
  const sessions = ws.sessions.filter((s) => s.id !== id)
  views.delete(id)
  if (ws.activeId !== id) {
    useWorkspace.setState({ sessions })
    return
  }
  const next = sessions[Math.min(index, sessions.length - 1)]
  // The closed tab's view is not kept: activate as if nothing were shown.
  useWorkspace.setState({ sessions, activeId: null })
  if (next) {
    activateSession(next.id)
  } else {
    setActiveDocStore(createDocStore())
    showView(undefined)
  }
}

/** Show the tab after / before the active one (wrapping around). */
export function cycleSession(step: 1 | -1): void {
  const ws = useWorkspace.getState()
  if (ws.sessions.length < 2) return
  const index = ws.sessions.findIndex((s) => s.id === ws.activeId)
  const next = ws.sessions[(index + step + ws.sessions.length) % ws.sessions.length]
  activateSession(next.id)
}

/**
 * A tab nobody worked in yet (a new font, untouched): opening a file replaces it
 * instead of leaving an empty "Untitled" tab behind.
 */
export function isPristine(session: Session): boolean {
  const s = session.store.getState()
  return !s.filePath && s.history.length === 0 && !!s.data && s.data.glyphs.size === 0 && !selectDirty(s)
}

// ---- Unsaved changes across tabs ----

function subscribeDirty(onChange: () => void): () => void {
  let unsubs: (() => void)[] = []
  const watch = (): void => {
    unsubs.forEach((u) => u())
    unsubs = openStores().map((store) => store.subscribe(onChange))
  }
  watch()
  const offWorkspace = useWorkspace.subscribe(() => {
    watch()
    onChange()
  })
  return () => {
    offWorkspace()
    unsubs.forEach((u) => u())
  }
}

/** Some open document has unsaved changes. */
export function anyDirty(): boolean {
  return openStores().some((store) => selectDirty(store.getState()))
}

/** Hook: some open document has unsaved changes (the window close guard and title use it). */
export function useAnyDirty(): boolean {
  return useSyncExternalStore(subscribeDirty, anyDirty)
}
