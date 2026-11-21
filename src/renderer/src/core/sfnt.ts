// ============================================================
// SFNT container: read the tables of a finished TrueType or
// OpenType font (the web formats repack them, woff.ts) and add
// tables to it (kerning adds a GPOS table to what svg2ttf and
// opentype.js write).
// ============================================================

import { MessageError, msg } from '../i18n/message'

const TRUETYPE = 0x00010000
const CFF = 0x4f54544f // 'OTTO'
/** Whole-font checksum target (head.checkSumAdjustment). */
const CHECKSUM_MAGIC = 0xb1b0afba

export interface AddTablesOptions {
  /** Raise OS/2.usMaxContext to at least this: 2 for pair kerning, more for longer ligatures. */
  maxContext?: number
}

/** Sum of the big-endian uint32 words of `bytes`, the last one padded with zeros. */
export function sfntChecksum(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const whole = bytes.length & ~3
  let sum = 0
  for (let i = 0; i < whole; i += 4) sum = (sum + view.getUint32(i)) >>> 0
  if (whole < bytes.length) {
    let last = 0
    for (let i = whole; i < whole + 4; i++) last = last * 256 + (i < bytes.length ? bytes[i] : 0)
    sum = (sum + last) >>> 0
  }
  return sum
}

function readTag(view: DataView, at: number): string {
  return String.fromCharCode(view.getUint8(at), view.getUint8(at + 1), view.getUint8(at + 2), view.getUint8(at + 3))
}

export interface SfntTable {
  tag: string
  /** The table's bytes, without padding. */
  data: Uint8Array
}

/** A TrueType or OpenType font's flavour (its first four bytes) and its tables, in file order. */
export function readSfnt(font: ArrayBuffer): { version: number; tables: SfntTable[] } {
  const src = new DataView(font)
  const version = font.byteLength >= 12 ? src.getUint32(0) : 0
  if (version !== TRUETYPE && version !== CFF) throw new MessageError(msg('document.export.notSfnt'))
  const records: { tag: string; offset: number; length: number }[] = []
  for (let i = 0; i < src.getUint16(4); i++) {
    const r = 12 + 16 * i
    records.push({ tag: readTag(src, r), offset: src.getUint32(r + 8), length: src.getUint32(r + 12) })
  }
  records.sort((a, b) => a.offset - b.offset)
  return { version, tables: records.map((t) => ({ tag: t.tag, data: new Uint8Array(font, t.offset, t.length) })) }
}

/** Size of the font these tables make: header, directory, and each table on a 4-byte boundary. */
export function sfntSize(tables: readonly SfntTable[]): number {
  return tables.reduce((size, t) => size + ((t.data.length + 3) & ~3), 12 + 16 * tables.length)
}

/**
 * The font with `tables` added, replacing tables of the same tag. Existing tables keep
 * their bytes and file order (new ones go last); the directory, the table checksums and
 * head.checkSumAdjustment are rebuilt. With `maxContext`, OS/2.usMaxContext may change too.
 */
export function addSfntTables(font: ArrayBuffer, tables: Record<string, Uint8Array>, options: AddTablesOptions = {}): ArrayBuffer {
  const { version, tables: old } = readSfnt(font)
  for (const tag of Object.keys(tables)) {
    if (!/^[\x20-\x7e]{4}$/.test(tag)) throw new Error(`Invalid table tag "${tag}".`)
  }

  // Kept tables in file order, then the new ones.
  const entries: SfntTable[] = old.filter((t) => !Object.hasOwn(tables, t.tag))
  for (const [tag, data] of Object.entries(tables)) entries.push({ tag, data })

  // usMaxContext is the last field of OS/2 versions 2 to 4 (byte 94).
  const os2 = entries.find((e) => e.tag === 'OS/2')
  if (os2 && options.maxContext && os2.data.length >= 96) {
    const view = new DataView(os2.data.buffer, os2.data.byteOffset, os2.data.byteLength)
    if (view.getUint16(0) >= 2 && view.getUint16(94) < options.maxContext) {
      os2.data = os2.data.slice()
      new DataView(os2.data.buffer).setUint16(94, Math.min(0xffff, options.maxContext))
    }
  }

  // Header and directory, then each table on a 4-byte boundary.
  const count = entries.length
  let size = 12 + 16 * count
  const offsets = entries.map((e) => {
    const at = size
    size += (e.data.length + 3) & ~3
    return at
  })
  const out = new Uint8Array(size)
  const view = new DataView(out.buffer)
  entries.forEach((e, i) => out.set(e.data, offsets[i]))

  // Table checksums count head.checkSumAdjustment as 0.
  const head = entries.findIndex((e) => e.tag === 'head' && e.data.length >= 12)
  if (head >= 0) view.setUint32(offsets[head] + 8, 0)

  const log2 = Math.floor(Math.log2(count))
  view.setUint32(0, version)
  view.setUint16(4, count)
  view.setUint16(6, 16 << log2) // searchRange
  view.setUint16(8, log2) // entrySelector
  view.setUint16(10, 16 * count - (16 << log2)) // rangeShift

  // Records sorted by tag.
  const byTag = entries.map((_, i) => i).sort((a, b) => (entries[a].tag < entries[b].tag ? -1 : entries[a].tag > entries[b].tag ? 1 : 0))
  byTag.forEach((i, k) => {
    const r = 12 + 16 * k
    const { tag, data } = entries[i]
    for (let c = 0; c < 4; c++) out[r + c] = tag.charCodeAt(c)
    view.setUint32(r + 4, sfntChecksum(out.subarray(offsets[i], offsets[i] + data.length)))
    view.setUint32(r + 8, offsets[i])
    view.setUint32(r + 12, data.length)
  })

  if (head >= 0) view.setUint32(offsets[head] + 8, (CHECKSUM_MAGIC - sfntChecksum(out)) >>> 0)
  return out.buffer
}
