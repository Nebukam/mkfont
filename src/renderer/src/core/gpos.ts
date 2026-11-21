// ============================================================
// GPOS table for pair kerning
//   svg2ttf writes no kerning and opentype.js 1.3.4 cannot write
//   GPOS, so the table is built here and added to the finished font
//   (sfnt.ts). A `kern` feature for the DFLT and latn scripts uses
//   one lookup of PairPos format 1 subtables: glyph pairs, each with
//   an x-advance adjustment of the left glyph.
// ============================================================

/** A kerning pair by glyph index: `value` (font units) is added to the left glyph's advance. */
export interface GlyphPairValue {
  left: number
  right: number
  value: number
}

/** A kerning value as written: whole font units within int16, 0 for anything that is not a number. */
export function kernValue(v: number): number {
  return Number.isFinite(v) ? Math.max(-0x8000, Math.min(0x7fff, Math.round(v))) : 0
}

function isGlyphId(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= 0xffff
}

/**
 * The pairs `buildKernGpos` writes: values as `kernValue`, the last of duplicate pairs
 * wins, zero values dropped; sorted by left, then right glyph. When this is empty the
 * font needs no GPOS table, and callers add none.
 */
export function kernPairList(pairs: GlyphPairValue[]): GlyphPairValue[] {
  const byPair = new Map<number, GlyphPairValue>()
  for (const p of pairs) {
    if (!isGlyphId(p.left) || !isGlyphId(p.right)) continue
    byPair.set(p.left * 0x10000 + p.right, { left: p.left, right: p.right, value: kernValue(p.value) })
  }
  return [...byPair.values()].filter((p) => p.value !== 0).sort((a, b) => a.left - b.left || a.right - b.right)
}

/** Big-endian bytes, with offsets filled in once the data they point at is written. */
class Writer {
  private data: number[] = []

  get length(): number {
    return this.data.length
  }

  u16(v: number): void {
    this.data.push((v >> 8) & 0xff, v & 0xff)
  }

  u32(v: number): void {
    this.u16(v >>> 16)
    this.u16(v & 0xffff)
  }

  tag(t: string): void {
    for (let i = 0; i < 4; i++) this.data.push(t.charCodeAt(i))
  }

  bytes(b: Uint8Array): void {
    for (let i = 0; i < b.length; i++) this.data.push(b[i])
  }

  /** Room for a 16-bit offset; returns where it is. */
  offset16(): number {
    this.u16(0)
    return this.length - 2
  }

  /** Room for a 32-bit offset; returns where it is. */
  offset32(): number {
    this.u32(0)
    return this.length - 4
  }

  /** Points the offset at `at`, counted from `base`, here; returns this position. */
  fill16(at: number, base: number): number {
    const v = this.length - base
    if (v > 0xffff) throw new Error('GPOS offset out of 16-bit range')
    this.data[at] = v >> 8
    this.data[at + 1] = v & 0xff
    return this.length
  }

  fill32(at: number, base: number): number {
    const v = this.length - base
    this.data[at] = (v >>> 24) & 0xff
    this.data[at + 1] = (v >>> 16) & 0xff
    this.data[at + 2] = (v >>> 8) & 0xff
    this.data[at + 3] = v & 0xff
    return this.length
  }

  toBytes(): Uint8Array {
    return Uint8Array.from(this.data)
  }
}

interface PairSet {
  left: number
  pairs: GlyphPairValue[]
}

/** Sorted pairs grouped by left glyph. */
function pairSets(pairs: GlyphPairValue[]): PairSet[] {
  const sets: PairSet[] = []
  for (const p of pairs) {
    const last = sets[sets.length - 1]
    if (last && last.left === p.left) last.pairs.push(p)
    else sets.push({ left: p.left, pairs: [p] })
  }
  return sets
}

/**
 * Pair sets split into subtables of at most 64 KiB, so their 16-bit offsets reach every
 * pair set. A left glyph keeps all its pairs in one subtable (alone, one with more than
 * about 16,000 pairs makes a larger subtable: its pair set still starts within reach).
 */
function splitSubtables(sets: PairSet[]): PairSet[][] {
  const out: PairSet[][] = []
  let size = 0
  for (const set of sets) {
    // pair set offset, coverage glyph and pair count (2 bytes each), 4 bytes per pair
    const add = 6 + 4 * set.pairs.length
    if (!out.length || size + add > 0xffff) {
      out.push([])
      size = 14 // subtable header (10 bytes) and coverage header (4 bytes)
    }
    out[out.length - 1].push(set)
    size += add
  }
  return out
}

/** PairPos format 1 subtable: coverage of the left glyphs, then each one's pair set. */
function pairPosSubtable(sets: PairSet[]): Uint8Array {
  const w = new Writer()
  w.u16(1) // posFormat 1: glyph pairs
  const coverage = w.offset16()
  w.u16(0x0004) // valueFormat1: x advance
  w.u16(0) // valueFormat2: nothing on the right glyph
  w.u16(sets.length)
  const setOffsets = sets.map(() => w.offset16())
  w.fill16(coverage, 0)
  w.u16(1) // coverage format 1: sorted glyph list
  w.u16(sets.length)
  for (const set of sets) w.u16(set.left)
  sets.forEach((set, i) => {
    w.fill16(setOffsets[i], 0)
    w.u16(set.pairs.length)
    for (const p of set.pairs) {
      w.u16(p.right)
      w.u16(p.value & 0xffff)
    }
  })
  return w.toBytes()
}

/** A plain lookup reaches each subtable through a 16-bit offset from its own start. */
function fitsPlainLookup(subtables: Uint8Array[]): boolean {
  let last = 6 + 2 * subtables.length // lookup header
  for (let i = 0; i < subtables.length - 1; i++) last += subtables[i].length
  return last <= 0xffff
}

/**
 * GPOS 1.0 table holding `pairs` (see `kernPairList`). Small sets get one PairPos lookup
 * (type 2). When its subtables reach past 16-bit offsets, the lookup becomes an Extension
 * lookup (type 9) whose subtables point at the PairPos subtables with 32-bit offsets.
 */
export function buildKernGpos(pairs: GlyphPairValue[]): Uint8Array {
  const subtables = splitSubtables(pairSets(kernPairList(pairs))).map(pairPosSubtable)
  const extension = !fitsPlainLookup(subtables)
  const w = new Writer()
  w.u32(0x00010000) // version 1.0
  const scriptListOffset = w.offset16()
  const featureListOffset = w.offset16()
  const lookupListOffset = w.offset16()

  // Scripts, sorted by tag: a default language system each, using feature 0 (kern).
  const scriptList = w.fill16(scriptListOffset, 0)
  const tags = ['DFLT', 'latn']
  w.u16(tags.length)
  const scriptOffsets = tags.map((tag) => {
    w.tag(tag)
    return w.offset16()
  })
  for (const at of scriptOffsets) {
    w.fill16(at, scriptList)
    w.u16(4) // default language system, right after this header
    w.u16(0) // no other language systems
    w.u16(0) // lookupOrder (reserved)
    w.u16(0xffff) // no required feature
    w.u16(1)
    w.u16(0) // feature 0
  }

  const featureList = w.fill16(featureListOffset, 0)
  w.u16(1)
  w.tag('kern')
  const kern = w.offset16()
  w.fill16(kern, featureList)
  w.u16(0) // no feature parameters
  w.u16(1)
  w.u16(0) // lookup 0

  const lookupList = w.fill16(lookupListOffset, 0)
  w.u16(1)
  const lookupOffset = w.offset16()
  const lookup = w.fill16(lookupOffset, lookupList)
  w.u16(extension ? 9 : 2)
  w.u16(0) // lookupFlag
  w.u16(subtables.length)
  const subtableOffsets = subtables.map(() => w.offset16())
  if (extension) {
    // ExtensionPosFormat1 records first, then the PairPos subtables they point at.
    const records = subtableOffsets.map((at) => {
      const record = w.fill16(at, lookup)
      w.u16(1) // posFormat 1
      w.u16(2) // extensionLookupType: pair adjustment
      return { record, offset: w.offset32() }
    })
    subtables.forEach((s, i) => {
      w.fill32(records[i].offset, records[i].record)
      w.bytes(s)
    })
  } else {
    subtables.forEach((s, i) => {
      w.fill16(subtableOffsets[i], lookup)
      w.bytes(s)
    })
  }
  return w.toBytes()
}
