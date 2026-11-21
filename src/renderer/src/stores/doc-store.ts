// ============================================================
// Document store — font data, computed geometry, undo history.
//
// Every edit goes through `transact(label, recipe)`: the recipe mutates
// an immer draft, the store records a labeled history entry, then only
// the touched glyphs (and glyphs using them as components) are
// recomputed. Snapshots share structure, so history is cheap.
//
// Each open document (tab) has its own store (`createDocStore`).
// `useDocStore` always reads the active one; work that outlives a tab
// switch (saves, reloads of bound files) keeps the store it started on.
// ============================================================

import { useSyncExternalStore } from 'react'
import { createStore, useStore, type StoreApi } from 'zustand'
import { enableMapSet, produce } from 'immer'
import type { Family, MkFontFile, SelectionPreset } from '../types/font'
import type { DocData, DocDraft } from '../core/ops'
import {
  analyzeDependencies,
  computeAll,
  computeIncremental,
  sameComponentRefs,
  type ComputedMap,
  type DependencyInfo
} from '../core/compute'
import { t } from '../i18n'

enableMapSet()

export type { DocData, DocDraft }

/** A document to load: the kerning parts are optional (a font without pairs, inheriting). */
export type DocInit = Omit<DocData, 'kerning' | 'inheritKerning'> & Partial<Pick<DocData, 'kerning' | 'inheritKerning'>>

export interface HistoryEntry {
  id: number
  label: string
  icon?: string
  before: DocData
  after: DocData
  mergeKey?: string
  time: number
}

export interface TransactOptions {
  /** Consecutive edits sharing a merge key (within ~1.5s) collapse into one entry. */
  mergeKey?: string
  /**
   * Set false for UI state stored in the file (component folding): not undoable,
   * and it does not make a clean document dirty (v1 saved it without asking).
   */
  history?: boolean
  icon?: string
}

/** What a save wrote: marks exactly that state as saved, not later edits. */
export interface SavedSnapshot {
  data: DocData
  presets: SelectionPreset[]
  docId: number
}

const HISTORY_LIMIT = 300
const MERGE_WINDOW_MS = 1500
let entryId = 0
/** Document ids are unique across all open documents (the clipboard tells fonts apart by them). */
let nextDocId = 0

interface DocState {
  data: DocData | null
  computed: ComputedMap
  dep: DependencyInfo
  filePath: string | null
  /** Display name (file name, or a placeholder for unsaved fonts). */
  fileName: string
  meta?: MkFontFile['meta']
  /** Snapshot that matches the file on disk; dirty when `data` differs. */
  savedData: DocData | null
  /** Bumped on every data change (cheap change signal for effects). */
  revision: number
  /** Identifies the loaded document (changes on load / close). */
  docId: number
  /** Selection presets (saved in the file, outside undo history like v1). */
  presets: SelectionPreset[]
  savedPresets: SelectionPreset[] | null

  history: HistoryEntry[]
  /** Number of history entries currently applied. */
  cursor: number
  /** Data before the first history entry. */
  initial: DocData | null
  /** Label of the initial state in the history panel. */
  initialLabel: string

  load: (
    data: DocInit,
    opts?: { filePath?: string | null; fileName?: string; meta?: MkFontFile['meta']; label?: string; saved?: boolean }
  ) => void
  close: () => void
  /**
   * Register the snapshot a save is writing. Fold edits made while the write is in
   * flight move it along, so they do not leave the document looking unsaved.
   */
  trackSave: (snapshot: SavedSnapshot) => void
  markSaved: (filePath: string | null, fileName?: string, snapshot?: SavedSnapshot) => void
  setPreset: (index: number, keys: string[] | null) => void
  transact: (label: string, recipe: (d: DocDraft) => void, opts?: TransactOptions) => boolean
  undo: () => void
  redo: () => void
  jumpTo: (cursor: number) => void
}

const emptyDep: DependencyInfo = { layerRefs: new Map(), users: new Map(), order: [] }

function familyGeometryChanged(a: Family, b: Family): boolean {
  return a.values !== b.values || a.transforms !== b.transforms
}

/**
 * Recompute geometry for a data transition. Dependency analysis walks the
 * whole font, so it only reruns when glyphs appear or disappear or a changed
 * glyph references different components; transform edits (scrubbing) reuse it.
 */
function recompute(
  prev: DocData | null,
  next: DocData,
  prevComputed: ComputedMap,
  prevDep: DependencyInfo
): { computed: ComputedMap; dep: DependencyInfo } {
  const changed = new Set<string>()
  let structural = !prev
  if (prev && prev.glyphs !== next.glyphs) {
    for (const [k, g] of next.glyphs) {
      const before = prev.glyphs.get(k)
      if (before === g) continue
      changed.add(k)
      if (!before || !sameComponentRefs(before, g)) structural = true
    }
    for (const k of prev.glyphs.keys()) {
      if (!next.glyphs.has(k)) {
        changed.add(k)
        structural = true
      }
    }
  }
  const dep = structural ? analyzeDependencies(next.glyphs) : prevDep
  if (!prev || familyGeometryChanged(prev.family, next.family)) {
    return { computed: computeAll(next.family, next.glyphs, dep), dep }
  }
  if (changed.size === 0) return { computed: prevComputed, dep }
  return { computed: computeIncremental(next.family, next.glyphs, prevComputed, changed, dep), dep }
}

/** A document's store. */
export type DocStore = StoreApi<DocState>

/** A store for one open document. */
export function createDocStore(): DocStore {
  /** The snapshot an in-flight save will mark as saved (see `trackSave`). */
  let pendingSave: SavedSnapshot | null = null
  return createStore<DocState>()((set, get) => ({
  data: null,
  computed: new Map(),
  dep: emptyDep,
  filePath: null,
  fileName: t('document.untitled'),
  meta: undefined,
  savedData: null,
  revision: 0,
  docId: 0,
  presets: Array(10).fill(null),
  savedPresets: null,
  history: [],
  cursor: 0,
  initial: null,
  initialLabel: t('document.history.opened'),

  load: (init, opts = {}) => {
    const data: DocData = { ...init, kerning: init.kerning ?? new Map(), inheritKerning: init.inheritKerning ?? true }
    const dep = analyzeDependencies(data.glyphs)
    const computed = computeAll(data.family, data.glyphs, dep)
    set((s) => ({
      data,
      computed,
      dep,
      filePath: opts.filePath ?? null,
      fileName: opts.fileName ?? t('document.untitledFile'),
      meta: opts.meta,
      savedData: opts.saved === false ? null : data,
      revision: s.revision + 1,
      docId: ++nextDocId,
      presets: data.family.selections.slice(0, 10),
      savedPresets: null,
      history: [],
      cursor: 0,
      initial: data,
      initialLabel: opts.label ?? t('document.history.opened')
    }))
    set((s) => ({ savedPresets: opts.saved === false ? null : s.presets }))
  },

  close: () => {
    set((s) => ({
      data: null,
      computed: new Map(),
      dep: emptyDep,
      filePath: null,
      meta: undefined,
      savedData: null,
      revision: s.revision + 1,
      docId: ++nextDocId,
      presets: Array(10).fill(null),
      savedPresets: null,
      history: [],
      cursor: 0,
      initial: null
    }))
  },

  trackSave: (snapshot) => {
    pendingSave = snapshot
  },

  markSaved: (filePath, fileName, snapshot) =>
    set((s) => {
      if (snapshot && pendingSave === snapshot) pendingSave = null
      // A save that finishes after another document was loaded changes nothing.
      if (snapshot && snapshot.docId !== s.docId) return {}
      return {
        savedData: snapshot ? snapshot.data : s.data,
        savedPresets: snapshot ? snapshot.presets : s.presets,
        filePath,
        fileName: fileName ?? s.fileName
      }
    }),

  setPreset: (index, keys) => {
    if (index < 0 || index > 9) return
    set((s) => {
      const presets = s.presets.slice()
      presets[index] = keys && keys.length ? [...keys] : null
      return { presets }
    })
  },

  transact: (label, recipe, opts = {}) => {
    const state = get()
    const prev = state.data
    if (!prev) return false
    // Recipes only mutate the draft; a value they happen to return (an op's
    // count or flag) must not reach immer, which would treat it as new state.
    const next = produce(prev, (d) => {
      recipe(d)
    })
    if (next === prev) return false

    const { computed, dep } = recompute(prev, next, state.computed, state.dep)
    const now = Date.now()

    if (opts.history === false) {
      if (pendingSave && pendingSave.docId === state.docId && pendingSave.data === prev) pendingSave.data = next
      // Not undoable: rewrite the current history position in place.
      const history = state.history.slice()
      if (state.cursor > 0) history[state.cursor - 1] = { ...history[state.cursor - 1], after: next }
      set({
        data: next,
        computed,
        dep,
        revision: state.revision + 1,
        history,
        initial: state.cursor === 0 ? next : state.initial,
        savedData: state.savedData === prev ? next : state.savedData
      })
      return true
    }

    let history = state.history.slice(0, state.cursor)
    const last = history[history.length - 1]
    if (opts.mergeKey && last && last.mergeKey === opts.mergeKey && now - last.time < MERGE_WINDOW_MS) {
      history[history.length - 1] = { ...last, after: next, time: now }
    } else {
      history.push({ id: ++entryId, label, icon: opts.icon, before: prev, after: next, mergeKey: opts.mergeKey, time: now })
    }
    let initial = state.initial
    if (history.length > HISTORY_LIMIT) {
      const drop = history.length - HISTORY_LIMIT
      initial = history[drop - 1].after
      history = history.slice(drop)
    }
    set({
      data: next,
      computed,
      dep,
      revision: state.revision + 1,
      history,
      cursor: history.length,
      initial
    })
    return true
  },

  undo: () => {
    const { cursor } = get()
    if (cursor > 0) get().jumpTo(cursor - 1)
  },

  redo: () => {
    const { cursor, history } = get()
    if (cursor < history.length) get().jumpTo(cursor + 1)
  },

  jumpTo: (target) => {
    const state = get()
    if (!state.data || target < 0 || target > state.history.length || target === state.cursor) return
    const next = target === 0 ? state.initial : state.history[target - 1].after
    if (!next) return
    const { computed, dep } = recompute(state.data, next, state.computed, state.dep)
    set({ data: next, computed, dep, cursor: target, revision: state.revision + 1 })
  }
}))
}

// ---- The active document ----

/** Until a document is opened, an empty store (no data: the welcome screen). */
let activeStore: DocStore = createDocStore()
const switchListeners = new Set<() => void>()

export function activeDocStore(): DocStore {
  return activeStore
}

/** Make `store` the document every `useDocStore` reader sees. */
export function setActiveDocStore(store: DocStore): void {
  if (store === activeStore) return
  activeStore = store
  for (const fn of [...switchListeners]) fn()
}

function subscribeSwitch(fn: () => void): () => void {
  switchListeners.add(fn)
  return () => {
    switchListeners.delete(fn)
  }
}

/** The active document's store, re-rendering when another document becomes active. */
export function useActiveDocStore(): DocStore {
  return useSyncExternalStore(subscribeSwitch, activeDocStore)
}

type DocHook = {
  (): DocState
  <T>(selector: (s: DocState) => T): T
  getState: DocStore['getState']
  setState: DocStore['setState']
  subscribe: DocStore['subscribe']
}

const identity = (s: DocState): DocState => s

/** Reads the active document (hook, or getState / setState / subscribe like any store). */
export const useDocStore = (<T>(selector?: (s: DocState) => T) =>
  useStore(useActiveDocStore(), (selector ?? identity) as (s: DocState) => T)) as DocHook
useDocStore.getState = () => activeStore.getState()
useDocStore.setState = ((...args: Parameters<DocStore['setState']>) => activeStore.setState(...args)) as DocStore['setState']
// Follows the active document: switching documents is reported as a change.
useDocStore.subscribe = (listener) => {
  let store = activeStore
  let unsubscribe = store.subscribe(listener)
  const onSwitch = (): void => {
    const prev = store.getState()
    unsubscribe()
    store = activeStore
    unsubscribe = store.subscribe(listener)
    listener(store.getState(), prev)
  }
  switchListeners.add(onSwitch)
  return () => {
    unsubscribe()
    switchListeners.delete(onSwitch)
  }
}

// ---- Selectors & helpers ----

export const selectDirty = (s: DocState): boolean =>
  s.data !== null && (s.data !== s.savedData || s.presets !== s.savedPresets)

export function transact(label: string, recipe: (d: DocDraft) => void, opts?: TransactOptions): boolean {
  return useDocStore.getState().transact(label, recipe, opts)
}

if (import.meta.env?.DEV && typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__doc = useDocStore
}
