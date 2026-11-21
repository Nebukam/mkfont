// ============================================================
// Kerning actions: add, edit and remove pairs, show them in the
// Kerning view. Used by the grid, the inspectors, the text preview
// and commands.
// ============================================================

import { useDocStore, transact } from '../stores/doc-store'
import { usePairSelectionStore } from '../stores/selection-store'
import { isPairRange, useUIStore, type RangeRef } from '../stores/ui-store'
import { useInspectorStore } from '../stores/inspector-store'
import { removeKerning, setInheritKerning, setKerning } from '../core/ops'
import { pairKern, pairKey, pairLabel, pairSides } from '../core/kerning'
import { charsToKey, keyToChars, keyToUUni, refToKey, resolveString } from '../core/unicode-keys'
import { writeClipboardText } from '../platform'
import { toast } from '../components/ui/Overlays'
import { offerUndo } from './actions'
import { t } from '../i18n'
import { activeSuggestions } from './kern-suggestions'

/**
 * The two glyphs of a pair typed as text: two characters ("AV", "U+0054U+0041"), or two
 * glyphs separated by a space, which can be ligatures ("fi x").
 */
export function parsePairText(text: string): [string, string] | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  const parts = trimmed.split(/\s+/)
  if (parts.length === 2) {
    const left = refToKey(parts[0])
    const right = refToKey(parts[1])
    return left && right ? [left, right] : null
  }
  if (parts.length > 2) return null
  const chars = Array.from(resolveString(trimmed))
  return chars.length === 2 ? [charsToKey(chars[0]), charsToKey(chars[1])] : null
}

/**
 * Show pairs selected, in the Kerning view (or `view`) unless pairs are shown already: a
 * navigation step (Back returns to the view before).
 */
export function showPairs(keys: string[], opts: { focusValue?: boolean; view?: RangeRef } = {}): void {
  const ui = useUIStore.getState()
  if (!isPairRange(ui.range)) ui.setRange(opts.view ?? { kind: 'kerning' })
  // A search, or "Existing only" (a pair with a glyph not in the font yet), would hide them.
  if (ui.searchText) ui.setSearchText('')
  const glyphs = useDocStore.getState().data?.glyphs
  const missing = keys.some((k) => pairSides(k).some((g) => !glyphs?.has(g)))
  if (missing && useUIStore.getState().searchExists) useUIStore.setState({ searchExists: false })
  const last = keys[keys.length - 1] ?? null
  usePairSelectionStore.getState().setSelection(keys, last)
  ui.reveal(last)
  if (opts.focusValue && keys.length === 1) useInspectorStore.getState().focusPair(keys[0])
}

/** Add a pair at 0 when it is new, and show it with its value field ready. */
export function addPair(left: string, right: string): string {
  const key = pairKey(left, right)
  const exists = !!useDocStore.getState().data?.kerning.has(key)
  if (!exists) {
    transact(t('edit.history.addPair', { pair: pairLabel(key) }), (d) => {
      setKerning(d, [[key, 0]])
    }, { icon: 'kerning' })
  }
  showPairs([key], { focusValue: true })
  if (exists) toast.info(t('edit.kerning.pairExists'))
  return key
}

/** Add the pair typed in a field ("AV", "fi x"); false (and a notice) when it is not a pair. */
export function addPairFromText(text: string): boolean {
  const sides = parsePairText(text)
  if (!sides) {
    toast.info(t('edit.kerning.typeTwo'), t('edit.kerning.typeTwoDetail'))
    return false
  }
  addPair(sides[0], sides[1])
  return true
}

/** History entry name for a change of the pairs' values. */
function setKerningName(keys: string[]): string {
  return keys.length === 1 ? t('edit.history.setKerningPair', { pair: pairLabel(keys[0]) }) : t('edit.history.setKerningPairs', { count: keys.length })
}

/** Set the pairs to one value (`interactive`: scrubbing, merged into one undo step). */
export function setPairValues(keys: string[], value: number, interactive = false): void {
  if (!keys.length || !isFinite(value)) return
  transact(setKerningName(keys), (d) => {
    setKerning(d, keys.map((k) => [k, value] as const))
  }, { mergeKey: interactive ? `kern:${keys.join(',')}` : undefined, icon: 'kerning' })
}

/** Add `delta` to the value each pair has (inherited included). Quick nudges merge into one undo step. */
export function nudgePairs(keys: string[], delta: number): void {
  const data = useDocStore.getState().data
  if (!data || !keys.length) return
  transact(setKerningName(keys), (d) => {
    setKerning(d, keys.map((k) => [k, pairKern(data.kerning, k, data.inheritKerning).value + delta] as const))
  }, { mergeKey: `kern:${keys.join(',')}`, icon: 'kerning' })
}

/**
 * The pairs a suggestion can fill in: those with one that are not kerned yet. Values set by
 * hand, inherited or at 0 are never replaced.
 */
export function suggestable(keys: string[], suggestions: Map<string, number> = activeSuggestions()): string[] {
  const data = useDocStore.getState().data
  if (!data || !suggestions.size) return []
  return keys.filter((k) => suggestions.has(k) && pairKern(data.kerning, k, data.inheritKerning).state === 'none')
}

/** Give the pairs not kerned yet the values measured from the outlines. One undo step. */
export function applySuggestions(keys: string[]): number {
  const suggestions = activeSuggestions()
  const entries = suggestable(keys, suggestions).map((k) => [k, suggestions.get(k)!] as const)
  if (!entries.length) return 0
  const one = entries.length === 1
  const done = transact(one ? t('edit.history.applySuggestionPair', { pair: pairLabel(entries[0][0]) }) : t('edit.history.applySuggestionPairs', { count: entries.length }), (d) => {
    setKerning(d, entries)
  }, { icon: 'kerning' })
  // Many values at once: easy to take back.
  if (done && !one) offerUndo(t('edit.kerning.appliedSuggestions', { count: entries.length }), 'change')
  return done ? entries.length : 0
}

/** Drop the pairs' own values so they follow their base letters again (Á → A). */
export function followBase(keys: string[]): void {
  const kerning = useDocStore.getState().data?.kerning
  const own = keys.filter((k) => kerning?.has(k))
  if (!own.length) return
  transact(own.length === 1 ? t('edit.history.inheritPair', { pair: pairLabel(own[0]) }) : t('edit.history.inheritPairs', { count: own.length }), (d) => {
    removeKerning(d, own)
  }, { icon: 'kerning' })
}

/** Turn inheritance by accented letters on or off for the font. */
export function setInheritance(on: boolean): void {
  transact(on ? t('edit.history.inheritOn') : t('edit.history.inheritOff'), (d) => {
    setInheritKerning(d, on)
  }, { icon: 'kerning' })
}

export function removePairs(keys: string[]): void {
  const kerning = useDocStore.getState().data?.kerning
  const existing = keys.filter((k) => kerning?.has(k))
  if (!existing.length) return
  const one = existing.length === 1
  const done = transact(one ? t('edit.history.removePair', { pair: pairLabel(existing[0]) }) : t('edit.history.removePairs', { count: existing.length }), (d) => {
    removeKerning(d, existing)
  }, { icon: 'delete' })
  // The selection stays as it was: undoing brings the pairs back selected.
  if (done) offerUndo(one ? t('edit.kerning.removedPair', { pair: pairLabel(existing[0]) }) : t('edit.kerning.removedPairs', { count: existing.length }), 'removal')
}

/** Pairs as text, one per line: their characters ("TA"), or their unicode values ("U+0054 U+0041"). */
export function pairsAsText(keys: string[], hex = false): string {
  return keys
    .map((k) => {
      const [left, right] = pairSides(k)
      return hex ? `${keyToUUni(left)} ${keyToUUni(right)}` : keyToChars(left) + keyToChars(right)
    })
    .join('\n')
}

export async function copyPairs(keys: string[], hex = false): Promise<void> {
  if (!keys.length) return
  await writeClipboardText(pairsAsText(keys, hex))
  toast.info(t('edit.kerning.copiedPairs', { count: keys.length }))
}
