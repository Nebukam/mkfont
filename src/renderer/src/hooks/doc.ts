// ============================================================
// Data hooks over the document store.
// ============================================================

import { useMemo, useSyncExternalStore } from 'react'
import { useDocStore } from '../stores/doc-store'
import type { Glyph } from '../types/font'
import { useUIStore, type RangeRef } from '../stores/ui-store'
import { detectedPairs, useKernSuggestions } from '../app/kern-suggestions'
import {
  BROWSABLE_BLOCKS,
  allKeys,
  getRelatives,
  isUnicodeDbLoaded,
  keysInBlock,
  keysInCategory,
  matchesSearch,
  onUnicodeDbLoaded,
  parseSearch
} from '../core/unicode'
import { charsToKey, compareKeys, isLigatureKey, resolveString } from '../core/unicode-keys'
import { comparePairs, pairKey, pairSides, type Kerning } from '../core/kerning'
import { commonPairs } from '../core/common-pairs'

/** Re-render once the lazy Unicode names database is available (never misses the load). */
export function useUnicodeDb(): boolean {
  return useSyncExternalStore(onUnicodeDbLoaded, isUnicodeDbLoaded)
}

/** Base content of a range, before search filtering (pair keys in the pair views). */
export function rangeKeys(range: RangeRef, glyphs: Map<string, Glyph>, kerning: Kerning = new Map()): string[] {
  switch (range.kind) {
    case 'glyphs':
      return [...glyphs.keys()].sort(compareKeys)
    case 'ligatures':
      return [...glyphs.keys()].filter(isLigatureKey).sort(compareKeys)
    case 'kerning':
      return [...kerning.keys()].sort(comparePairs)
    case 'common':
      // Most relevant first.
      return commonPairs(range.group)
    case 'detected':
      // Measured from the outlines: see useRangeKeys.
      return []
    case 'all':
      return allKeys()
    case 'block': {
      const b = BROWSABLE_BLOCKS.find((x) => x.name === range.name)
      return b ? keysInBlock(b) : []
    }
    case 'category':
      return keysInCategory(range.gc)
  }
}

export interface SearchOptions {
  text: string
  relatives: boolean
  exists: boolean
}

/** v1 search: inclusive terms over chars, names and layer ids; optional relatives & existing-only. */
export function filterKeys(base: string[], glyphs: Map<string, Glyph>, opts: SearchOptions): string[] {
  const text = opts.text.trim()
  if (!text && !opts.exists) return base
  if (!text) return base.filter((k) => glyphs.has(k))

  const q = parseSearch(text, resolveString)
  const out: string[] = []
  const seen = new Set<string>()
  const push = (k: string): void => {
    if (seen.has(k)) return
    if (opts.exists && !glyphs.has(k)) return
    seen.add(k)
    out.push(k)
  }
  for (const k of base) {
    const g = glyphs.get(k)
    const ids = g ? g.variants[0].layers.map((l) => l.customId).filter((x): x is string => !!x) : []
    if (!matchesSearch(k, q, ids)) continue
    push(k)
    if (opts.relatives) for (const r of getRelatives(k)) push(r)
  }
  return out
}

/**
 * Search over pairs: a pair matches when either glyph matches (same rules as glyphs), or
 * when the text is the pair itself ("AV"). "Existing only" keeps pairs whose glyphs both exist.
 */
export function filterPairs(base: string[], glyphs: Map<string, Glyph>, opts: Pick<SearchOptions, 'text' | 'exists'>): string[] {
  const text = opts.text.trim()
  const both = (k: string): boolean => pairSides(k).every((g) => glyphs.has(g))
  if (!text) return opts.exists ? base.filter(both) : base
  const q = parseSearch(text, resolveString)
  const chars = Array.from(resolveString(text))
  const exact = chars.length === 2 && !/\s/.test(text) ? pairKey(charsToKey(chars[0]), charsToKey(chars[1])) : null
  const ids = (k: string): string[] => glyphs.get(k)?.variants[0].layers.map((l) => l.customId).filter((x): x is string => !!x) ?? []
  return base.filter((k) => {
    if (opts.exists && !both(k)) return false
    if (k === exact) return true
    const [left, right] = pairSides(k)
    return matchesSearch(left, q, ids(left)) || matchesSearch(right, q, ids(right))
  })
}

export function useRangeKeys(range: RangeRef): string[] {
  // Only the glyph key set matters for range content (not glyph contents).
  const glyphs = useDocStore((s) => s.data?.glyphs)
  const keySig = useDocStore((s) => s.data?.glyphs.size ?? 0)
  // The pair views list the font's pairs: every pair edit gives a new map.
  const kerning = useDocStore((s) => (range.kind === 'kerning' || range.kind === 'detected' ? s.data?.kerning : null))
  // Detected: the suggestions measured from the outlines, the pairs not kerned yet.
  const inherit = useDocStore((s) => s.data?.inheritKerning ?? true)
  const docId = useDocStore((s) => s.docId)
  const suggestions = useKernSuggestions((s) => (range.kind === 'detected' && s.docId === docId ? s.map : null))
  const rare = useUIStore((s) => s.searchRare)
  return useMemo(
    () => {
      if (!glyphs) return []
      if (range.kind === 'detected') return suggestions ? detectedPairs(suggestions, kerning ?? new Map(), inherit, rare) : []
      return rangeKeys(range, glyphs, kerning ?? undefined)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, keySig, range.kind === 'glyphs' || range.kind === 'ligatures' ? glyphs : null, kerning, suggestions, inherit, range.kind === 'detected' && rare]
  )
}
