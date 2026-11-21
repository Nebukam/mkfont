import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { deserializeMkFont } from '../deserialize'
import { serializeMkFont } from '../serialize'
import { computeAll, analyzeDependencies } from '../compute'
import { pathBBox } from '../geometry'

const SAMPLE = resolve(__dirname, '../../../public/MkFontExample.mkfont')

function loadSample(): { raw: any; json: string } {
  const json = readFileSync(SAMPLE, 'utf-8')
  return { raw: JSON.parse(json), json }
}

const close = (a: number, b: number, tol = 0.05): boolean => Math.abs(a - b) <= tol

describe('geometry', () => {
  it('computes tight bounds for cubic curves', () => {
    // Quarter-circle-ish cubic bulging past its control box endpoints
    const b = pathBBox('M0 0C0 -50 100 -50 100 0')
    expect(b.x).toBeCloseTo(0)
    expect(b.width).toBeCloseTo(100)
    expect(b.y).toBeCloseTo(-37.5)
    expect(b.height).toBeCloseTo(37.5)
  })
  it('handles relative, H/V and quadratic commands', () => {
    const b = pathBBox('m10 10h20v20h-20zq10 -20 20 0')
    expect(b.x).toBeCloseTo(10)
    expect(b.y).toBeCloseTo(0)
    expect(b.right).toBeCloseTo(30)
    expect(b.bottom).toBeCloseTo(30)
  })
  it('returns a zero box for the empty placeholder path', () => {
    const b = pathBBox('M 0 0 L 0 0 z')
    expect([b.x, b.y, b.width, b.height]).toEqual([0, 0, 0, 0])
  })
})

// The sample font was last saved by MkFont 2, so the placements and flags in
// the file are this engine's own: these guard against regressions. The engine
// was checked against placements saved by MkFont 1 when it was ported.
describe('saved file fidelity (sample font)', () => {
  const { raw, json } = loadSample()
  const { family, glyphs } = deserializeMkFont(json)
  const dep = analyzeDependencies(glyphs)
  const computed = computeAll(family, glyphs, dep)

  it('loads every glyph', () => {
    expect(glyphs.size).toBe(raw.data.glyphs.length)
  })

  it('reproduces the layer placement saved in the file', () => {
    let compared = 0
    const mismatches: string[] = []
    for (const g of raw.data.glyphs) {
      const key = g.values.unicode.toLowerCase()
      const c = computed.get(key)?.[0]
      const layers = g.variants[0].layers ?? []
      layers.forEach((l: any, i: number) => {
        const saved = l.values.path
        if (!saved || !saved.fit || typeof saved.path !== 'string') return
        const fit = c?.layers[i]?.fit
        if (!fit) {
          mismatches.push(`${key}#${i} not computed (saved width ${saved.width})`)
          return
        }
        compared++
        const ok =
          close(fit.fit.x, saved.fit.x) &&
          close(fit.fit.y, saved.fit.y) &&
          close(fit.width, saved.width) &&
          close(fit.height, saved.height) &&
          close(fit.bbox.x, saved.bbox.x, 0.5) &&
          close(fit.bbox.y, saved.bbox.y, 0.5) &&
          close(fit.bbox.width, saved.bbox.width, 0.5) &&
          close(fit.bbox.height, saved.bbox.height, 0.5)
        if (!ok) {
          mismatches.push(
            `${key}#${i} ref=${l.values['lyr-char']} fit(${fit.fit.x.toFixed(2)},${fit.fit.y.toFixed(2)},${fit.width.toFixed(2)},${fit.height.toFixed(2)}) ` +
              `vs saved(${saved.fit.x.toFixed(2)},${saved.fit.y.toFixed(2)},${saved.width.toFixed(2)},${saved.height.toFixed(2)}) ` +
              `bbox(${fit.bbox.x.toFixed(1)},${fit.bbox.y.toFixed(1)},${fit.bbox.width.toFixed(1)},${fit.bbox.height.toFixed(1)}) vs saved(${saved.bbox.x.toFixed(1)},${saved.bbox.y.toFixed(1)},${saved.bbox.width.toFixed(1)},${saved.bbox.height.toFixed(1)})`
          )
        }
      })
    }
    if (mismatches.length) console.log(`${mismatches.length} mismatches of ${compared}:\n` + mismatches.slice(0, 30).join('\n'))
    expect(compared).toBeGreaterThan(50)
    expect(mismatches).toEqual([])
  })

  it('derives the empty flags saved in the file', () => {
    const diffs: string[] = []
    for (const g of raw.data.glyphs) {
      const key = g.values.unicode.toLowerCase()
      const c = computed.get(key)?.[0]
      if (c && c.empty !== g.variants[0].values.empty) diffs.push(`${key}: computed=${c.empty} saved=${g.variants[0].values.empty}`)
    }
    expect(diffs).toEqual([])
  })

  it('round-trips the file structure', () => {
    const out = JSON.parse(serializeMkFont(family, glyphs, { computed, meta: raw.meta }))
    expect(Object.keys(out)).toEqual(['data', 'meta'])
    expect(out.meta).toEqual(raw.meta)
    expect(out.data.values).toEqual(raw.data.values)
    expect(out.data.transforms).toEqual(raw.data.transforms)
    expect(out.data.selections).toEqual(raw.data.selections)
    expect(out.data.glyphs.length).toBe(raw.data.glyphs.length)
    for (let i = 0; i < raw.data.glyphs.length; i++) {
      const a = raw.data.glyphs[i]
      const b = out.data.glyphs[i]
      expect(b.values).toEqual(a.values)
      expect(!!b.isLiga).toBe(!!a.isLiga)
      const va = a.variants[0]
      const vb = b.variants[0]
      expect(vb.transforms).toEqual(va.transforms)
      for (const k of ['width', 'height', 'do-export', 'flatten-layers', 'flatten-mode']) expect(vb.values[k]).toEqual(va.values[k])
      expect(vb.values['path-data'].path).toEqual(va.values['path-data'].path)
      expect((vb.layers ?? []).length).toBe((va.layers ?? []).length)
      const la = va.layers ?? []
      const lb = vb.layers ?? []
      for (let j = 0; j < la.length; j++) {
        // Same keys as v1 writes. v1 marks a layer as control when 'lyr-control'
        // is present at all, so it must only appear on the control layer.
        expect(Object.keys(lb[j].values), `${a.values.unicode} layer ${j}`).toEqual(Object.keys(la[j].values))
        expect(lb[j].values['lyr-control']).toEqual(la[j].values['lyr-control'])
      }
    }
  })
})

import ucdData from '../../data/ucd-names.json'
import {
  setUnicodeDb,
  getKeyName,
  getDecomposition,
  getComposition,
  getRelatives,
  parseSearch,
  matchesSearch,
  keysInBlock,
  BROWSABLE_BLOCKS,
  getGeneralCategory
} from '../unicode'
import { resolveString, refToKey, normalizeKey, parseUserKey, charsToKey, keyToChars, glyphLabel, glyphsValues } from '../unicode-keys'

describe('unicode database', () => {
  setUnicodeDb(ucdData as any)

  it('names characters, ranges and hangul syllables', () => {
    expect(getKeyName('0041')).toBe('LATIN CAPITAL LETTER A')
    expect(getKeyName('4e00')).toBe('CJK UNIFIED IDEOGRAPH-4E00')
    expect(getKeyName('ac00')).toBe('HANGUL SYLLABLE GA')
    expect(getKeyName('d4db')).toBe('HANGUL SYLLABLE PWILH')
    expect(getKeyName('0066+0069')).toBe('LIGATURE fi')
  })

  it('decomposes characters (v1 comp)', () => {
    expect(getDecomposition('00c0')).toEqual({ tag: null, keys: ['0041', '0300'] })
    expect(getDecomposition('fb01')).toEqual({ tag: 'compat', keys: ['0066', '0069'] })
    expect(getComposition('00c0')).toEqual(['0041', '0300'])
    expect(getComposition('0041')).toBeNull()
    expect(getComposition('ac01')).toEqual(['1100', '1161', '11a8'])
  })

  it('links relatives both ways', () => {
    expect(getRelatives('0041')).toContain('00c0')
    expect(getRelatives('00c0')).toContain('0041')
  })

  it('searches inclusively like v1', () => {
    const q = parseSearch('a', resolveString)
    expect(matchesSearch('0061', q)).toBe(true) // exact char
    expect(matchesSearch('0041', q)).toBe(true) // indexed letter A
    expect(matchesSearch('00e0', q)).toBe(true) // a with grave
    expect(matchesSearch('0062', q)).toBe(false)
    const q2 = parseSearch('grave', resolveString)
    expect(matchesSearch('00e0', q2)).toBe(true)
    expect(matchesSearch('0061', q2)).toBe(false)
    const q3 = parseSearch('U+0042', resolveString)
    expect(matchesSearch('0042', q3)).toBe(true)
  })

  it('lists block content without controls', () => {
    const basic = BROWSABLE_BLOCKS.find((b) => b.name === 'Basic Latin')!
    const keys = keysInBlock(basic)
    expect(keys[0]).toBe('0020')
    expect(keys[keys.length - 1]).toBe('007e')
    expect(keys.length).toBe(95)
    expect(getGeneralCategory(0x41)).toBe('Lu')
  })
})

describe('glyph labels', () => {
  it('names glyphs by their characters, or by code when those show nothing', () => {
    expect(glyphLabel('0041')).toBe('A')
    expect(glyphLabel('0066+0069')).toBe('fi')
    expect(glyphLabel('0020')).toBe('U+0020')
    expect(glyphLabel('e010')).toBe('U+E010')
    expect(glyphLabel('0001')).toBe('U+0001')
    expect(glyphsValues(['0041'])).toEqual({ count: 1, glyph: 'A' })
    expect(glyphsValues(['0041', '0042'])).toEqual({ count: 2, glyph: 'A' })
  })
})

describe('unicode keys', () => {
  it('resolves references like v1 ResolveString', () => {
    expect(resolveString('U+0041')).toBe('A')
    expect(resolveString('aU+0042')).toBe('aB')
    expect(resolveString('U+0041U+0042')).toBe('AB')
    expect(resolveString('U+0041-bc')).toBe('Abc')
    expect(refToKey('E')).toBe('0045')
    expect(refToKey('fi')).toBe('0066+0069')
    expect(refToKey('😀')).toBe('1f600')
    expect(normalizeKey('U+0041')).toBe('0041')
    expect(normalizeKey('0066+0069')).toBe('0066+0069')
    expect(parseUserKey('0041')).toBe('0041')
    expect(parseUserKey('U+1F600')).toBe('1f600')
    expect(charsToKey('ab')).toBe('0061+0062')
    expect(keyToChars('0061+0062')).toBe('ab')
  })
})
