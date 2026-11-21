import { readFileSync } from 'fs'
import { resolve } from 'path'
import { brotliCompressSync, brotliDecompressSync, deflateSync, inflateSync } from 'zlib'
import { describe, expect, it } from 'vitest'
import opentype from 'opentype.js'
import { deserializeMkFont } from '../deserialize'
import { computeAll } from '../compute'
import { exportFont } from '../export-font'
import { readSfnt, sfntSize } from '../sfnt'
import { encodeWoff, encodeWoff2, WOFF2_KNOWN_TAGS, type Compress } from '../woff'

const json = readFileSync(resolve(__dirname, '../../../public/MkFontExample.mkfont'), 'utf-8')
const { family, glyphs } = deserializeMkFont(json)
const computed = computeAll(family, glyphs)

const deflate: Compress = async (bytes) => deflateSync(bytes)
const brotli: Compress = async (bytes) => brotliCompressSync(bytes)

const tag = (view: DataView, at: number): string => String.fromCharCode(view.getUint8(at), view.getUint8(at + 1), view.getUint8(at + 2), view.getUint8(at + 3))

/** The tables of a WOFF2 file, read back the way the spec describes them. */
function decodeWoff2(file: ArrayBuffer, knownTags: readonly string[]): { flavor: number; totalSfntSize: number; tables: { tag: string; data: Uint8Array }[] } {
  const bytes = new Uint8Array(file)
  const view = new DataView(file)
  expect(tag(view, 0)).toBe('wOF2')
  expect(view.getUint32(8)).toBe(file.byteLength)
  expect(file.byteLength % 4).toBe(0)
  const count = view.getUint16(12)
  let at = 48
  const entries: { tag: string; length: number }[] = []
  for (let i = 0; i < count; i++) {
    const flags = bytes[at++]
    let name = knownTags[flags & 63]
    if ((flags & 63) === 63) {
      name = tag(view, at)
      at += 4
    }
    // Stored as they are: transform 3 for glyf and loca, 0 for the others.
    expect(flags >> 6, name).toBe(name === 'glyf' || name === 'loca' ? 3 : 0)
    let length = 0
    for (;;) {
      const b = bytes[at++]
      length = length * 128 + (b & 0x7f)
      if (!(b & 0x80)) break
    }
    entries.push({ tag: name, length })
  }
  const packed = bytes.subarray(at, at + view.getUint32(20))
  expect(file.byteLength - (at + packed.length)).toBeLessThan(4)
  const stream = new Uint8Array(brotliDecompressSync(packed))
  expect(stream.length).toBe(entries.reduce((n, e) => n + e.length, 0))
  let pos = 0
  const tables = entries.map((e) => {
    const data = stream.subarray(pos, pos + e.length)
    pos += e.length
    return { tag: e.tag, data }
  })
  return { flavor: view.getUint32(4), totalSfntSize: view.getUint32(16), tables }
}

describe('web font containers', () => {
  for (const format of ['ttf', 'otf'] as const) {
    const sfnt = exportFont(format, family, glyphs, computed).data
    const source = readSfnt(sfnt)

    it(`wraps a ${format.toUpperCase()} in a WOFF that reads back as the same font`, async () => {
      const woff = await encodeWoff(sfnt, deflate)
      const view = new DataView(woff)
      expect(tag(view, 0)).toBe('wOFF')
      expect(view.getUint32(4)).toBe(source.version)
      expect(view.getUint32(8)).toBe(woff.byteLength)
      expect(woff.byteLength % 4).toBe(0)
      expect(view.getUint32(16)).toBe(sfntSize(source.tables))
      expect(woff.byteLength).toBeLessThan(sfnt.byteLength)

      // Every table: sorted directory, the font's checksum, the same bytes once inflated.
      const count = view.getUint16(12)
      expect(count).toBe(source.tables.length)
      const sfntView = new DataView(sfnt)
      const checksums = new Map<string, number>()
      for (let i = 0; i < count; i++) checksums.set(tag(sfntView, 12 + 16 * i), sfntView.getUint32(12 + 16 * i + 4))
      let previous = ''
      for (let i = 0; i < count; i++) {
        const r = 44 + 20 * i
        const name = tag(view, r)
        expect(name > previous, name).toBe(true)
        previous = name
        const [offset, compLength, origLength, checksum] = [4, 8, 12, 16].map((o) => view.getUint32(r + o))
        expect(offset % 4, name).toBe(0)
        expect(checksum, name).toBe(checksums.get(name))
        const stored = new Uint8Array(woff, offset, compLength)
        const data = compLength < origLength ? new Uint8Array(inflateSync(stored)) : stored
        expect(Buffer.from(data).equals(Buffer.from(source.tables.find((t) => t.tag === name)!.data)), name).toBe(true)
      }

      const font = opentype.parse(woff)
      const plain = opentype.parse(sfnt)
      expect(font.names.fontFamily.en).toBe(family.values['font-family'])
      expect(font.glyphs.length).toBe(plain.glyphs.length)
      expect(font.charToGlyph('A').advanceWidth).toBe(plain.charToGlyph('A').advanceWidth)
    })

    it(`wraps a ${format.toUpperCase()} in a WOFF2 that holds every table unchanged`, async () => {
      const woff2 = await encodeWoff2(sfnt, brotli)
      expect(woff2.byteLength).toBeLessThan(sfnt.byteLength)
      expect(WOFF2_KNOWN_TAGS.length).toBe(63)
      const back = decodeWoff2(woff2, WOFF2_KNOWN_TAGS)
      expect(back.flavor).toBe(source.version)
      expect(back.totalSfntSize).toBe(sfntSize(source.tables))
      expect(back.tables.map((t) => t.tag).sort()).toEqual(source.tables.map((t) => t.tag).sort())
      for (const t of back.tables) {
        expect(Buffer.from(t.data).equals(Buffer.from(source.tables.find((s) => s.tag === t.tag)!.data)), t.tag).toBe(true)
      }
      // loca comes right after glyf.
      const order = back.tables.map((t) => t.tag)
      if (order.includes('glyf')) expect(order[order.indexOf('glyf') + 1]).toBe('loca')
    })
  }

  it('stores a table that does not compress as it is', async () => {
    const sfnt = exportFont('ttf', family, glyphs, computed).data
    const woff = await encodeWoff(sfnt, async (bytes) => new Uint8Array(bytes.length + 8))
    const view = new DataView(woff)
    for (let i = 0; i < view.getUint16(12); i++) expect(view.getUint32(44 + 20 * i + 8)).toBe(view.getUint32(44 + 20 * i + 12))
    expect(opentype.parse(woff).names.fontFamily.en).toBe(family.values['font-family'])
  })
})
