import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { produce, enableMapSet } from 'immer'
import { deserializeMkFont, parseKerning } from '../deserialize'
import { serializeMkFont } from '../serialize'
import { comparePairs, isPairKey, kerningList, pairKey, pairLabel, pairSides, pairsOfGlyph, replacingLigature, type Kerning } from '../kerning'
import { createFamily, createGlyph } from '../model'
import { removeKerning, setFamilyValues, setKerning, type DocData } from '../ops'
import { filterPairs } from '../../hooks/doc'
import type { Glyph } from '../../types/font'

enableMapSet()

const SAMPLE = resolve(__dirname, '../../../public/MkFontExample.mkfont')
const T = '0054'
const A = '0041'
const o = '006f'
const FI = '0066+0069'

describe('pair keys', () => {
  it('join two glyph keys, ligatures included', () => {
    const k = pairKey(FI, '0078')
    expect(k).toBe('0066+0069|0078')
    expect(isPairKey(k)).toBe(true)
    expect(isPairKey(FI)).toBe(false)
    expect(pairSides(k)).toEqual([FI, '0078'])
  })

  it('read as text: joined for two characters, spaced when a side is a ligature or invisible', () => {
    expect(pairLabel(pairKey(T, A))).toBe('TA')
    expect(pairLabel(pairKey(FI, '0078'))).toBe('fi x')
    expect(pairLabel(pairKey('0020', A))).toBe('␣A')
    expect(pairLabel(pairKey('00a0', A))).toBe('U+00A0 A')
  })

  it('sort by left glyph, then right glyph, single characters before ligatures', () => {
    const keys = [pairKey(T, o), pairKey(A, T), pairKey(FI, A), pairKey(T, A)]
    expect(keys.sort(comparePairs)).toEqual([pairKey(A, T), pairKey(T, A), pairKey(T, o), pairKey(FI, A)])
  })

  it('list the pairs of a glyph on each side', () => {
    const k: Kerning = new Map([
      [pairKey(T, A), -110],
      [pairKey(A, T), -100],
      [pairKey(T, o), -150],
      [pairKey(T, T), 0]
    ])
    expect(pairsOfGlyph(k, T)).toEqual({ left: [pairKey(T, A), pairKey(T, T), pairKey(T, o)], right: [pairKey(A, T), pairKey(T, T)] })
    expect(kerningList(new Map([[pairKey(T, A), -110]]))).toEqual([{ left: T, right: A, value: -110 }])
  })

  it('know the ligature that replaces a pair', () => {
    const has = (k: string): boolean => k === `${T}+002e`
    expect(replacingLigature(pairKey(T, '002e'), has)).toBe(`${T}+002e`)
    expect(replacingLigature(pairKey(T, A), has)).toBeNull()
  })
})

describe('kerning in .mkfont files', () => {
  const sample = readFileSync(SAMPLE, 'utf-8')

  it('round-trips, in glyph order', () => {
    const { family, glyphs } = deserializeMkFont(sample)
    const kerning: Kerning = new Map([
      [pairKey(T, o), -150],
      [pairKey(A, T), -100],
      [pairKey(FI, '0078'), -20],
      [pairKey(T, A), 0]
    ])
    const json = serializeMkFont(family, glyphs, { kerning })
    expect(JSON.parse(json).data.kerning).toEqual([
      [A, T, -100],
      [T, A, 0],
      [T, o, -150],
      [FI, '0078', -20]
    ])
    expect(deserializeMkFont(json).kerning).toEqual(kerning)
  })

  it('leaves files without pairs exactly as before (no key)', () => {
    const { family, glyphs } = deserializeMkFont(sample)
    const json = serializeMkFont(family, glyphs, { kerning: new Map() })
    expect(json).toBe(serializeMkFont(family, glyphs))
    expect('kerning' in JSON.parse(json).data).toBe(false)
    expect(deserializeMkFont(json).kerning.size).toBe(0)
  })

  it('skips malformed entries and normalizes keys', () => {
    const k = parseKerning([
      ['U+0054', '41', -110],
      ['0054', '006F', -150.5],
      ['0054', '0041'],
      ['0054', 'x|y', 10],
      ['nope', '0041', 10],
      [1, 2, 3],
      'TA',
      ['0054', '0041', Infinity]
    ])
    expect([...k]).toEqual([
      [pairKey(T, A), -110],
      [pairKey(T, o), -150.5]
    ])
    expect(parseKerning({ TA: -1 }).size).toBe(0)
  })
})

describe('kerning edits', () => {
  const doc = (): DocData => ({ family: createFamily(), glyphs: new Map(), kerning: new Map([[pairKey(T, A), -100]]), inheritKerning: true })

  it('set, add and remove pairs', () => {
    const next = produce(doc(), (d) => {
      setKerning(d, [
        [pairKey(T, A), -110],
        [pairKey(A, T), -90],
        [pairKey(A, A), NaN]
      ])
      removeKerning(d, [pairKey(A, T)])
    })
    expect([...next.kerning]).toEqual([[pairKey(T, A), -110]])
  })

  it('scale with the EM when metrics are resampled', () => {
    const next = produce(doc(), (d) => {
      setFamilyValues(d, { em: 2000 })
    })
    expect(next.kerning.get(pairKey(T, A))).toBe(-200)
    const kept = produce(doc(), (d) => {
      setFamilyValues(d, { em: 2000, 'em-resample': false })
    })
    expect(kept.kerning.get(pairKey(T, A))).toBe(-100)
  })
})

describe('searching pairs', () => {
  const family = createFamily()
  const glyphs = new Map<string, Glyph>([T, A, o].map((k) => [k, createGlyph(k, family.transforms as never)]))
  const base = [pairKey(A, T), pairKey(T, A), pairKey(T, o), pairKey(o, '0076'), pairKey('0056', A)]

  it('matches either glyph of a pair', () => {
    expect(filterPairs(base, glyphs, { text: 'T', exists: false })).toEqual([pairKey(A, T), pairKey(T, A), pairKey(T, o)])
    expect(filterPairs(base, glyphs, { text: 'U+0056', exists: false })).toEqual([pairKey('0056', A)])
  })

  it('matches a pair typed as its two characters', () => {
    expect(filterPairs(base, glyphs, { text: 'TA', exists: false })).toEqual([pairKey(T, A)])
  })

  it('keeps only pairs whose two glyphs exist with "Existing only"', () => {
    expect(filterPairs(base, glyphs, { text: '', exists: true })).toEqual([pairKey(A, T), pairKey(T, A), pairKey(T, o)])
    expect(filterPairs(base, glyphs, { text: 'A', exists: true })).toEqual([pairKey(A, T), pairKey(T, A)])
  })
})
