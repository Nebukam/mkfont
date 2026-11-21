// ============================================================
// Suggested kerning for the active font, measured from its outlines
// (core/detect-kerning.ts). Measured again in the background once
// edits pause, so views and actions read it without measuring.
// ============================================================

import { useEffect } from 'react'
import { create } from 'zustand'
import { useDocStore } from '../stores/doc-store'
import { fontSuggestions } from '../core/detect-kerning'
import { pairKern, type Kerning } from '../core/kerning'
import { commonRank } from '../core/common-pairs'

interface SuggestionState {
  /** The document they were measured for. */
  docId: number
  /** Measured once at least: until then the map is empty because nothing was measured yet. */
  ready: boolean
  /** Pair key → suggested value (negative: tighten). */
  map: Map<string, number>
}

export const useKernSuggestions = create<SuggestionState>()(() => ({ docId: -1, ready: false, map: new Map() }))

/** Edits wait for a pause before the font is measured again. */
const DELAY = 300

/** Keeps the active font's suggestions up to date (mounted once, by the workspace). */
export function useSuggestionUpdater(): void {
  const docId = useDocStore((s) => s.docId)
  const revision = useDocStore((s) => s.revision)
  useEffect(() => {
    // Another font: never the last one's suggestions, not even until it is measured.
    const fresh = useKernSuggestions.getState().docId !== docId
    if (fresh) useKernSuggestions.setState({ docId, ready: false, map: new Map() })
    const timer = window.setTimeout(
      () => {
        const s = useDocStore.getState()
        if (!s.data || s.docId !== docId) return
        useKernSuggestions.setState({ docId, ready: true, map: fontSuggestions(s.data.family, s.data.glyphs, s.computed, s.data.inheritKerning) })
      },
      fresh ? 0 : DELAY
    )
    return () => window.clearTimeout(timer)
  }, [docId, revision])
}

/** The suggestions of the active font (none while they belong to another one). */
export function activeSuggestions(): Map<string, number> {
  const s = useKernSuggestions.getState()
  return s.docId === useDocStore.getState().docId ? s.map : new Map()
}

/**
 * The Detected list: suggested pairs the font does not kern yet (no value of their own,
 * none inherited, not at 0). Pairs of the common list come first, by rank; with `rare`,
 * the others follow, strongest first.
 */
export function detectedPairs(suggestions: Map<string, number>, kerning: Kerning, inherit: boolean, rare: boolean): string[] {
  const common: string[] = []
  const others: string[] = []
  for (const key of suggestions.keys()) {
    if (pairKern(kerning, key, inherit).state !== 'none') continue
    if (commonRank(key)) common.push(key)
    else if (rare) others.push(key)
  }
  common.sort((a, b) => commonRank(a)! - commonRank(b)!)
  others.sort((a, b) => suggestions.get(a)! - suggestions.get(b)!)
  return [...common, ...others]
}

/**
 * A list of pairs with the detected ones first: those the Detected view lists (a suggested
 * value, not kerned yet). Each part keeps its order.
 */
export function detectedFirst(keys: string[], suggestions: Map<string, number>, kerning: Kerning, inherit: boolean): string[] {
  const detected: string[] = []
  const rest: string[] = []
  for (const key of keys) (suggestions.has(key) && pairKern(kerning, key, inherit).state === 'none' ? detected : rest).push(key)
  return [...detected, ...rest]
}
