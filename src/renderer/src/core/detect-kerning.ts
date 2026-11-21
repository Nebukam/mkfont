// ============================================================
// Kerning detection: pairs whose spacing looks off, measured from the
// font's own outlines.
//
// Each glyph's edges are sampled on horizontal lines: where its ink
// starts on the left, and how much white is left of its advance on the
// right. For a pair, the closest approach of the two outlines over the
// heights both cover is compared with the font's normal spacing (H|H
// beside capitals, n|n beside lowercase letters): half the extra is
// suggested. A "T" over an "o" leaves a wide gap under the bar, so the
// pair gets a negative value; "H" and "n" pairs get none.
//
// Rough by design: a starting point to judge by eye, not a final value.
//
// Credit: based on the potential-pairs step (2_potential_pairs.py) of
// André Fuchs' kerning-pairs project, which also gives MkFont its list of
// common pairs: https://github.com/andre-fuchs/kerning-pairs
// His script rates the sides of each character by hand in five height
// zones, from ascender to descender (reaching out, normal or set in), and
// lists a pair when a facing side reaches out and the two sides never
// collide. Here the sides are measured from the font's outlines at a much
// finer resolution, and the white they leave is turned into a value.
// ============================================================

import svgpath from 'svgpath'
import type { Family, FamilyValues, Glyph } from '../types/font'
import { isEmptyPathContent } from './model'
import { advanceWidth, type ComputedMap, type VariantComputed } from './compute'
import { baseGlyph, pairKey, replacingLigature } from './kerning'
import { commonGlyphKeys } from './common-pairs'
import { getGlyphGeneralCategory } from './unicode'
import { codePointToKey } from './unicode-keys'

/** Horizontal sampling lines across the font's vertical frame (font units, Y-down). */
export interface Lines {
  top: number
  step: number
  count: number
}

export function scanLines(f: FamilyValues): Lines {
  const top = Math.min(0, f.baseline - f.ascent)
  const bottom = Math.max(f.em, f.baseline - f.descent)
  const step = Math.max(1, f.em / 200)
  return { top, step, count: Math.ceil((bottom - top) / step) + 1 }
}

/** A glyph's edges, per line: NaN where the line crosses no ink. */
export interface Profile {
  /** Where the ink starts, from the glyph's origin. */
  left: Float64Array
  /** The white between the ink and the advance. */
  right: Float64Array
  /** First and last lines with ink (-1 when the glyph has none). */
  first: number
  last: number
}

/** Curves are cut into this many straight pieces. */
const CURVE_STEPS = 12

export function glyphProfile(path: string, advance: number, lines: Lines): Profile {
  const lo = new Float64Array(lines.count).fill(Infinity)
  const hi = new Float64Array(lines.count).fill(-Infinity)
  const edge = (x1: number, y1: number, x2: number, y2: number): void => {
    if (y1 === y2) return
    const ymin = Math.min(y1, y2)
    const ymax = Math.max(y1, y2)
    const i0 = Math.max(0, Math.ceil((ymin - lines.top) / lines.step))
    const i1 = Math.min(lines.count - 1, Math.floor((ymax - lines.top) / lines.step))
    for (let i = i0; i <= i1; i++) {
      const y = lines.top + i * lines.step
      const x = x1 + ((y - y1) / (y2 - y1)) * (x2 - x1)
      if (x < lo[i]) lo[i] = x
      if (x > hi[i]) hi[i] = x
    }
  }
  if (!isEmptyPathContent(path)) {
    let sx = 0
    let sy = 0
    svgpath(path)
      .abs()
      .unshort()
      .unarc()
      .iterate((seg: (string | number)[], _i: number, x: number, y: number) => {
        const n = seg as number[]
        switch (seg[0]) {
          case 'M':
            sx = n[1]
            sy = n[2]
            break
          case 'L':
            edge(x, y, n[1], n[2])
            break
          case 'H':
            edge(x, y, n[1], y)
            break
          case 'V':
            edge(x, y, x, n[1])
            break
          case 'C': {
            let px = x
            let py = y
            for (let t = 1; t <= CURVE_STEPS; t++) {
              const u = t / CURVE_STEPS
              const a = (1 - u) ** 3
              const b = 3 * (1 - u) ** 2 * u
              const c = 3 * (1 - u) * u * u
              const d = u ** 3
              const qx = a * x + b * n[1] + c * n[3] + d * n[5]
              const qy = a * y + b * n[2] + c * n[4] + d * n[6]
              edge(px, py, qx, qy)
              px = qx
              py = qy
            }
            break
          }
          case 'Q': {
            let px = x
            let py = y
            for (let t = 1; t <= CURVE_STEPS; t++) {
              const u = t / CURVE_STEPS
              const a = (1 - u) ** 2
              const b = 2 * (1 - u) * u
              const d = u * u
              const qx = a * x + b * n[1] + d * n[3]
              const qy = a * y + b * n[2] + d * n[4]
              edge(px, py, qx, qy)
              px = qx
              py = qy
            }
            break
          }
          case 'Z':
          case 'z':
            edge(x, y, sx, sy)
            break
        }
      })
  }
  const left = new Float64Array(lines.count)
  const right = new Float64Array(lines.count)
  let first = -1
  let last = -1
  for (let i = 0; i < lines.count; i++) {
    if (lo[i] === Infinity) {
      left[i] = NaN
      right[i] = NaN
      continue
    }
    left[i] = lo[i]
    right[i] = advance - hi[i]
    if (first < 0) first = i
    last = i
  }
  return { left, right, first, last }
}

/** The smallest value of a side within lines [from, to]; NaN without ink there. */
function closest(side: Float64Array, from: number, to: number): number {
  let m = Infinity
  for (let i = Math.max(0, from); i <= Math.min(side.length - 1, to); i++) if (side[i] < m) m = side[i]
  return m === Infinity ? NaN : m
}

export interface DetectOptions {
  /** Share of the extra white that is suggested (0.5: half). */
  strength?: number
  /** Smallest suggestion kept, in font units (default: 2.5% of the EM). */
  threshold?: number
}

export interface DetectInput {
  family: FamilyValues
  lines: Lines
  /** Profiles of the glyphs that can be measured (glyph key → profile). */
  profiles: Map<string, Profile>
}

const H = codePointToKey(0x48)
const N = codePointToKey(0x6e)

/** Capitals sit beside H, lowercase letters beside n, anything else by its own spacing. */
function referenceGlyph(key: string, profiles: Map<string, Profile>): string {
  const ch = String.fromCodePoint(parseInt(key, 16))
  if (ch !== ch.toLowerCase() && profiles.has(H)) return H
  if (ch !== ch.toUpperCase() && profiles.has(N)) return N
  return key
}

/**
 * Suggested kerning for pairs, by glyph key: negative to tighten. Pairs whose outlines do
 * not share enough height (an apostrophe over an "x") or are already close enough get none,
 * and no suggestion brings two outlines closer than half the normal spacing at any height
 * (a "j" hook under a descender).
 */
export function detectKerning(input: DetectInput, pairs: Iterable<readonly [string, string]>, opts: DetectOptions = {}): Map<string, number> {
  const { family: f, lines, profiles } = input
  const strength = opts.strength ?? 0.5
  const threshold = opts.threshold ?? Math.max(5, Math.round(f.em * 0.025))
  // The heights that count: from the cap height to the baseline, with a little overshoot.
  const pad = f.em * 0.02
  const bandFrom = Math.max(0, Math.ceil((f.baseline - f['cap-height'] - pad - lines.top) / lines.step))
  const bandTo = Math.min(lines.count - 1, Math.floor((f.baseline + pad - lines.top) / lines.step))

  // Each glyph's normal spacing on each side, measured within the band.
  const normal = new Map<string, { left: number; right: number }>()
  const normalOf = (key: string): { left: number; right: number } => {
    let n = normal.get(key)
    if (!n) {
      const ref = profiles.get(referenceGlyph(key, profiles))!
      n = { left: closest(ref.left, bandFrom, bandTo), right: closest(ref.right, bandFrom, bandTo) }
      normal.set(key, n)
    }
    return n
  }

  const out = new Map<string, number>()
  for (const [l, r] of pairs) {
    const a = profiles.get(l)
    const b = profiles.get(r)
    if (!a || !b || a.first < 0 || b.first < 0) continue
    const fromA = Math.max(a.first, bandFrom)
    const toA = Math.min(a.last, bandTo)
    const fromB = Math.max(b.first, bandFrom)
    const toB = Math.min(b.last, bandTo)
    const from = Math.max(fromA, fromB)
    const to = Math.min(toA, toB)
    // The outlines must face each other over at least half of the smaller one's height.
    if (to < from || to - from < 0.5 * Math.min(toA - fromA, toB - fromB)) continue
    let gap = Infinity
    for (let i = from; i <= to; i++) {
      const g = a.right[i] + b.left[i]
      if (g < gap) gap = g
    }
    if (!isFinite(gap)) continue
    const ref = normalOf(l).right + normalOf(r).left
    if (!isFinite(ref)) continue
    // Wherever both have ink (descenders, ascenders too), they stay half the normal spacing apart.
    let touch = gap
    for (let i = Math.max(a.first, b.first); i <= Math.min(a.last, b.last); i++) {
      const g = a.right[i] + b.left[i]
      if (g < touch) touch = g
    }
    const room = Math.max(0, touch - ref / 2)
    const value = Math.max(Math.round((-(gap - ref) * strength) / 5) * 5, -Math.floor(room / 5) * 5)
    if (value <= -threshold) out.set(pairKey(l, r), value)
  }
  return out
}

/** Profiles of computed glyphs: a glyph is measured again only once its outline or advance changed. */
const profileCache = new WeakMap<VariantComputed, { lines: string; advance: number; profile: Profile }>()

/** Punctuation that sits next to letters in text (symbols like _ ~ + only make noise). */
const PUNCTUATION = new Set(Array.from(".,:;-–—'\"‘’‚“”„«»‹›?!¿¡()[]/", (c) => codePointToKey(c.codePointAt(0)!)))

/** Letters, figures and common punctuation are measured. */
function measurable(key: string): boolean {
  const gc = getGlyphGeneralCategory(key)
  return gc.startsWith('L') || gc === 'Nd' || PUNCTUATION.has(key)
}

/**
 * Suggestions for a font: every ordered pair of the characters of the common pairs list
 * that the font draws (accented letters are left out while they follow their base
 * letter), except pairs a ligature replaces.
 */
export function fontSuggestions(
  family: Family,
  glyphs: Map<string, Glyph>,
  computed: ComputedMap,
  inherit: boolean,
  opts: DetectOptions = {}
): Map<string, number> {
  const lines = scanLines(family.values)
  const linesKey = `${lines.top}|${lines.step}|${lines.count}`
  const profiles = new Map<string, Profile>()
  for (const key of commonGlyphKeys()) {
    const c = computed.get(key)?.[0]
    if (!glyphs.has(key) || !c || c.empty || !measurable(key) || (inherit && baseGlyph(key))) continue
    // The advance also follows the font (monospace).
    const advance = advanceWidth(c, family)
    let cached = profileCache.get(c)
    if (!cached || cached.lines !== linesKey || cached.advance !== advance) {
      cached = { lines: linesKey, advance, profile: glyphProfile(c.path, advance, lines) }
      profileCache.set(c, cached)
    }
    if (cached.profile.first >= 0) profiles.set(key, cached.profile)
  }
  const keys = [...profiles.keys()]
  const pairs: [string, string][] = []
  for (const l of keys) for (const r of keys) if (!replacingLigature(pairKey(l, r), (g) => glyphs.has(g))) pairs.push([l, r])
  return detectKerning({ family: family.values, lines, profiles }, pairs, opts)
}
