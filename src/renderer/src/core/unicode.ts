// ============================================================
// Unicode database — categories, blocks, names, decompositions
// ============================================================

import { GC_KEYS, GC_RANGES } from './gc-ranges'
import { UNICODE_BLOCKS, type UnicodeBlock } from './unicode-blocks'
import { codePointToKey, formatKey, glyphLabel, isLigatureKey, keyToCodePoints, keyToDisplayChars } from './unicode-keys'

export { UNICODE_BLOCKS, UCD_VERSION } from './unicode-blocks'
export type { UnicodeBlock } from './unicode-blocks'

// ---- Category colors (v1 palette) --------------------------

export interface CategoryColor {
  name: string
  color: string
}

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  letter: { name: 'Letter', color: '#00ff96' },
  modifier: { name: 'Modifier', color: '#ff0898' },
  mark: { name: 'Mark', color: '#ffea00' },
  number: { name: 'Number', color: '#00a2ff' },
  separator: { name: 'Separator', color: '#686868' },
  other: { name: 'Other', color: '#c5c5c5' },
  punctuation: { name: 'Punctuation', color: '#a77415' },
  symbol: { name: 'Symbol', color: '#4d638e' },
  ligature: { name: 'Ligature', color: '#8aff00' },
  control: { name: 'Control', color: '#ff0000' }
}

// ---- General categories --------------------------------------
// Their names are messages (locales/<lng>/unicode.ts, lib/category-names.ts).

export interface UniSubcategory {
  id: string
  col: string
}

export const SUBCATEGORIES: Record<string, UniSubcategory> = {
  Lu: { id: 'Lu', col: 'letter' },
  Ll: { id: 'Ll', col: 'letter' },
  Lt: { id: 'Lt', col: 'letter' },
  Lm: { id: 'Lm', col: 'modifier' },
  Lo: { id: 'Lo', col: 'modifier' },
  Mn: { id: 'Mn', col: 'mark' },
  Mc: { id: 'Mc', col: 'mark' },
  Me: { id: 'Me', col: 'mark' },
  Nd: { id: 'Nd', col: 'number' },
  Nl: { id: 'Nl', col: 'number' },
  No: { id: 'No', col: 'number' },
  Zs: { id: 'Zs', col: 'separator' },
  Zl: { id: 'Zl', col: 'separator' },
  Zp: { id: 'Zp', col: 'separator' },
  Cc: { id: 'Cc', col: 'control' },
  Cf: { id: 'Cf', col: 'other' },
  Cs: { id: 'Cs', col: 'other' },
  Co: { id: 'Co', col: 'other' },
  Cn: { id: 'Cn', col: 'other' },
  Pc: { id: 'Pc', col: 'punctuation' },
  Pd: { id: 'Pd', col: 'punctuation' },
  Ps: { id: 'Ps', col: 'punctuation' },
  Pe: { id: 'Pe', col: 'punctuation' },
  Pi: { id: 'Pi', col: 'punctuation' },
  Pf: { id: 'Pf', col: 'punctuation' },
  Po: { id: 'Po', col: 'punctuation' },
  Sm: { id: 'Sm', col: 'symbol' },
  Sc: { id: 'Sc', col: 'symbol' },
  Sk: { id: 'Sk', col: 'symbol' },
  So: { id: 'So', col: 'symbol' },
  Liga: { id: 'Liga', col: 'ligature' }
}

export interface UniCategoryGroup {
  id: string
  subs: string[]
}

/** v1 category groups (controls excluded, like v1). */
export const CATEGORY_GROUPS: UniCategoryGroup[] = [
  { id: 'Letter', subs: ['Lu', 'Ll', 'Lt', 'Lm', 'Lo'] },
  { id: 'Mark', subs: ['Mn', 'Mc', 'Me'] },
  { id: 'Number', subs: ['Nd', 'Nl', 'No'] },
  { id: 'Separator', subs: ['Zs', 'Zl', 'Zp'] },
  { id: 'Other', subs: ['Cf', 'Co'] },
  { id: 'Punctuation', subs: ['Pc', 'Pd', 'Ps', 'Pe', 'Pi', 'Pf', 'Po'] },
  { id: 'Symbol', subs: ['Sm', 'Sc', 'Sk', 'So'] }
]

/** General Category code ("Lu", "Mn", …) for a code point; 'Cn' when unassigned. */
export function getGeneralCategory(cp: number): string {
  let lo = 0
  let hi = GC_RANGES.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    const r = GC_RANGES[mid]
    if (cp < r[0]) hi = mid - 1
    else if (cp > r[1]) lo = mid + 1
    else return GC_KEYS[r[2]]
  }
  return 'Cn'
}

export function gcToColorKey(gc: string): string {
  return SUBCATEGORIES[gc]?.col ?? 'other'
}

export function getGlyphGeneralCategory(key: string): string {
  if (isLigatureKey(key)) return 'Liga'
  const cp = parseInt(key, 16)
  return isNaN(cp) ? 'Cn' : getGeneralCategory(cp)
}

/** Color key ("letter", "mark", …) for a glyph key. */
export function getGlyphCategory(key: string): string {
  return gcToColorKey(getGlyphGeneralCategory(key))
}

export function categoryColor(key: string): string {
  return (CATEGORY_COLORS[getGlyphCategory(key)] ?? CATEGORY_COLORS.other).color
}

/** Code points shown in browsable ranges: assigned, not control, not surrogate. */
function isListable(gc: string): boolean {
  return gc !== 'Cn' && gc !== 'Cc' && gc !== 'Cs'
}

/** Whether block and category views list this code point (not unassigned, control or surrogate). */
export function isListedInBlocks(cp: number): boolean {
  return isListable(getGeneralCategory(cp))
}

/** Whether "All characters" lists this code point (it also leaves out private use). */
export function isListedInAll(cp: number): boolean {
  const gc = getGeneralCategory(cp)
  return isListable(gc) && gc !== 'Co'
}

// ---- Range content (cached key lists) -------------------------

const rangeCache = new Map<string, string[]>()

function cached(id: string, build: () => string[]): string[] {
  let list = rangeCache.get(id)
  if (!list) rangeCache.set(id, (list = build()))
  return list
}

/** Keys of all listable code points in [start, end]. */
export function keysInRange(start: number, end: number): string[] {
  return cached(`r:${start}-${end}`, () => {
    const out: string[] = []
    for (const r of GC_RANGES) {
      if (r[1] < start) continue
      if (r[0] > end) break
      if (!isListable(GC_KEYS[r[2]])) continue
      const s = Math.max(r[0], start)
      const e = Math.min(r[1], end)
      for (let cp = s; cp <= e; cp++) out.push(codePointToKey(cp))
    }
    return out
  })
}

export function keysInBlock(block: UnicodeBlock): string[] {
  return keysInRange(block.start, block.end)
}

/** Keys of every code point with the given General Category. */
export function keysInCategory(gc: string): string[] {
  return cached(`gc:${gc}`, () => {
    const out: string[] = []
    const gi = GC_KEYS.indexOf(gc)
    if (gi < 0) return out
    for (const r of GC_RANGES) {
      if (r[2] !== gi) continue
      for (let cp = r[0]; cp <= r[1]; cp++) out.push(codePointToKey(cp))
    }
    return out
  })
}

/** Every listable code point except private use (v1 "All Unicodes"). */
export function allKeys(): string[] {
  return cached('all', () => {
    const out: string[] = []
    for (const r of GC_RANGES) {
      const gc = GC_KEYS[r[2]]
      if (!isListable(gc) || gc === 'Co') continue
      for (let cp = r[0]; cp <= r[1]; cp++) out.push(codePointToKey(cp))
    }
    return out
  })
}

const SURROGATE_BLOCKS = new Set(['High Surrogates', 'High Private Use Surrogates', 'Low Surrogates'])

/** Blocks shown in the content explorer. */
export const BROWSABLE_BLOCKS: UnicodeBlock[] = UNICODE_BLOCKS.filter((b) => !SURROGATE_BLOCKS.has(b.name))

export function findBlock(cp: number): UnicodeBlock | undefined {
  let lo = 0
  let hi = UNICODE_BLOCKS.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    const b = UNICODE_BLOCKS[mid]
    if (cp < b.start) hi = mid - 1
    else if (cp > b.end) lo = mid + 1
    else return b
  }
  return undefined
}

// ---- Names & decompositions (lazy loaded) ---------------------

interface UcdNames {
  version: string
  names: Record<string, string>
  decomp: Record<string, string>
  nameRanges: [number, number, string][]
}

let ucd: UcdNames | null = null
let ucdPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

export function isUnicodeDbLoaded(): boolean {
  return ucd !== null
}

export function onUnicodeDbLoaded(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function loadUnicodeDb(): Promise<void> {
  if (ucdPromise) return ucdPromise
  ucdPromise = import('../data/ucd-names.json').then((mod) => {
    ucd = (mod.default ?? mod) as unknown as UcdNames
    relativesMap = null
    for (const fn of listeners) fn()
  })
  return ucdPromise
}

/** For tests / Node usage. */
export function setUnicodeDb(data: UcdNames): void {
  ucd = data
  relativesMap = null
}

const HANGUL_L = ['G', 'GG', 'N', 'D', 'DD', 'R', 'M', 'B', 'BB', 'S', 'SS', '', 'J', 'JJ', 'C', 'K', 'T', 'P', 'H']
const HANGUL_V = ['A', 'AE', 'YA', 'YAE', 'EO', 'E', 'YEO', 'YE', 'O', 'WA', 'WAE', 'OE', 'YO', 'U', 'WEO', 'WE', 'WI', 'YU', 'EU', 'YI', 'I']
const HANGUL_T = ['', 'G', 'GG', 'GS', 'N', 'NJ', 'NH', 'D', 'L', 'LG', 'LM', 'LB', 'LS', 'LT', 'LP', 'LH', 'M', 'B', 'BS', 'S', 'SS', 'NG', 'J', 'C', 'K', 'T', 'P', 'H']
const S_BASE = 0xac00
const S_COUNT = 11172
const N_COUNT = 588
const T_COUNT = 28

function hangulDecomposition(cp: number): number[] | null {
  const s = cp - S_BASE
  if (s < 0 || s >= S_COUNT) return null
  const l = 0x1100 + Math.floor(s / N_COUNT)
  const v = 0x1161 + Math.floor((s % N_COUNT) / T_COUNT)
  const t = 0x11a7 + (s % T_COUNT)
  return t === 0x11a7 ? [l, v] : [l, v, t]
}

/** Character name for a code point, or null when unknown / not loaded. */
export function getCodePointName(cp: number): string | null {
  if (!ucd) return null
  const n = ucd.names[cp.toString(16)]
  if (n) return n
  for (const [s, e, prefix] of ucd.nameRanges) {
    if (cp < s || cp > e) continue
    if (prefix === '#HANGUL') {
      const i = cp - S_BASE
      return `HANGUL SYLLABLE ${HANGUL_L[Math.floor(i / N_COUNT)]}${HANGUL_V[Math.floor((i % N_COUNT) / T_COUNT)]}${HANGUL_T[i % T_COUNT]}`
    }
    return prefix + cp.toString(16).toUpperCase().padStart(4, '0')
  }
  return null
}

/** Display name for a glyph key (ligatures get v1's "LIGATURE xyz"). */
export function getKeyName(key: string): string | null {
  if (isLigatureKey(key)) return `LIGATURE ${keyToDisplayChars(key)}`
  const cp = parseInt(key, 16)
  return isNaN(cp) ? null : getCodePointName(cp)
}

/** A Unicode name as people write it: "LATIN SMALL LETTER A" → "Latin Small Letter A". */
export function titleCaseName(name: string): string {
  return name.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase())
}

/**
 * A glyph as screen readers should hear it: characters, U+ code and Unicode name
 * ("é U+00E9 Latin Small Letter E With Acute"). Names come once the Unicode data has loaded.
 */
export function glyphSpokenName(key: string): string {
  const chars = glyphLabel(key)
  const code = formatKey(key)
  const name = getKeyName(key)
  // glyphLabel falls back to the code for characters that show nothing.
  return [chars === code ? null : chars, code, name && titleCaseName(name)].filter(Boolean).join(' ')
}

export interface Decomposition {
  /** Compatibility tag like "compat", "font", "super"; null for canonical. */
  tag: string | null
  keys: string[]
}

export function getDecomposition(key: string): Decomposition | null {
  if (isLigatureKey(key)) {
    const cps = keyToCodePoints(key)
    return cps.length > 1 ? { tag: 'ligature', keys: cps.map(codePointToKey) } : null
  }
  const cp = parseInt(key, 16)
  if (isNaN(cp)) return null
  const hangul = hangulDecomposition(cp)
  if (hangul) return { tag: null, keys: hangul.map(codePointToKey) }
  if (!ucd) return null
  const raw = ucd.decomp[cp.toString(16)]
  if (!raw) return null
  const parts = raw.split(' ')
  let tag: string | null = null
  if (parts[0].startsWith('<')) tag = parts.shift()!.slice(1, -1)
  return { tag, keys: parts.map((h) => h.padStart(4, '0')) }
}

/** v1 `comp`: decomposition with at least two parts (used to auto-create components). */
export function getComposition(key: string): string[] | null {
  const d = getDecomposition(key)
  return d && d.keys.length >= 2 ? d.keys : null
}

let relativesMap: Map<string, Set<string>> | null = null

function buildRelatives(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  const link = (a: string, b: string): void => {
    if (a === b) return
    let s = map.get(a)
    if (!s) map.set(a, (s = new Set()))
    s.add(b)
  }
  if (ucd) {
    for (const [hex, raw] of Object.entries(ucd.decomp)) {
      const key = hex.padStart(4, '0')
      for (const part of raw.split(' ')) {
        if (part.startsWith('<')) continue
        const ref = part.padStart(4, '0')
        link(key, ref)
        link(ref, key)
      }
    }
  }
  return map
}

/** v1 `relatives`: characters sharing a decomposition link with this one. */
export function getRelatives(key: string): string[] {
  if (isLigatureKey(key)) return keyToCodePoints(key).map(codePointToKey)
  if (!relativesMap) relativesMap = buildRelatives()
  const out = new Set(relativesMap.get(key) ?? [])
  const cp = parseInt(key, 16)
  const hangul = hangulDecomposition(cp)
  if (hangul) for (const j of hangul) out.add(codePointToKey(j))
  return [...out]
}

// ---- Info ------------------------------------------------------

export interface UnicodeInfo {
  key: string
  chars: string
  name: string | null
  gc: string
  category: string
  block: UnicodeBlock | undefined
}

export function getUnicodeInfo(key: string): UnicodeInfo {
  const gc = getGlyphGeneralCategory(key)
  const first = keyToCodePoints(key)[0] ?? 0
  return {
    key,
    chars: keyToDisplayChars(key),
    name: getKeyName(key),
    gc,
    category: gcToColorKey(gc),
    block: isLigatureKey(key) ? undefined : findBlock(first)
  }
}

// ---- Search (v1 SettingsSearchDataBlock._Check) -----------------

export interface SearchQuery {
  /** Exact single-character terms (case sensitive, like v1). */
  terms: string[]
  /** Upper-cased terms of length > 1, matched against names. */
  upperTerms: string[]
  /** Upper-cased single-character terms, matched against single-letter name words. */
  upperIndexed: string[]
}

export function parseSearch(input: string, resolve: (s: string) => string): SearchQuery {
  const terms = resolve(input)
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
  const upperTerms: string[] = []
  const upperIndexed: string[] = []
  for (const t of terms) {
    if (Array.from(t).length > 1) upperTerms.push(t.toUpperCase())
    else upperIndexed.push(t.toUpperCase())
  }
  return { terms, upperTerms, upperIndexed }
}

/** Single-letter words of a character name ("LATIN SMALL LETTER A" → ["A"]). */
function indexedLetters(name: string): string[] {
  return name.split(' ').filter((w) => w.length === 1)
}

export function matchesSearch(key: string, q: SearchQuery, extraIds: string[] = []): boolean {
  const chars = keyToDisplayChars(key)
  if (chars) {
    const single = Array.from(chars).length === 1
    for (const t of q.terms) {
      if (single ? chars === t : chars.includes(t)) return true
    }
  }
  const name = getKeyName(key)
  if (name) {
    for (const t of q.upperTerms) if (name.includes(t)) return true
    if (q.upperIndexed.length) {
      const letters = indexedLetters(name)
      for (const t of q.upperIndexed) if (letters.includes(t)) return true
    }
  }
  for (const id of extraIds) {
    const upper = id.toUpperCase()
    for (const t of q.terms) if (upper.includes(t.toUpperCase())) return true
  }
  return false
}
