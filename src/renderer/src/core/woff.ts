// ============================================================
// Web font containers: WOFF (each table deflated) and WOFF2 (all
// tables in one Brotli stream) around a finished TrueType or
// OpenType font. The compression itself comes from the platform
// (platform/compress.ts): core stays free of it.
//
// WOFF2 tables are stored as they are (no glyf / loca transform):
// every browser reads that, the files are a little larger than
// what Google's encoder writes.
// ============================================================

import { readSfnt, sfntChecksum, sfntSize, type SfntTable } from './sfnt'

/** Compresses bytes (zlib for WOFF, Brotli for WOFF2). */
export type Compress = (bytes: Uint8Array) => Promise<Uint8Array>

const WOFF_SIGNATURE = 0x774f4646 // 'wOFF'
const WOFF2_SIGNATURE = 0x774f4632 // 'wOF2'

/** WOFF2 writes these table tags as their index (WOFF2 spec, "Known Table Tags"). */
export const WOFF2_KNOWN_TAGS: readonly string[] = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT',
  'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH',
  'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar',
  // i18n-ignore: table tags
  'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'
]
/** Flag value of a tag that is not in the list: the tag follows in full. */
const WOFF2_OTHER_TAG = 63
/** Transform version of a glyf or loca table stored as it is (0 would mean "transformed"). */
const WOFF2_PLAIN_GLYF = 3

const byTag = (a: SfntTable, b: SfntTable): number => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0)
const pad4 = (n: number): number => (n + 3) & ~3

function writeTag(out: Uint8Array, at: number, tag: string): void {
  for (let c = 0; c < 4; c++) out[at + c] = tag.charCodeAt(c)
}

/** A table's checksum as its font's directory has it: head counts its checkSumAdjustment as 0. */
function tableChecksum(table: SfntTable): number {
  if (table.tag !== 'head' || table.data.length < 12) return sfntChecksum(table.data)
  const head = table.data.slice()
  head.fill(0, 8, 12)
  return sfntChecksum(head)
}

/** The font (TTF or OTF) as a WOFF file; `deflate` writes the zlib format. */
export async function encodeWoff(font: ArrayBuffer, deflate: Compress): Promise<ArrayBuffer> {
  const { version, tables } = readSfnt(font)
  // A table that does not get smaller is stored as it is.
  const stored = await Promise.all(
    tables.map(async (t) => {
      const packed = await deflate(t.data)
      return packed.length < t.data.length ? packed : t.data
    })
  )

  // Header, directory, then the tables in the font's own order, each on a 4-byte boundary.
  const count = tables.length
  let size = 44 + 20 * count
  const offsets = stored.map((data) => {
    const at = size
    size += pad4(data.length)
    return at
  })
  const out = new Uint8Array(size)
  const view = new DataView(out.buffer)
  view.setUint32(0, WOFF_SIGNATURE)
  view.setUint32(4, version)
  view.setUint32(8, size)
  view.setUint16(12, count)
  view.setUint32(16, sfntSize(tables))
  view.setUint16(20, 1) // WOFF file version 1.0; no metadata, no private data.

  // Directory entries sorted by tag.
  const order = tables.map((_, i) => i).sort((a, b) => byTag(tables[a], tables[b]))
  order.forEach((i, k) => {
    const r = 44 + 20 * k
    writeTag(out, r, tables[i].tag)
    view.setUint32(r + 4, offsets[i])
    view.setUint32(r + 8, stored[i].length)
    view.setUint32(r + 12, tables[i].data.length)
    view.setUint32(r + 16, tableChecksum(tables[i]))
    out.set(stored[i], offsets[i])
  })
  return out.buffer
}

/** A number in WOFF2's UIntBase128: 7 bits a byte, most significant first, the high bit set on all but the last. */
function base128(n: number): number[] {
  const bytes = [n & 0x7f]
  for (let rest = n >>> 7; rest > 0; rest >>>= 7) bytes.unshift((rest & 0x7f) | 0x80)
  return bytes
}

/** The font (TTF or OTF) as a WOFF2 file; `brotli` writes a Brotli stream. */
export async function encodeWoff2(font: ArrayBuffer, brotli: Compress): Promise<ArrayBuffer> {
  const { version, tables: inFile } = readSfnt(font)
  // Tables by tag, loca right after glyf (the order WOFF2 asks for).
  const tables = inFile.filter((t) => t.tag !== 'loca').sort(byTag)
  const loca = inFile.find((t) => t.tag === 'loca')
  const glyf = tables.findIndex((t) => t.tag === 'glyf')
  if (loca) tables.splice(glyf >= 0 ? glyf + 1 : tables.length, 0, loca)

  const directory: number[] = []
  for (const t of tables) {
    const known = WOFF2_KNOWN_TAGS.indexOf(t.tag)
    const transform = t.tag === 'glyf' || t.tag === 'loca' ? WOFF2_PLAIN_GLYF : 0
    directory.push((known >= 0 ? known : WOFF2_OTHER_TAG) | (transform << 6))
    if (known < 0) for (let c = 0; c < 4; c++) directory.push(t.tag.charCodeAt(c))
    directory.push(...base128(t.data.length))
  }

  // One stream: the tables one after the other, without padding.
  const stream = new Uint8Array(tables.reduce((n, t) => n + t.data.length, 0))
  let at = 0
  for (const t of tables) {
    stream.set(t.data, at)
    at += t.data.length
  }
  const packed = await brotli(stream)

  const dataAt = 48 + directory.length
  const size = pad4(dataAt + packed.length)
  const out = new Uint8Array(size)
  const view = new DataView(out.buffer)
  view.setUint32(0, WOFF2_SIGNATURE)
  view.setUint32(4, version)
  view.setUint32(8, size)
  view.setUint16(12, tables.length)
  view.setUint32(16, sfntSize(tables))
  view.setUint32(20, packed.length)
  view.setUint16(24, 1) // WOFF2 file version 1.0; no metadata, no private data.
  out.set(directory, 48)
  out.set(packed, dataAt)
  return out.buffer
}
