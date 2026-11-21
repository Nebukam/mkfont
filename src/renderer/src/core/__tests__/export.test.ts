import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import opentype from 'opentype.js'
import { deserializeMkFont } from '../deserialize'
import { computeAll } from '../compute'
import { exportFont, collectExportGlyphs, gsub, fontVersionNumber, fontPostScriptName } from '../export-font'
import { keyToCodePoints } from '../unicode-keys'
import { addLigatures } from './example-ligatures'

const json = readFileSync(resolve(__dirname, '../../../public/MkFontExample.mkfont'), 'utf-8')
const { family, glyphs } = deserializeMkFont(json)
const computed = computeAll(family, glyphs)
// The example font has no ligatures: the same font with a few added.
const withLigatures = new Map(glyphs)
const ligatures = addLigatures(family, withLigatures, ['TT', 'T.', 'fi'])

describe('font export', () => {
  const { list } = collectExportGlyphs(family, glyphs, computed)

  for (const format of ['ttf', 'otf'] as const) {
    it(`builds a parseable ${format.toUpperCase()}`, () => {
      const res = exportFont(format, family, glyphs, computed)
      const font = opentype.parse(res.data)
      expect(font.names.fontFamily.en).toBe(family.values['font-family'])
      expect(font.unitsPerEm).toBe(family.values.em)
      // every exported single glyph is mapped
      for (const g of list.filter((x) => !x.ligature && x.codePoints.length === 1).slice(0, 40)) {
        const og = font.charToGlyph(String.fromCodePoint(g.codePoints[0]))
        expect(og.index, g.key).toBeGreaterThan(0)
        expect(og.advanceWidth).toBe(g.advance)
      }
      // space survives export with its advance width
      const space = list.find((g) => g.key === '0020')
      if (space) expect(font.charToGlyph(' ').advanceWidth).toBe(space.advance)
    })

    it(`substitutes ligatures in ${format.toUpperCase()}`, () => {
      const res = exportFont(format, family, withLigatures, computeAll(family, withLigatures))
      expect(res.ligatureCount).toBe(ligatures.length)
      expect(res.glyphCount).toBe(list.length + ligatures.length)
      const font = opentype.parse(res.data)
      expect(gsub(font).getLigatures('liga').length).toBe(ligatures.length)
      expect(font.stringToGlyphs('TT').length).toBe(1)
    })
  }

  it('accepts any version text (svg2ttf only takes major.minor)', () => {
    expect(['Version 1.1', '1.0.0', '2', '1.1 beta', 'beta', ''].map(fontVersionNumber)).toEqual(['1.1', '1.0', '2.0', '1.1', '1.0', '1.0'])
    for (const version of ['Version 1.1', '1.0.0', '1.1 beta']) {
      const fam = { ...family, values: { ...family.values, version } }
      for (const format of ['ttf', 'otf'] as const) {
        const font = opentype.parse(exportFont(format, fam, glyphs, computed).data)
        expect(font.names.version.en, `${format} ${version}`).toMatch(/^Version 1\.\d/)
      }
    }
  })

  it('exports OTF with a positive descender or a zero baseline', () => {
    for (const values of [{ descent: 200 }, { baseline: 0 }]) {
      const fam = { ...family, values: { ...family.values, ...values } }
      expect(() => opentype.parse(exportFont('otf', fam, glyphs, computed).data)).not.toThrow()
    }
  })

  it('puts longer ligatures first so "ffi" wins over "ff" in OTF', () => {
    const fam = createFamily()
    const square = { exists: true, markedBBox: false, path: 'M0 0H500V700H0Z', width: 500, height: 700, bbox: { x: 0, y: 0, width: 500, height: 700, top: 0, bottom: 700, left: 0, right: 500 } }
    const gl = new Map()
    for (const k of ['0066', '0069', '0066+0066', '0066+0066+0069']) gl.set(k, createGlyph(k, fam.transforms, { pathData: square }))
    const font = opentype.parse(exportFont('otf', fam, gl, computeAll(fam, gl)).data)
    const ligs = gsub(font).getLigatures('liga')
    expect(ligs.map((l) => l.sub.length)).toEqual([3, 2])
    expect(font.stringToGlyphs('ffi').length).toBe(1)
  })

  it('exports a subset with the ligatures its characters can form (text preview)', () => {
    const all = computeAll(family, withLigatures)
    const lig = collectExportGlyphs(family, withLigatures, all).list.find((g) => g.ligature)!
    const wanted = new Set([...lig.codePoints, 0x41])
    const sub = collectExportGlyphs(family, withLigatures, all, (key) => keyToCodePoints(key).every((cp) => wanted.has(cp)))
    const keys = sub.list.map((g) => g.key)
    expect(keys).toContain(lig.key)
    expect(keys).toContain('0041')
    expect(sub.list.every((g) => g.codePoints.every((cp) => wanted.has(cp)))).toBe(true)
    expect(sub.list.find((g) => g.key === lig.key)!.ligature).toBe(true)
    expect(sub.list.length).toBeLessThan(list.length / 10)
  })
})

describe('PostScript name', () => {
  it('keeps printable ASCII without spaces or brackets, and drops accents', () => {
    expect(fontPostScriptName('MkFontExample', 'Regular')).toBe('MkFontExample-Regular')
    expect(fontPostScriptName('Café Sans', 'Regular')).toBe('CafeSans-Regular')
    expect(fontPostScriptName('Foo (Beta) [x] {y} <z> a/b 50%', 'Bold Italic')).toBe('FooBetaxyzab50-BoldItalic')
    expect(fontPostScriptName('Ïñtèrnätiönàl', 'Ñormal')).toBe('International-Normal')
  })

  it('names a family with no Latin letters from a hash of it, the same every time', () => {
    const name = fontPostScriptName('日本語フォント', 'Regular')
    expect(name).toMatch(/^MkFont[0-9a-f]{8}-Regular$/)
    expect(fontPostScriptName('日本語フォント', 'Regular')).toBe(name)
    expect(fontPostScriptName('中文字体', 'Regular')).not.toBe(name)
  })

  it('is at most 63 characters', () => {
    expect(fontPostScriptName('A'.repeat(80), 'Regular')).toHaveLength(63)
  })

  it('is what the OTF carries, while the family name keeps its accents', () => {
    // Font sanitizers (browsers, the text preview) reject an OTF whose CFF name has these.
    const fam = { ...family, values: { ...family.values, 'font-family': 'Café Sans (Beta)', style: 'Regular' } }
    const font = opentype.parse(exportFont('otf', fam, glyphs, computed).data)
    expect(font.names.postScriptName.en).toBe('CafeSansBeta-Regular')
    expect(font.names.fontFamily.en).toBe('Café Sans (Beta)')
  })
})

import { parseFontFile, fontImportItems, familyFromFont } from '../import-font'
import { createFamily, createGlyph } from '../model'
import type { Glyph } from '../../types/font'

describe('font import', () => {
  it('re-imports an exported font with matching advances', () => {
    const res = exportFont('otf', family, glyphs, computed)
    const pf = parseFontFile(res.data)
    const items = fontImportItems(pf, pf.ascender)
    const { list } = collectExportGlyphs(family, glyphs, computed)
    expect(items.length).toBe(list.length)
    const fam = createFamily(familyFromFont(pf, items))
    const map = new Map<string, Glyph>()
    for (const it of items) {
      const g = createGlyph(it.key, fam.transforms, { pathData: it.pathData })
      Object.assign(g.variants[0].transforms, it.transforms)
      map.set(it.key, g)
    }
    const back = computeAll(fam, map)
    let checked = 0
    for (const g of list) {
      const c = back.get(g.key)?.[0]
      expect(c, g.key).toBeTruthy()
      expect(Math.abs(c!.exportedWidth - g.advance), g.key).toBeLessThanOrEqual(1)
      checked++
    }
    expect(checked).toBeGreaterThan(100)
  })
})
