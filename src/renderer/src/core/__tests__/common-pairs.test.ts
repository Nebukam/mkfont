import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { COMMON_GROUPS, COMMON_PAIR_COUNT, commonGroupOf, commonPairs, commonRank } from '../common-pairs'
import { baseGlyph, inheritedFrom, inheritingPairs, kerningForExport, pairKern, pairKey, type Kerning } from '../kerning'
import { deserializeMkFont } from '../deserialize'
import { serializeMkFont } from '../serialize'
import { charsToKey } from '../unicode-keys'

const SAMPLE = resolve(__dirname, '../../../public/MkFontExample.mkfont')
const k = (s: string): string => charsToKey(s)
const pair = (s: string): string => {
  const [a, b] = Array.from(s)
  return pairKey(k(a), k(b))
}

describe('common pairs list', () => {
  it('holds the 3,736 ranked pairs, split into sub-lists', () => {
    expect(COMMON_PAIR_COUNT).toBe(3736)
    const sizes = Object.fromEntries(COMMON_GROUPS.map((g) => [g.id, commonPairs(g.id).length]))
    expect(sizes).toEqual({ all: 3466, upper: 798, mixed: 550, lower: 759, punct: 1359, space: 270 })
    // Pairs with a space are kept out of "all", in a list of their own.
    expect(sizes.upper + sizes.mixed + sizes.lower + sizes.punct).toBe(sizes.all)
    expect(sizes.all + sizes.space).toBe(COMMON_PAIR_COUNT)
  })

  it('keeps the rank order and knows each pair’s rank', () => {
    expect(commonRank(pair('TA'))).toBe(17)
    expect(commonRank(pair('E '))).toBe(1)
    expect(commonRank(pair('HH'))).toBeUndefined()
    expect(commonPairs('all')[0]).toBe(pair('të'))
    expect(commonPairs('mixed').slice(0, 4)).toEqual([pair('Ta'), pair('Ve'), pair('Te'), pair('To')])
    const ranks = commonPairs('upper').map((p) => commonRank(p)!)
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  it('sorts pairs by the kind of characters', () => {
    expect(commonGroupOf('T', 'A')).toBe('upper')
    expect(commonGroupOf('T', 'o')).toBe('mixed')
    expect(commonGroupOf('r', 'y')).toBe('lower')
    expect(commonGroupOf('T', '.')).toBe('punct')
    expect(commonGroupOf('“', 'A')).toBe('punct')
    expect(commonGroupOf(' ', 'T')).toBe('space')
  })
})

describe('base letters', () => {
  it('are the decomposition without its marks', () => {
    expect(baseGlyph(k('Á'))).toBe(k('A'))
    expect(baseGlyph(k('ǻ'))).toBe(k('a'))
    expect(baseGlyph('212b')).toBe(k('A')) // Angstrom sign
    expect(baseGlyph(k('ẞ'))).toBeNull()
  })

  it('do not exist for plain letters, letters without decomposition, ligatures or Hangul', () => {
    expect(baseGlyph(k('A'))).toBeNull()
    expect(baseGlyph(k('Ł'))).toBeNull()
    expect(baseGlyph('0066+0069')).toBeNull()
    expect(baseGlyph(k('가'))).toBeNull()
  })
})

describe('inherited kerning', () => {
  const kerning: Kerning = new Map([
    [pair('TA'), -110],
    [pair('AV'), -55],
    [pair('AA'), -10],
    [pair('TÄ'), -70],
    [pair('LA'), 0]
  ])

  it('follows the left base letter, then the right one, then both', () => {
    expect(inheritedFrom(kerning, pair('TÁ'))).toBe(pair('TA'))
    expect(inheritedFrom(kerning, pair('ÁV'))).toBe(pair('AV'))
    expect(inheritedFrom(kerning, pair('ÁÄ'))).toBe(pair('AA'))
    expect(inheritedFrom(kerning, pair('ÁT'))).toBeNull()
  })

  it('gives way to a pair’s own value, and can be turned off', () => {
    expect(pairKern(kerning, pair('TÄ'), true)).toEqual({ state: 'kerned', value: -70, from: null })
    // The pair it would follow is still known (the link button in the inspector).
    expect(inheritedFrom(kerning, pair('TÄ'))).toBe(pair('TA'))
    expect(pairKern(kerning, pair('TÁ'), true)).toEqual({ state: 'inherited', value: -110, from: pair('TA') })
    expect(pairKern(kerning, pair('TÁ'), false)).toEqual({ state: 'none', value: 0, from: null })
    // A base pair checked at 0 passes that on.
    expect(pairKern(kerning, pair('LÁ'), true)).toEqual({ state: 'inherited', value: 0, from: pair('LA') })
  })

  it('reaches exported fonts for the glyphs the font has', () => {
    const glyphs = ['T', 'A', 'Á', 'Ä', 'Å', 'V', 'L'].map(k)
    expect([...inheritingPairs(kerning, glyphs)]).toEqual([
      [pair('TA'), [pair('TÁ'), pair('TÅ')]],
      [pair('AV'), [pair('ÁV'), pair('ÄV'), pair('ÅV')]],
      [
        pair('AA'),
        ['AÁ', 'AÄ', 'AÅ', 'ÁA', 'ÁÁ', 'ÁÄ', 'ÁÅ', 'ÄA', 'ÄÁ', 'ÄÄ', 'ÄÅ', 'ÅA', 'ÅÁ', 'ÅÄ', 'ÅÅ'].map(pair)
      ],
      [pair('LA'), [pair('LÁ'), pair('LÄ'), pair('LÅ')]]
    ])
    const exported = kerningForExport(kerning, glyphs, true)
    const find = (s: string): number | undefined => exported.find((e) => pairKey(e.left, e.right) === pair(s))?.value
    expect(find('TÁ')).toBe(-110)
    expect(find('TÄ')).toBe(-70)
    expect(find('ÄV')).toBe(-55)
    // AÁ follows AA (its right base letter), not AV.
    expect(find('AÁ')).toBe(-10)
    expect(kerningForExport(kerning, glyphs, false)).toHaveLength(kerning.size)
  })

  it('is on by default, and saved only when turned off', () => {
    const { family, glyphs } = deserializeMkFont(readFileSync(SAMPLE, 'utf-8'))
    expect(deserializeMkFont(serializeMkFont(family, glyphs)).inheritKerning).toBe(true)
    const off = serializeMkFont(family, glyphs, { inheritKerning: false })
    expect(JSON.parse(off).data.inheritKerning).toBe(false)
    expect(deserializeMkFont(off).inheritKerning).toBe(false)
    expect(serializeMkFont(family, glyphs, { inheritKerning: true })).toBe(serializeMkFont(family, glyphs))
  })
})
