// ============================================================
// Selection — ordered like v1's selection stack (order matters for
// paste cycling and ligature creation).
//
// Glyphs and kerning pairs are selected separately: the pair views
// (Kerning) select pairs, every other view selects glyphs, and glyph
// actions never see a pair key.
// ============================================================

import { create, type StoreApi, type UseBoundStore } from 'zustand'

export interface SelectionState {
  keys: string[]
  set: Set<string>
  /** Most recently clicked key (drives the inspector focus). */
  active: string | null
  /** Range-selection anchor. */
  anchor: string | null

  /** Click semantics: plain / ctrl (toggle) / shift (range) / ctrl+shift (add range). */
  click: (key: string, mods: { ctrl?: boolean; shift?: boolean }, ordered: string[]) => void
  setSelection: (keys: string[], active?: string | null) => void
  add: (keys: string[]) => void
  clear: () => void
  /** Drop keys that no longer exist in the given list (after deletes). */
  retain: (predicate: (key: string) => boolean) => void
}

function make(keys: string[], active: string | null, anchor: string | null): Pick<SelectionState, 'keys' | 'set' | 'active' | 'anchor'> {
  const unique: string[] = []
  const set = new Set<string>()
  for (const k of keys) {
    if (!set.has(k)) {
      set.add(k)
      unique.push(k)
    }
  }
  return { keys: unique, set, active: active && set.has(active) ? active : unique[unique.length - 1] ?? null, anchor }
}

export type SelectionStore = UseBoundStore<StoreApi<SelectionState>>

const createSelectionStore = (): SelectionStore => create<SelectionState>()((set, get) => ({
  keys: [],
  set: new Set(),
  active: null,
  anchor: null,

  click: (key, mods, ordered) => {
    const s = get()
    if (mods.shift && s.anchor) {
      const a = ordered.indexOf(s.anchor)
      const b = ordered.indexOf(key)
      if (a !== -1 && b !== -1) {
        const range = a <= b ? ordered.slice(a, b + 1) : ordered.slice(b, a + 1).reverse()
        const keys = mods.ctrl ? [...s.keys, ...range] : range
        set(make(keys, key, s.anchor))
        return
      }
    }
    if (mods.ctrl) {
      if (s.set.has(key)) {
        const keys = s.keys.filter((k) => k !== key)
        set(make(keys, keys[keys.length - 1] ?? null, key))
      } else {
        set(make([...s.keys, key], key, key))
      }
      return
    }
    set(make([key], key, key))
  },

  setSelection: (keys, active = null) => set(make(keys, active, keys[0] ?? null)),

  add: (keys) => {
    const s = get()
    set(make([...s.keys, ...keys], keys[keys.length - 1] ?? s.active, s.anchor))
  },

  clear: () => set({ keys: [], set: new Set(), active: null, anchor: null }),

  retain: (predicate) => {
    const s = get()
    const keys = s.keys.filter(predicate)
    if (keys.length !== s.keys.length) set(make(keys, s.active, s.anchor && predicate(s.anchor) ? s.anchor : null))
  }
}))

/** Selected glyphs (glyph keys). */
export const useSelectionStore = createSelectionStore()

/** Selected kerning pairs (pair keys), in the pair views. */
export const usePairSelectionStore = createSelectionStore()

/** Selected glyph keys, in selection order. */
export function selectedKeys(): string[] {
  return useSelectionStore.getState().keys
}
