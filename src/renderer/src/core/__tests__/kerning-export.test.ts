import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it, vi } from 'vitest'
import opentype from 'opentype.js'
import { deserializeMkFont } from '../deserialize'
import { computeAll } from '../compute'
import { createFamily, createGlyph } from '../model'
import {
  buildOTF,
  buildTTF,
  collectExportGlyphs,
  exportFont,
  fontGlyphIndices,
  gsub,
  type ExportGlyph,
  type KernPair
} from '../export-font'
import { buildKernGpos, kernPairList, type GlyphPairValue } from '../gpos'
import { addSfntTables, sfntChecksum } from '../sfnt'
import type { Glyph, Variant } from '../../types/font'
import { addLigatures } from './example-ligatures'
import { tm } from '../../i18n'

// --- fixtures ---------------------------------------------------------------

/** A rectangle `w` units wide: each width gives its own outline and advance. */
function rect(w: number): Variant['pathData'] {
  return {
    exists: true,
    markedBBox: false,
    path: `M0 0H${w}V700H0Z`,
    width: w,
    height: 700,
    bbox: { x: 0, y: 0, width: w, height: 700, top: 0, bottom: 700, left: 0, right: w }
  }
}

const fam = createFamily()
const WIDTHS: Record<string, number> = {
  '0041': 600, // A
  '0054': 620, // T
  '0056': 610, // V
  '0066': 300, // f
  '0069': 250, // i
  '006f': 500, // o
  '0066+0069': 520 // fi
}

function glyphMap(extra: [string, Partial<Variant>][] = []): Map<string, Glyph> {
  const map = new Map<string, Glyph>()
  for (const [key, w] of Object.entries(WIDTHS)) map.set(key, createGlyph(key, fam.transforms, { pathData: rect(w) }))
  // Space and no-break space: the same empty glyph twice (TTF export merges them).
  for (const key of ['0020', '00a0']) map.set(key, createGlyph(key, fam.transforms))
  for (const [key, v] of extra) map.set(key, createGlyph(key, fam.transforms, v))
  return map
}

const glyphs = glyphMap()
const computed = computeAll(fam, glyphs)
const { list } = collectExportGlyphs(fam, glyphs, computed)

const KERNING: KernPair[] = [
  { left: '0041', right: '0056', value: -80 }, // AV
  { left: '0054', right: '006f', value: -120 }, // To
  { left: '0054', right: '0066+0069', value: -60 }, // T fi: ligature on the right
  { left: '0066+0069', right: '0041', value: 35 } // fi A: ligature on the left
]

function frozen<T>(build: () => T): T {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  try {
    return build()
  } finally {
    vi.useRealTimers()
  }
}

function sameBytes(a: ArrayBuffer, b: ArrayBuffer): boolean {
  return Buffer.from(a).equals(Buffer.from(b))
}

// --- readers ----------------------------------------------------------------

interface TableRecord {
  tag: string
  checkSum: number
  offset: number
  length: number
  data: Uint8Array
}

function readDirectory(font: ArrayBuffer) {
  const bytes = new Uint8Array(font)
  const v = new DataView(font)
  const records: TableRecord[] = []
  for (let i = 0; i < v.getUint16(4); i++) {
    const r = 12 + 16 * i
    const offset = v.getUint32(r + 8)
    const length = v.getUint32(r + 12)
    const tag = String.fromCharCode(...bytes.subarray(r, r + 4))
    records.push({ tag, checkSum: v.getUint32(r + 4), offset, length, data: bytes.subarray(offset, offset + length) })
  }
  return { version: v.getUint32(0), searchRange: v.getUint16(6), entrySelector: v.getUint16(8), rangeShift: v.getUint16(10), records }
}

function table(font: ArrayBuffer, tag: string): Uint8Array {
  const r = readDirectory(font).records.find((t) => t.tag === tag)
  if (!r) throw new Error(`no ${tag} table`)
  return r.data
}

function check(ok: boolean, what: string): void {
  if (!ok) throw new Error(`GPOS: ${what}`)
}

/**
 * A GPOS kern feature read the way a shaper reads it: scripts → default language
 * system → `kern` feature → lookups (through extension lookups) → PairPos format 1.
 */
function readKernGpos(gpos: Uint8Array) {
  const v = new DataView(gpos.buffer, gpos.byteOffset, gpos.byteLength)
  const u16 = (at: number): number => v.getUint16(at)
  const tag = (at: number): string => String.fromCharCode(gpos[at], gpos[at + 1], gpos[at + 2], gpos[at + 3])
  check(v.getUint32(0) === 0x00010000, 'version 1.0')
  const scriptList = u16(4)
  const featureList = u16(6)
  const lookupList = u16(8)

  const scripts: string[] = []
  const featuresOfScripts = new Set<string>()
  for (let i = 0; i < u16(scriptList); i++) {
    const record = scriptList + 2 + 6 * i
    scripts.push(tag(record))
    const script = scriptList + u16(record + 4)
    check(u16(script + 2) === 0, 'no language systems besides the default')
    const langSys = script + u16(script)
    check(u16(langSys) === 0 && u16(langSys + 2) === 0xffff, 'default language system header')
    const features = Array.from({ length: u16(langSys + 4) }, (_, k) => u16(langSys + 6 + 2 * k))
    featuresOfScripts.add(features.join())
  }
  check(featuresOfScripts.size === 1, 'every script uses the same features')

  const lookupIndices: number[] = []
  for (const index of [...featuresOfScripts][0].split(',').map(Number)) {
    const record = featureList + 2 + 6 * index
    check(index < u16(featureList) && tag(record) === 'kern', 'feature is kern')
    const feature = featureList + u16(record + 4)
    check(u16(feature) === 0, 'no feature parameters')
    for (let k = 0; k < u16(feature + 2); k++) lookupIndices.push(u16(feature + 4 + 2 * k))
  }

  const pairs = new Map<string, number>()
  const lookupTypes: number[] = []
  let subtables = 0
  for (const index of lookupIndices) {
    check(index < u16(lookupList), 'lookup index in range')
    const lookup = lookupList + u16(lookupList + 2 + 2 * index)
    const type = u16(lookup)
    lookupTypes.push(type)
    check(u16(lookup + 2) === 0, 'lookupFlag 0')
    for (let s = 0; s < u16(lookup + 4); s++) {
      let sub = lookup + u16(lookup + 6 + 2 * s)
      if (type === 9) {
        check(u16(sub) === 1 && u16(sub + 2) === 2, 'ExtensionPosFormat1 around a PairPos subtable')
        sub += v.getUint32(sub + 4)
      } else check(type === 2, 'PairPos lookup')
      subtables++
      check(u16(sub) === 1 && u16(sub + 4) === 0x0004 && u16(sub + 6) === 0, 'PairPos format 1, x advance of the left glyph')
      const coverage = sub + u16(sub + 2)
      const count = u16(sub + 8)
      check(u16(coverage) === 1 && u16(coverage + 2) === count, 'coverage format 1 with one glyph per pair set')
      let lastLeft = -1
      for (let k = 0; k < count; k++) {
        const left = u16(coverage + 4 + 2 * k)
        check(left > lastLeft, 'coverage sorted')
        lastLeft = left
        const set = sub + u16(sub + 10 + 2 * k)
        let lastRight = -1
        for (let m = 0; m < u16(set); m++) {
          const right = u16(set + 2 + 4 * m)
          check(right > lastRight, 'pair set sorted by second glyph')
          lastRight = right
          // A shaper stops at the first subtable covering the left glyph.
          const key = `${left},${right}`
          check(!pairs.has(key), `pair ${key} written once`)
          pairs.set(key, v.getInt16(set + 4 + 4 * m))
        }
      }
    }
  }
  return { scripts, lookupTypes, subtables, pairs }
}

// --- tests ------------------------------------------------------------------

describe('kerning export', () => {
  for (const format of ['ttf', 'otf'] as const) {
    it(`writes ${format.toUpperCase()} kerning that readers find, ligatures included`, () => {
      const res = exportFont(format, fam, glyphs, computed, KERNING)
      expect(res.kerningCount).toBe(4)
      expect(res.warnings).toEqual([])
      const font = opentype.parse(res.data)
      const g = (s: string): opentype.Glyph => {
        const out = font.stringToGlyphs(s)
        expect(out.length, s).toBe(1)
        return out[0]
      }
      const fi = g('fi')
      expect(fi.index).not.toBe(g('f').index)
      expect(font.getKerningValue(g('A'), g('V'))).toBe(-80)
      expect(font.getKerningValue(g('T'), g('o'))).toBe(-120)
      expect(font.getKerningValue(g('T'), fi)).toBe(-60)
      expect(font.getKerningValue(fi, g('A'))).toBe(35)
      // Reversed and unrelated pairs are not kerned.
      expect(font.getKerningValue(g('V'), g('A'))).toBe(0)
      expect(font.getKerningValue(g('o'), g('T'))).toBe(0)
      expect(font.getKerningValue(g('A'), g('T'))).toBe(0)
      expect(font.getKerningValue(g('f'), g('A'))).toBe(0)
      expect(font.getKerningValue(fi, g('T'))).toBe(0)
      // Laid out text: kerning applies after the ligature forms (opentype.js only
      // forms ligatures in layout when `liga` is asked for).
      const width = (s: string): number => font.getAdvanceWidth(s, font.unitsPerEm, { features: { liga: true } })
      const adv = (glyph: opentype.Glyph): number => glyph.advanceWidth ?? NaN
      expect(width('AV')).toBe(adv(g('A')) + adv(g('V')) - 80)
      expect(width('Tfi')).toBe(adv(g('T')) + adv(fi) - 60)
      expect(width('fiA')).toBe(adv(fi) + adv(g('A')) + 35)
      // One plain PairPos lookup under DFLT and latn.
      const gpos = readKernGpos(table(res.data, 'GPOS'))
      expect(gpos.scripts).toEqual(['DFLT', 'latn'])
      expect(gpos.lookupTypes).toEqual([2])
      expect(gpos.pairs.size).toBe(4)
    })

    it(`keeps the ${format.toUpperCase()} file sound: checksums, directory, other tables untouched`, () => {
      const [plain, kerned] = frozen(() => [exportFont(format, fam, glyphs, computed).data, exportFont(format, fam, glyphs, computed, KERNING).data])
      // Whole file: sums to the magic number through head.checkSumAdjustment.
      expect(kerned.byteLength % 4).toBe(0)
      expect(sfntChecksum(new Uint8Array(kerned))).toBe(0xb1b0afba)

      const before = readDirectory(plain)
      const after = readDirectory(kerned)
      expect(after.version).toBe(before.version)
      const tags = after.records.map((r) => r.tag)
      expect(tags).toEqual([...tags].sort())
      expect(tags).toEqual([...before.records.map((r) => r.tag), 'GPOS'].sort())
      const n = tags.length
      const pow = 2 ** Math.floor(Math.log2(n))
      expect([after.searchRange, after.entrySelector, after.rangeShift]).toEqual([16 * pow, Math.log2(pow), 16 * n - 16 * pow])

      for (const r of after.records) {
        expect(r.offset % 4, r.tag).toBe(0)
        expect(r.offset + r.length).toBeLessThanOrEqual(kerned.byteLength)
        const data = r.data.slice()
        if (r.tag === 'head') data.fill(0, 8, 12) // checkSumAdjustment counts as 0
        expect(r.checkSum, r.tag).toBe(sfntChecksum(data))
        if (r.tag === 'GPOS') continue
        // Same bytes as without kerning, apart from head.checkSumAdjustment and OS/2.usMaxContext.
        const old = before.records.find((t) => t.tag === r.tag)!.data.slice()
        if (r.tag === 'head') old.fill(0, 8, 12)
        if (r.tag === 'OS/2') {
          old.fill(0, 94, 96)
          data.fill(0, 94, 96)
        }
        expect(Buffer.from(data).equals(Buffer.from(old)), r.tag).toBe(true)
      }
      const os2 = new DataView(table(kerned, 'OS/2').slice().buffer)
      expect(os2.getUint16(0)).toBeGreaterThanOrEqual(2)
      expect(os2.getUint16(94)).toBe(2)
    })
  }

  it('skips zero values and pairs with a missing or unexported glyph, with one warning', () => {
    const map = glyphMap([['0042', { pathData: rect(640), doExport: false }]]) // B, not exported
    const kerning: KernPair[] = [
      { left: '0041', right: '0056', value: -80 },
      { left: '0041', right: '0054', value: 0 }, // zero: not written, not a skip
      { left: '0041', right: '0058', value: -40 }, // X: no such glyph
      { left: '0042', right: '0041', value: -30 }, // B: not exported
      { left: '0058', right: '0041', value: 0 }, // zero, and X is missing: not counted
      { left: '0054', right: '006f', value: -100 },
      { left: '0054', right: '006f', value: -120 } // the last of duplicates wins
    ]
    for (const format of ['ttf', 'otf'] as const) {
      const res = exportFont(format, fam, map, computeAll(fam, map), kerning)
      expect(res.warnings.map(tm)).toEqual(['2 kerning pairs skipped: a glyph is missing or not exported'])
      expect(res.kerningCount).toBe(2)
      const font = opentype.parse(res.data)
      const g = (c: string): opentype.Glyph => font.charToGlyph(c)
      expect(font.getKerningValue(g('A'), g('V'))).toBe(-80)
      expect(font.getKerningValue(g('T'), g('o'))).toBe(-120)
      expect(font.getKerningValue(g('A'), g('T'))).toBe(0)
      expect(readKernGpos(table(res.data, 'GPOS')).pairs.size).toBe(2)
    }
    const one = exportFont('otf', fam, glyphs, computed, [{ left: '0041', right: '0058', value: 10 }])
    expect(one.warnings.map(tm)).toEqual(['1 kerning pair skipped: a glyph is missing or not exported'])
    expect(one.kerningCount).toBe(0)
  })

  it('leaves the font byte for byte as before when there is no kerning to write', () => {
    const nothing: KernPair[][] = [
      [],
      [
        { left: '0041', right: '0056', value: 0 },
        { left: '0041', right: '0056', value: 0.4 }, // rounds to 0
        { left: '0041', right: '0058', value: -40 } // X is missing
      ]
    ]
    for (const format of ['ttf', 'otf'] as const) {
      const build = format === 'otf' ? buildOTF : buildTTF
      frozen(() => {
        const before = build(fam, list)
        for (const kerning of nothing) {
          expect(sameBytes(build(fam, list, kerning), before)).toBe(true)
          const res = exportFont(format, fam, glyphs, computed, kerning)
          expect(sameBytes(res.data, before)).toBe(true)
          expect(res.kerningCount).toBe(0)
        }
        expect(sameBytes(exportFont(format, fam, glyphs, computed).data, before)).toBe(true)
        expect(readDirectory(before).records.some((r) => r.tag === 'GPOS')).toBe(false)
      })
    }
  })

  it('kerns the glyph TTF export merges a duplicate into', () => {
    // svg2ttf keeps one glyph for the same advance and outline: no-break space is space there.
    const ttfIndices = fontGlyphIndices('ttf', list)
    expect(ttfIndices.get('0020')).toBeGreaterThan(0)
    expect(ttfIndices.get('00a0')).toBe(ttfIndices.get('0020'))
    const otfIndices = fontGlyphIndices('otf', list)
    expect(otfIndices.get('00a0')).not.toBe(otfIndices.get('0020'))

    const pairs: KernPair[] = [{ left: '0041', right: '00a0', value: -20 }]
    const ttf = opentype.parse(exportFont('ttf', fam, glyphs, computed, pairs).data)
    expect(ttf.charToGlyphIndex(' ')).toBe(ttf.charToGlyphIndex(' '))
    expect(ttf.getKerningValue(ttf.charToGlyph('A'), ttf.charToGlyph(' '))).toBe(-20)
    const otf = opentype.parse(exportFont('otf', fam, glyphs, computed, pairs).data)
    expect(otf.getKerningValue(otf.charToGlyph('A'), otf.charToGlyph(' '))).toBe(-20)
    expect(otf.getKerningValue(otf.charToGlyph('A'), otf.charToGlyph(' '))).toBe(0)
  })

  it('maps every glyph of a real font to its index in both formats', () => {
    const json = readFileSync(resolve(__dirname, '../../../public/MkFontExample.mkfont'), 'utf-8')
    const sample = deserializeMkFont(json)
    addLigatures(sample.family, sample.glyphs, ['TT', 'T.', 'fi', 'ffi'])
    const sampleList = collectExportGlyphs(sample.family, sample.glyphs, computeAll(sample.family, sample.glyphs)).list
    expect(sampleList.filter((g) => g.ligature).length).toBe(4)

    for (const format of ['ttf', 'otf'] as const) {
      const font = opentype.parse(format === 'otf' ? buildOTF(sample.family, sampleList) : buildTTF(sample.family, sampleList))
      const indices = fontGlyphIndices(format, sampleList)
      const ligatures = gsub(font).getLigatures('liga')
      const named = new Set<number>()
      for (const g of sampleList) {
        const index = indices.get(g.key)!
        if (!g.ligature && g.codePoints.length === 1) expect(font.charToGlyphIndex(g.chars), g.key).toBe(index)
        if (g.ligature) {
          const sub = g.codePoints.map((cp) => font.charToGlyphIndex(String.fromCodePoint(cp))).join()
          expect(ligatures.find((l) => l.sub.join() === sub)?.by, g.key).toBe(index)
        }
        // The first glyph at an index gives it its name (TTF: svg2ttf's post table).
        if (!named.has(index)) expect(font.glyphs.get(index).name, g.key).toBe(g.name)
        named.add(index)
      }
      expect(font.numGlyphs).toBe(named.size + 1)
    }
  })
})

describe('GPOS kern table', () => {
  it('rounds and clamps values, keeps the last duplicate, drops zeros and sorts', () => {
    expect(
      kernPairList([
        { left: 5, right: 3, value: -10.4 },
        { left: 2, right: 9, value: 40000 },
        { left: 2, right: 1, value: -40000 },
        { left: 5, right: 3, value: -12.6 },
        { left: 7, right: 7, value: 0.4 },
        { left: 1, right: 1, value: 15 },
        { left: 1, right: 1, value: 0 },
        { left: 3, right: 4, value: NaN },
        { left: -1, right: 4, value: 10 },
        { left: 3, right: 70000, value: 10 }
      ])
    ).toEqual([
      { left: 2, right: 1, value: -32768 },
      { left: 2, right: 9, value: 32767 },
      { left: 5, right: 3, value: -13 }
    ])
  })

  it('splits a large set into subtables behind an extension lookup', () => {
    // About 40,000 pairs over 300 glyphs: more than 64 KiB of pairs.
    const pairs: GlyphPairValue[] = []
    for (let left = 1; left <= 300; left++) {
      for (let right = 1; right <= 300; right++) {
        if ((left * 31 + right * 17) % 9 < 4) pairs.push({ left, right, value: ((left + right) % 2 ? 1 : -1) * (1 + ((left * 7 + right * 3) % 300)) })
      }
    }
    expect(pairs.length).toBeGreaterThan(39000)
    const gpos = readKernGpos(buildKernGpos(pairs))
    expect(gpos.scripts).toEqual(['DFLT', 'latn'])
    expect(gpos.lookupTypes).toEqual([9])
    expect(gpos.subtables).toBeGreaterThanOrEqual(3)
    expect(gpos.pairs.size).toBe(pairs.length)
    for (const p of pairs) expect(gpos.pairs.get(`${p.left},${p.right}`)).toBe(p.value)
  })

  it('keeps a left glyph with very many pairs in one subtable', () => {
    // 20,000 pairs for one glyph: a pair set past 64 KiB, then a second subtable after it.
    const pairs: GlyphPairValue[] = Array.from({ length: 20000 }, (_, i) => ({ left: 5, right: i + 1, value: -1 - (i % 100) }))
    pairs.push({ left: 6, right: 1, value: 12 })
    const gpos = readKernGpos(buildKernGpos(pairs))
    expect(gpos.lookupTypes).toEqual([9])
    expect(gpos.subtables).toBe(2)
    expect(gpos.pairs.size).toBe(pairs.length)
    for (const p of pairs) expect(gpos.pairs.get(`${p.left},${p.right}`)).toBe(p.value)
    // Alone it fits a plain lookup.
    expect(readKernGpos(buildKernGpos(pairs.slice(0, -1))).lookupTypes).toEqual([2])
  })

  it('puts a large set in a sound font of either format', () => {
    const many: ExportGlyph[] = Array.from({ length: 300 }, (_, i) => {
      const cp = 0x100 + i
      return { key: cp.toString(16).padStart(4, '0'), name: `g${i}`, chars: String.fromCodePoint(cp), codePoints: [cp], advance: 400 + i, d: `M0 0H${10 + i}V100H0Z`, ligature: false }
    })
    const kerning: KernPair[] = []
    for (let a = 0; a < 300; a++) {
      for (let b = 0; b < 300; b++) if ((a * 31 + b * 17) % 9 < 4) kerning.push({ left: many[a].key, right: many[b].key, value: -1 - ((a + b) % 50) })
    }
    for (const format of ['ttf', 'otf'] as const) {
      const data = format === 'otf' ? buildOTF(fam, many, kerning) : buildTTF(fam, many, kerning)
      expect(sfntChecksum(new Uint8Array(data))).toBe(0xb1b0afba)
      for (const r of readDirectory(data).records) {
        const bytes = r.data.slice()
        if (r.tag === 'head') bytes.fill(0, 8, 12)
        expect(r.checkSum, r.tag).toBe(sfntChecksum(bytes))
      }
      const gpos = readKernGpos(table(data, 'GPOS'))
      expect(gpos.lookupTypes).toEqual([9])
      expect(gpos.pairs.size).toBe(kerning.length)
      const indices = fontGlyphIndices(format, many)
      for (const p of kerning) expect(gpos.pairs.get(`${indices.get(p.left)},${indices.get(p.right)}`)).toBe(p.value)
      // opentype.js reads the rest of the font (it skips extension lookups).
      expect(opentype.parse(data).numGlyphs).toBe(301)
    }
  })
})

describe('SFNT tables', () => {
  it('replaces a table of the same tag', () => {
    const font = buildOTF(fam, list)
    const once = addSfntTables(font, { GPOS: buildKernGpos([{ left: 1, right: 2, value: -5 }]) })
    const twice = addSfntTables(once, { GPOS: buildKernGpos([{ left: 1, right: 2, value: -9 }]) })
    const tags = readDirectory(twice).records.map((r) => r.tag)
    expect(tags.filter((t) => t === 'GPOS').length).toBe(1)
    expect(tags.length).toBe(readDirectory(font).records.length + 1)
    expect(readKernGpos(table(twice, 'GPOS')).pairs.get('1,2')).toBe(-9)
    expect(sfntChecksum(new Uint8Array(twice))).toBe(0xb1b0afba)
  })

  it('rejects data that is not a font', () => {
    expect(() => addSfntTables(new Uint8Array(64).buffer, { GPOS: new Uint8Array(4) })).toThrow()
  })
})
