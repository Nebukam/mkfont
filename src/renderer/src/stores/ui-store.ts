// ============================================================
// UI state — current range, search, panels, navigation history.
// ============================================================

import { create } from 'zustand'
import { usePairSelectionStore, useSelectionStore, type SelectionStore } from './selection-store'
import type { CommonGroup } from '../core/common-pairs'

export type RangeRef =
  | { kind: 'glyphs' }
  | { kind: 'ligatures' }
  | { kind: 'kerning' }
  | { kind: 'common'; group: CommonGroup }
  | { kind: 'detected' }
  | { kind: 'all' }
  | { kind: 'block'; name: string }
  | { kind: 'category'; gc: string }

/** Ranges that list kerning pairs (the font's, common, detected): they select pairs, the others glyphs. */
export function isPairRange(range: RangeRef): boolean {
  return range.kind === 'kerning' || range.kind === 'common' || range.kind === 'detected'
}

/** The selection the range shows: pairs in the pair views, glyphs elsewhere. */
export function selectionFor(range: RangeRef): SelectionStore {
  return isPairRange(range) ? usePairSelectionStore : useSelectionStore
}

export type LeftTab = 'browse' | 'preview' | 'history' | 'font'

/** Order of the common pairs views. */
export type CommonSort = 'rank' | 'detected'

/**
 * A navigation step (v1): what the view showed (range and search) and what was selected.
 * Typing a search is not a step: the search is kept with the next step recorded.
 */
export interface NavEntry {
  range: RangeRef
  searchText: string
  keys: string[]
  active: string | null
  /** The kerning pairs selected (the pair views show them). */
  pairs: string[]
  pairActive: string | null
}

const NAV_LIMIT = 50

export interface UIState {
  range: RangeRef
  searchText: string
  /** v1 "Relatives": include decomposition relatives of matches. */
  searchRelatives: boolean
  /** v1 "Exists": only show glyphs that exist in the font. */
  searchExists: boolean
  /** The common pairs views: only pairs not kerned yet (no value of their own, none inherited, not at 0). */
  searchTodo: boolean
  /** The Detected view: also pairs outside the common list. */
  searchRare: boolean
  /** The common pairs views: list order (most common first), or the detected pairs first. */
  commonSort: CommonSort
  leftTab: LeftTab
  leftOpen: boolean
  rightOpen: boolean
  /** Key the grid should scroll to (consumed by the grid). */
  revealKey: string | null
  /** Slot under the pointer (status bar info). */
  hoverKey: string | null

  /**
   * Back / Forward history: ranges and searches shown and selections made, so they
   * can be undone and redone like edits (v1). `navIndex` is the current step.
   */
  navEntries: NavEntry[]
  navIndex: number

  /**
   * Show a range: a navigation step (unless `record: false`), recorded once it settles,
   * so a selection made right after (a jump to a glyph) is part of the same step.
   */
  setRange: (range: RangeRef, opts?: { record?: boolean }) => void
  /** Record the current range, search and selection as a step (nothing when unchanged). */
  /** Record the view as a step; `searchText` is the search it began with (the current one by default). */
  recordNav: (searchText?: string) => void
  setSearchText: (text: string) => void
  toggleSearchRelatives: () => void
  toggleSearchExists: () => void
  toggleSearchTodo: () => void
  toggleSearchRare: () => void
  setCommonSort: (sort: CommonSort) => void
  /** Activity-bar click: switch panels, or collapse the sidebar when the tab is already shown. */
  setLeftTab: (tab: LeftTab) => void
  /** Show a sidebar panel (menus, palette, shortcuts): never collapses. */
  showLeftTab: (tab: LeftTab) => void
  toggleLeft: () => void
  toggleRight: () => void
  reveal: (key: string | null) => void
  /** Step back / forward and show that step's range, search and selection again (the caller scrolls to it). */
  goBack: () => NavEntry | null
  goForward: () => NavEntry | null
}

/** The part of the UI state that belongs to a document: each tab keeps its own. */
export type ViewState = Pick<UIState, 'range' | 'searchText' | 'revealKey' | 'hoverKey' | 'navEntries' | 'navIndex'>

export function viewOf(s: UIState): ViewState {
  return { range: s.range, searchText: s.searchText, revealKey: s.revealKey, hoverKey: s.hoverKey, navEntries: s.navEntries, navIndex: s.navIndex }
}

/** A document's view when it opens: its glyphs, nothing selected. */
export function freshView(): ViewState {
  const range: RangeRef = { kind: 'glyphs' }
  return {
    range,
    searchText: '',
    revealKey: null,
    hoverKey: null,
    navEntries: [{ range, searchText: '', keys: [], active: null, pairs: [], pairActive: null }],
    navIndex: 0
  }
}

const sameKeys = (a: string[], b: string[]): boolean => a.length === b.length && a.every((k, i) => k === b[i])

function sameEntry(a: NavEntry, b: NavEntry): boolean {
  return (
    sameRange(a.range, b.range) &&
    a.searchText === b.searchText &&
    a.active === b.active &&
    sameKeys(a.keys, b.keys) &&
    a.pairActive === b.pairActive &&
    sameKeys(a.pairs, b.pairs)
  )
}

export function sameRange(a: RangeRef, b: RangeRef): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'block' && b.kind === 'block') return a.name === b.name
  if (a.kind === 'category' && b.kind === 'category') return a.gc === b.gc
  if (a.kind === 'common' && b.kind === 'common') return a.group === b.group
  return true
}

export const useUIStore = create<UIState>()((set, get) => ({
  ...freshView(),
  searchRelatives: false,
  searchExists: false,
  searchTodo: false,
  searchRare: false,
  commonSort: 'rank',
  leftTab: 'browse',
  leftOpen: true,
  rightOpen: true,

  setRange: (range, opts = {}) => {
    if (sameRange(range, get().range)) return
    const record = opts.record !== false
    // The selection made in the range being left is a step of its own.
    if (record) flushNavRecording()
    set({ range })
    if (record) recordSoon()
  },
  recordNav: (searchText) => {
    const s = get()
    const sel = useSelectionStore.getState()
    const pairs = usePairSelectionStore.getState()
    const entry: NavEntry = {
      range: s.range,
      searchText: searchText ?? s.searchText,
      keys: sel.keys,
      active: sel.active,
      pairs: pairs.keys,
      pairActive: pairs.active
    }
    const current = s.navEntries[s.navIndex]
    if (current && sameEntry(current, entry)) return
    // A new step drops the steps that were ahead (like editing after an undo).
    const navEntries = [...s.navEntries.slice(0, s.navIndex + 1), entry].slice(-NAV_LIMIT)
    set({ navEntries, navIndex: navEntries.length - 1 })
  },
  setSearchText: (text) => set({ searchText: text }),
  toggleSearchRelatives: () => set((s) => ({ searchRelatives: !s.searchRelatives })),
  toggleSearchExists: () => set((s) => ({ searchExists: !s.searchExists })),
  toggleSearchTodo: () => set((s) => ({ searchTodo: !s.searchTodo })),
  toggleSearchRare: () => set((s) => ({ searchRare: !s.searchRare })),
  setCommonSort: (commonSort) => set({ commonSort }),
  // Clicking the active tab collapses the panel (activity-bar behaviour).
  setLeftTab: (tab) => set((s) => ({ leftTab: tab, leftOpen: s.leftTab === tab ? !s.leftOpen : true })),
  showLeftTab: (tab) => set({ leftTab: tab, leftOpen: true }),
  toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
  toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
  reveal: (key) => set({ revealKey: key }),

  goBack: () => showStep(-1),
  goForward: () => showStep(1)
}))

// Selections become steps once they settle, so a run of arrow keys is not fifty
// steps. A range change settles the same way, so a selection made right after it
// joins its step. Empty selections are not steps (v1), but a range change is.
const SETTLE_MS = 300
let navTimer: ReturnType<typeof setTimeout> | undefined

/**
 * The search shown when the step being settled began: a search typed in the meantime
 * belongs to the next step (Back must not show the range filtered by half a word).
 */
let stepSearch: string | undefined

function recordSoon(): void {
  clearTimeout(navTimer)
  stepSearch = useUIStore.getState().searchText
  navTimer = setTimeout(flushNavRecording, SETTLE_MS)
}

function cancelRecording(): void {
  clearTimeout(navTimer)
  navTimer = undefined
  stepSearch = undefined
}

/** The view makes a step: something is selected in it, or it shows another range than the current step. */
function isStep(): boolean {
  const s = useUIStore.getState()
  const current = s.navEntries[s.navIndex]
  return selectionFor(s.range).getState().keys.length > 0 || !current || !sameRange(s.range, current.range)
}

for (const store of [useSelectionStore, usePairSelectionStore]) {
  store.subscribe((s, prev) => {
    if (s.keys === prev.keys && s.active === prev.active) return
    if (isStep()) recordSoon()
    else cancelRecording()
  })
}

/** Forget a step still settling: a tab switch restores a view, which is not a new step. */
export function cancelNavRecording(): void {
  cancelRecording()
}

/** Record a step that has not settled yet (before navigating, or a tab switch). */
export function flushNavRecording(): void {
  if (navTimer === undefined) return
  const search = stepSearch
  cancelRecording()
  if (isStep()) useUIStore.getState().recordNav(search)
}

/** Back / Forward: show the step before or after the current one again. */
function showStep(offset: -1 | 1): NavEntry | null {
  // A step still settling is recorded first: Back returns to the one before it.
  flushNavRecording()
  const ui = useUIStore.getState()
  const index = ui.navIndex + offset
  const entry = ui.navEntries[index]
  if (!entry) return null
  ui.setRange(entry.range, { record: false })
  useUIStore.setState({ navIndex: index, searchText: entry.searchText })
  useSelectionStore.getState().setSelection(entry.keys, entry.active)
  usePairSelectionStore.getState().setSelection(entry.pairs, entry.pairActive)
  // Not a new step: with a search typed right after, it would look like one and drop the steps ahead.
  cancelRecording()
  return entry
}

/** Back is possible: an earlier step, or one still settling. */
export function canGoBack(): boolean {
  return useUIStore.getState().navIndex > 0 || navTimer !== undefined
}

export function canGoForward(): boolean {
  const s = useUIStore.getState()
  return s.navIndex < s.navEntries.length - 1
}
