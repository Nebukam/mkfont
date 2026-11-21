import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { detectKerning, fontSuggestions, glyphProfile, scanLines, type Profile } from '../detect-kerning'
import { baseGlyph, pairKey, pairSides, replacingLigature, type Kerning } from '../kerning'
import { commonRank } from '../common-pairs'
import { createDefaultFamilyValues } from '../model'
import { deserializeMkFont } from '../deserialize'
import { computeAll } from '../compute'
import { codePointToKey } from '../unicode-keys'
import { detectedFirst, detectedPairs } from '../../app/kern-suggestions'
import { addLigatures } from './example-ligatures'

const SAMPLE = resolve(__dirname, '../../../public/MkFontExample.mkfont')

/** Glyph keys of the characters of a text. */
const keysOf = (text: string): string[] => Array.from(text, (c) => codePointToKey(c.codePointAt(0)!))
/** Pair key of two characters ("To"). */
const pair = (text: string): string => {
  const [l, r] = keysOf(text)
  return pairKey(l, r)
}

// Default metrics: EM 1000, baseline at y = 800 (Y-down), caps from y = 100, x-height from y = 296.
const f = createDefaultFamilyValues()
const lines = scanLines(f)

/** Shapes made of boxes: [x1, y1, x2, y2] each. */
const boxes = (...b: [number, number, number, number][]): string => b.map(([x1, y1, x2, y2]) => `M${x1} ${y1} H${x2} V${y2} H${x1} Z`).join(' ')

const SHAPES: Record<string, { path: string; advance: number }> = {
  // Straight sides, 100 units of white on each.
  H: { path: boxes([100, 100, 200, 800], [500, 100, 600, 800], [200, 420, 500, 480]), advance: 700 },
  n: { path: boxes([100, 296, 500, 800]), advance: 600 },
  o: { path: boxes([100, 296, 500, 800]), advance: 600 },
  x: { path: boxes([100, 296, 500, 800]), advance: 600 },
  // A bar over a stem: 300 units of white under the bar on each side.
  T: { path: boxes([0, 100, 700, 200], [300, 200, 400, 800]), advance: 700 },
  '.': { path: boxes([100, 700, 200, 800]), advance: 300 },
  // A descender on the left; a stem with 400 units of white, and a hook reaching far left under it.
  p: { path: boxes([100, 296, 500, 800], [100, 800, 200, 1000]), advance: 600 },
  j: { path: boxes([400, 296, 500, 900], [-250, 900, 500, 1000]), advance: 600 },
  "'": { path: boxes([100, 100, 200, 250]), advance: 300 }
}

function input(): { family: typeof f; lines: typeof lines; profiles: Map<string, Profile> } {
  const profiles = new Map<string, Profile>()
  for (const [ch, s] of Object.entries(SHAPES)) profiles.set(keysOf(ch)[0], glyphProfile(s.path, s.advance, lines))
  return { family: f, lines, profiles }
}

const detect = (texts: string[], opts = {}): Map<string, number> =>
  detectKerning(
    input(),
    texts.map((t) => keysOf(t) as [string, string]),
    opts
  )

describe('glyph profiles', () => {
  const at = (y: number): number => Math.round((y - lines.top) / lines.step)

  it('measure where the ink starts and the white left of the advance, per line', () => {
    const t = glyphProfile(SHAPES.T.path, SHAPES.T.advance, lines)
    expect(t.left[at(150)]).toBe(0)
    expect(t.right[at(150)]).toBe(0)
    expect(t.left[at(500)]).toBe(300)
    expect(t.right[at(500)]).toBe(300)
    expect(t.left[at(50)]).toBeNaN()
    expect(t.first).toBe(at(100))
    expect(t.last).toBe(at(800))
  })

  it('follow curves', () => {
    // A circle of radius 100 around (300, 450): at y = 400 it spans 300 ± 86.6.
    const c = glyphProfile('M200 450 A100 100 0 1 0 400 450 A100 100 0 1 0 200 450 Z', 600, lines)
    expect(c.left[at(400)]).toBeCloseTo(213.4, 0)
    expect(c.right[at(400)]).toBeCloseTo(600 - 386.6, 0)
  })

  it('are empty without ink', () => {
    const e = glyphProfile('', 500, lines)
    expect(e.first).toBe(-1)
    expect(e.last).toBe(-1)
  })
})

describe('detecting kerning', () => {
  it('tightens a pair whose outlines leave extra white, by half of it', () => {
    // T over o: 300 + 100 units apart, where H and n sit 100 + 100 apart.
    const s = detect(['To', 'oT', 'T.'])
    expect(s.get(pair('To'))).toBe(-100)
    expect(s.get(pair('oT'))).toBe(-100)
    expect(s.get(pair('T.'))).toBe(-100)
    expect(detect(['To'], { strength: 1 }).get(pair('To'))).toBe(-200)
  })

  it('leaves pairs at their normal spacing alone', () => {
    expect(detect(['HH', 'nn', 'no', 'Hn', 'oo']).size).toBe(0)
  })

  it('skips outlines that do not face each other (an apostrophe over an x)', () => {
    expect(detect(["'x", "x'"]).size).toBe(0)
  })

  it('never brings outlines closer than half the normal spacing at any height (a j hook under a descender)', () => {
    const s = detect(['nj', 'pj'])
    expect(s.get(pair('nj'))).toBe(-150)
    // 150 units apart under the baseline: 50 more is all it can take.
    expect(s.get(pair('pj'))).toBe(-50)
  })

  it('keeps only suggestions past the threshold', () => {
    expect(detect(['To'], { threshold: 150 }).size).toBe(0)
  })
})

describe('the sample font', () => {
  const { family, glyphs } = deserializeMkFont(readFileSync(SAMPLE, 'utf-8'))
  // It has no ligatures: two that replace a pair each.
  addLigatures(family, glyphs, ['T.', 'TT'])
  const computed = computeAll(family, glyphs)
  const s = fontSuggestions(family, glyphs, computed, true)

  it('tightens the classic pairs, not straight sides', () => {
    expect(s.get(pair('To'))).toBeLessThanOrEqual(-80)
    for (const p of ['AV', 'VA', 'TA', 'LT', 'P.', 'F.']) expect(s.get(pair(p))).toBeLessThan(0)
    for (const p of ['HH', 'nn', 'oo', 'no', 'HO', 'Tl']) expect(s.get(pair(p))).toBeUndefined()
  })

  it('leaves out pairs a ligature replaces, symbols, and accented letters while they follow their base letter', () => {
    expect(s.get(pair('T.'))).toBeUndefined()
    expect(s.get(pair('TT'))).toBeUndefined()
    const symbols = new Set(keysOf('_~+=<>|'))
    for (const key of s.keys()) {
      expect(replacingLigature(key, (g) => glyphs.has(g))).toBeNull()
      for (const g of pairSides(key)) {
        expect(baseGlyph(g)).toBeFalsy()
        expect(symbols.has(g)).toBe(false)
      }
    }
  })

  it('measures accented letters too when they kern on their own', () => {
    const own = fontSuggestions(family, glyphs, computed, false)
    expect([...own.keys()].some((k) => pairSides(k).some((g) => baseGlyph(g)))).toBe(true)
  })

  it('gives the same values when measured again (profiles are cached)', () => {
    expect(fontSuggestions(family, glyphs, computed, true)).toEqual(s)
  })
})

describe('the Detected list', () => {
  const AV = pair('AV')
  const TA = pair('TA')
  const AAcuteV = pairKey(codePointToKey(0xc1), keysOf('V')[0])
  const rare = pairKey(codePointToKey(0x416), keysOf('q')[0]) // Жq
  const suggestions = new Map([
    [rare, -120],
    [AV, -50],
    [TA, -100],
    [AAcuteV, -40]
  ])

  it('lists the pairs not kerned yet, common ones by rank, rare ones (on request) strongest first', () => {
    expect(commonRank(rare)).toBeUndefined()
    const kerning: Kerning = new Map()
    const common = [TA, AV, AAcuteV].sort((a, b) => commonRank(a)! - commonRank(b)!)
    expect(detectedPairs(suggestions, kerning, true, false)).toEqual(common)
    expect(detectedPairs(suggestions, kerning, true, true)).toEqual([...common, rare])
  })

  it('leaves out pairs kerned, at 0, or inheriting a value', () => {
    const kerning: Kerning = new Map([
      [AV, -55],
      [TA, 0]
    ])
    // ÁV follows AV.
    expect(detectedPairs(suggestions, kerning, true, true)).toEqual([rare])
    expect(detectedPairs(suggestions, kerning, false, true)).toEqual([AAcuteV, rare])
  })

  it('can put the detected pairs of a list first, each part in its order', () => {
    const plain = pair('xx')
    const list = [plain, AV, TA, pair('oo'), AAcuteV]
    expect(detectedFirst(list, suggestions, new Map(), true)).toEqual([AV, TA, AAcuteV, plain, pair('oo')])
    // Kerned (or inheriting) pairs are not detected any more.
    expect(detectedFirst(list, suggestions, new Map([[AV, -55]]), true)).toEqual([TA, plain, AV, pair('oo'), AAcuteV])
  })
})
