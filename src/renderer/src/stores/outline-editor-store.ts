// ============================================================
// Outline editor window: whether it is open, and which glyph it shows.
//
// It follows the active glyph of the font shown, unless that font's tab is locked on a
// glyph: then it stays on that glyph until the lock is released.
// ============================================================

import { create } from 'zustand'
import type { ComputedMap } from '../core/compute'
import { invert } from '../core/affine'
import { isEmptyPathContent } from '../core/model'
import { refToKey } from '../core/unicode-keys'
import type { Glyph, Layer } from '../types/font'

interface OutlineEditorState {
  open: boolean
  /** Document id → the glyph its tab is locked on. No entry: the editor follows the selection. */
  locks: Map<number, string>
  setOpen: (open: boolean) => void
  /** Lock the document's editor on `key`, or release it with null. */
  setLock: (docId: number, key: string | null) => void
  /** Drop the locks `keep` refuses (their glyph or document is gone). */
  dropLocks: (keep: (docId: number, key: string) => boolean) => void
}

export const useOutlineEditorStore = create<OutlineEditorState>()((set, get) => ({
  open: false,
  locks: new Map(),
  setOpen: (open) => set({ open }),
  setLock: (docId, key) => {
    const locks = new Map(get().locks)
    if (key === null) locks.delete(docId)
    else locks.set(docId, key)
    set({ locks })
  },
  dropLocks: (keep) => {
    const { locks } = get()
    const next = new Map([...locks].filter(([docId, key]) => keep(docId, key)))
    if (next.size !== locks.size) set({ locks: next })
  }
}))

/**
 * What the editor can do with its glyph:
 * - `ok`: it has an outline of its own to edit;
 * - `none`: no glyph is selected;
 * - `missing`: the slot has no glyph yet;
 * - `empty`: the glyph has no outline of its own (`components`: it is drawn by components);
 * - `unfit`: its outline is scaled to nothing, so points cannot be placed back.
 */
export type TargetState = 'ok' | 'none' | 'missing' | 'empty' | 'components' | 'unfit'

export interface OutlineTarget {
  key: string | null
  locked: boolean
  state: TargetState
}

/** The glyph the editor shows for a document: the one it is locked on, else the active glyph. */
export function resolveTarget(
  lock: string | undefined,
  active: string | null,
  glyphs: Map<string, Glyph> | undefined,
  computed: ComputedMap
): OutlineTarget {
  const key = lock ?? active
  const locked = lock !== undefined
  if (!key || !glyphs) return { key: null, locked, state: 'none' }
  const glyph = glyphs.get(key)
  if (!glyph) return { key, locked, state: 'missing' }
  const variant = glyph.variants[0]
  const c = computed.get(key)?.[0]
  if (variant.pathData.emptyPath || isEmptyPathContent(variant.pathData.path) || !c?.ownMatrix) {
    return { key, locked, state: variant.layers.length ? 'components' : 'empty' }
  }
  return { key, locked, state: invert(c.ownMatrix) ? 'ok' : 'unfit' }
}

/**
 * The glyphs a glyph's components draw, each once, in component order: what there is to
 * edit when it has no outline of its own. Components without a glyph, or that name the
 * glyph itself, are left out; a glyph the font does not have yet is kept.
 */
export function componentKeys(key: string, layers: readonly Pick<Layer, 'characterRef'>[] | undefined): string[] {
  const keys = new Set<string>()
  for (const layer of layers ?? []) {
    const ref = refToKey(layer.characterRef)
    if (ref && ref !== key) keys.add(ref)
  }
  return [...keys]
}
