import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import opentype from 'opentype.js'
import { deserializeMkFont } from '../deserialize'
import { serializeMkFont } from '../serialize'
import { computeAll } from '../compute'
import { exportFont } from '../export-font'
import { kerningForExport } from '../kerning'

// The font "Open the sample font" loads. It is replaced in place when it is
// updated, so nothing here depends on what it contains: only that the app can
// open, compute, save and export whatever is shipped.
const json = readFileSync(resolve(__dirname, '../../../public/MkFontExample.mkfont'), 'utf-8')
const raw = JSON.parse(json)

describe('the example font shipped with the app', () => {
  const { family, glyphs, kerning, inheritKerning, meta } = deserializeMkFont(json)
  const computed = computeAll(family, glyphs)

  it('loads every glyph and kerning pair', () => {
    expect(glyphs.size).toBeGreaterThan(0)
    expect(glyphs.size).toBe(raw.data.glyphs.length)
    expect(kerning.size).toBe((raw.data.kerning ?? []).length)
  })

  it('places every component', () => {
    const unplaced: string[] = []
    for (const [key, glyph] of glyphs) {
      glyph.variants[0].layers.forEach((l, i) => {
        if (!computed.get(key)?.[0]?.layers[i]?.fit) unplaced.push(`${key}#${i} (${l.characterRef})`)
      })
    }
    expect(unplaced).toEqual([])
  })

  it('saves back to the same file content', () => {
    const out = JSON.parse(serializeMkFont(family, glyphs, { computed, meta, kerning, inheritKerning }))
    expect(out.data.values).toEqual(raw.data.values)
    expect(out.data.transforms).toEqual(raw.data.transforms)
    expect(out.data.kerning).toEqual(raw.data.kerning)
    expect(out.data.glyphs.map((g: any) => g.values)).toEqual(raw.data.glyphs.map((g: any) => g.values))
  })

  for (const format of ['ttf', 'otf'] as const) {
    it(`exports as a parseable ${format.toUpperCase()}`, () => {
      const pairs = kerningForExport(kerning, glyphs.keys(), inheritKerning)
      const res = exportFont(format, family, glyphs, computed, pairs)
      const font = opentype.parse(res.data)
      expect(font.names.fontFamily.en).toBe(raw.data.values['font-family'])
      expect(font.unitsPerEm).toBe(raw.data.values.em)
      expect(res.glyphCount).toBeGreaterThan(0)
      expect(res.warnings).toEqual([])
    })
  }
})
