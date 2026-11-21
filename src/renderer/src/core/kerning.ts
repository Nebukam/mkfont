// ============================================================
// Kerning pairs (new in MkFont 2: v1 had none).
//
// A pair is two glyph keys in text order. Its value, in font units, is
// added to the left glyph's advance when the right glyph follows it.
// Either side can be a ligature: kerning applies after ligatures form.
// ============================================================

import { codePointToKey, compareKeys, glyphLabel, isLigatureKey, keyToChars, keyToCodePoints, keyToDisplayChars } from './unicode-keys'

/**
 * Pair key → value. A pair at 0 is kept: it was looked at and needs no kerning
 * (it is not exported). Pairs stay when one of their glyphs is deleted, so
 * re-creating the glyph brings them back; they are not exported meanwhile.
 */
export type Kerning = Map<string, number>

/** Pair keys join the two glyph keys with '|': "0054|0041" is T followed by A. */
const SEP = '|'

export function pairKey(left: string, right: string): string {
  return `${left}${SEP}${right}`
}

export function isPairKey(key: string): boolean {
  return key.includes(SEP)
}

/** The left and right glyph keys of a pair. */
export function pairSides(key: string): [string, string] {
  const i = key.indexOf(SEP)
  return i < 0 ? [key, ''] : [key.slice(0, i), key.slice(i + 1)]
}

const SPACE = '0020'

/** A side of a pair as text: its characters, ␣ for the space, or "U+…" when it shows nothing. */
function sideLabel(key: string): string {
  return key === SPACE ? '␣' : glyphLabel(key)
}

/** One visible character (or the space's ␣): it can be written next to the other side without a gap. */
function isPlainChar(key: string): boolean {
  if (key === SPACE) return true
  const cps = keyToCodePoints(key)
  return cps.length === 1 && glyphLabel(key) === keyToDisplayChars(key) && !/\s/u.test(keyToDisplayChars(key))
}

/** A pair as text: "TA", "E␣", or "fi x" and "U+00A0 A" when a side is a ligature or shows nothing. */
export function pairLabel(key: string): string {
  const [left, right] = pairSides(key)
  return isPlainChar(left) && isPlainChar(right) ? sideLabel(left) + sideLabel(right) : `${sideLabel(left)} ${sideLabel(right)}`
}

/** Pairs in glyph order: by left glyph, then by right glyph. */
export function comparePairs(a: string, b: string): number {
  const [al, ar] = pairSides(a)
  const [bl, br] = pairSides(b)
  return compareKeys(al, bl) || compareKeys(ar, br)
}

/** The pairs a glyph is part of: with the glyph on the left, and on the right. */
export function pairsOfGlyph(kerning: Kerning, glyph: string): { left: string[]; right: string[] } {
  const left: string[] = []
  const right: string[] = []
  for (const key of kerning.keys()) {
    const [l, r] = pairSides(key)
    if (l === glyph) left.push(key)
    if (r === glyph) right.push(key)
  }
  return { left: left.sort(comparePairs), right: right.sort(comparePairs) }
}

/**
 * The ligature that replaces a pair in text, when the font has one: kerning applies after
 * ligatures form, so the pair is never used while ligatures are on.
 */
export function replacingLigature(key: string, has: (glyph: string) => boolean): string | null {
  const [left, right] = pairSides(key)
  const lig = `${left}+${right}`
  return has(lig) ? lig : null
}

/** The pair's glyphs missing from the font (a missing pair is kept, but not exported). */
export function missingSides(key: string, has: (glyph: string) => boolean): string[] {
  return pairSides(key).filter((g) => !has(g))
}

/** The pairs as the font export takes them (glyph keys and values). */
export function kerningList(kerning: Kerning): { left: string; right: string; value: number }[] {
  return [...kerning].map(([key, value]) => {
    const [left, right] = pairSides(key)
    return { left, right, value }
  })
}

// ---- Inheritance: accented letters follow their base letter ------------

const baseCache = new Map<string, string | null>()

/**
 * A glyph's base letter: its canonical decomposition without the marks (Á → A, ǻ → a).
 * Null for glyphs that are not a letter plus marks (ligatures, Hangul syllables…).
 */
export function baseGlyph(key: string): string | null {
  const cached = baseCache.get(key)
  if (cached !== undefined) return cached
  let base: string | null = null
  if (!isLigatureKey(key)) {
    const nfd = keyToChars(key).normalize('NFD')
    const first = nfd.codePointAt(0)
    if (first !== undefined) {
      const rest = nfd.slice(String.fromCodePoint(first).length)
      if (rest && /^\p{M}+$/u.test(rest)) base = codePointToKey(first)
    }
  }
  baseCache.set(key, base)
  return base
}

/**
 * The pair whose value a pair follows when it has none of its own: with its left glyph's
 * base letter (ÁV → AV), with its right glyph's (TÁ → TA), then with both (ÁÄ → AA).
 * Null when the font has none of them.
 */
export function inheritedFrom(kerning: Kerning, key: string): string | null {
  const [left, right] = pairSides(key)
  const bl = baseGlyph(left)
  const br = baseGlyph(right)
  for (const candidate of [bl && pairKey(bl, right), br && pairKey(left, br), bl && br && pairKey(bl, br)]) {
    if (candidate && kerning.has(candidate)) return candidate
  }
  return null
}

/** How a pair is kerned: its own value, at 0 (checked, no kerning), inherited, or not at all. */
export type PairState = 'kerned' | 'zero' | 'inherited' | 'none'

export interface PairKern {
  state: PairState
  /** The value that applies (0 when none). */
  value: number
  /** The pair the value is inherited from (state 'inherited'). */
  from: string | null
}

export function pairKern(kerning: Kerning, key: string, inherit: boolean): PairKern {
  const own = kerning.get(key)
  if (own !== undefined) return { state: own === 0 ? 'zero' : 'kerned', value: own, from: null }
  const from = inherit ? inheritedFrom(kerning, key) : null
  if (from) return { state: 'inherited', value: kerning.get(from)!, from }
  return { state: 'none', value: 0, from: null }
}

/**
 * With inheritance: for each of the font's pairs, the pairs of its glyphs that follow it
 * (pair key → keys of the pairs inheriting its value). Pairs with a value of their own
 * are not in it.
 */
export function inheritingPairs(kerning: Kerning, glyphs: Iterable<string>): Map<string, string[]> {
  const variants = new Map<string, string[]>()
  for (const g of glyphs) {
    const base = baseGlyph(g)
    if (!base) continue
    const list = variants.get(base)
    if (list) list.push(g)
    else variants.set(base, [g])
  }
  const out = new Map<string, string[]>()
  if (!variants.size) return out
  for (const source of kerning.keys()) {
    const [x, y] = pairSides(source)
    const lefts = [x, ...(variants.get(x) ?? [])]
    const rights = [y, ...(variants.get(y) ?? [])]
    const keys: string[] = []
    for (const l of lefts) {
      for (const r of rights) {
        const key = pairKey(l, r)
        if (key !== source && !kerning.has(key) && inheritedFrom(kerning, key) === source) keys.push(key)
      }
    }
    if (keys.length) out.set(source, keys)
  }
  return out
}

/** The pairs exported fonts get: the font's own, plus (with inheritance) those inherited. */
export function kerningForExport(kerning: Kerning, glyphs: Iterable<string>, inherit: boolean): { left: string; right: string; value: number }[] {
  const out = kerningList(kerning)
  if (!inherit) return out
  for (const [source, keys] of inheritingPairs(kerning, glyphs)) {
    const value = kerning.get(source)!
    for (const k of keys) {
      const [left, right] = pairSides(k)
      out.push({ left, right, value })
    }
  }
  return out
}
