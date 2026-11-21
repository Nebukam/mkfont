// ============================================================
// Generates MkFont's Unicode data from the Unicode Character Database.
//
// Usage:
//   node scripts/gen-unicode.mjs <ucd-dir>
//
// <ucd-dir> must contain UnicodeData.txt and Blocks.txt
// (https://www.unicode.org/Public/UCD/latest/ucd/).
//
// Outputs:
//   src/renderer/src/data/ucd-names.json     names + decompositions (lazy loaded)
//   src/renderer/src/core/gc-ranges.ts       general category ranges
//   src/renderer/src/core/unicode-blocks.ts  block list
// ============================================================

import { readFileSync, writeFileSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ucdDir = process.argv[2]
if (!ucdDir) {
  console.error('usage: node scripts/gen-unicode.mjs <ucd-dir>')
  process.exit(1)
}

const unicodeData = readFileSync(join(ucdDir, 'UnicodeData.txt'), 'utf-8').split(/\r?\n/)
const blocksTxt = readFileSync(join(ucdDir, 'Blocks.txt'), 'utf-8').split(/\r?\n/)
const versionMatch = /Blocks-(\d+\.\d+\.\d+)/.exec(blocksTxt[0] ?? '')
const version = versionMatch ? versionMatch[1] : 'unknown'

// --- Parse UnicodeData.txt ---

const names = {}
const decomp = {}
const nameRanges = [] // [start, end, prefix]
const gcPoints = [] // [cp, gc] or [start, end, gc]
let pendingFirst = null

for (const line of unicodeData) {
  if (!line) continue
  const f = line.split(';')
  const cp = parseInt(f[0], 16)
  let name = f[1]
  const gc = f[2]
  const dec = f[5]

  if (name.endsWith(', First>')) {
    pendingFirst = { cp, label: name.slice(1, -', First>'.length), gc }
    continue
  }
  if (name.endsWith(', Last>') && pendingFirst) {
    const label = pendingFirst.label
    gcPoints.push([pendingFirst.cp, cp, gc])
    let prefix = null
    if (label.startsWith('CJK Ideograph')) prefix = 'CJK UNIFIED IDEOGRAPH-'
    else if (label.startsWith('Tangut Ideograph')) prefix = 'TANGUT IDEOGRAPH-'
    else if (label.startsWith('Hangul Syllable')) prefix = '#HANGUL'
    else if (label.includes('Surrogate')) prefix = null
    else if (label.includes('Private Use')) prefix = 'PRIVATE USE-'
    else prefix = label.toUpperCase() + '-'
    if (prefix) nameRanges.push([pendingFirst.cp, cp, prefix])
    pendingFirst = null
    continue
  }

  gcPoints.push([cp, cp, gc])
  if (name === '<control>') name = f[10] ? f[10] : `CONTROL-${f[0]}`
  const key = cp.toString(16)
  names[key] = name
  if (dec) decomp[key] = dec.toLowerCase().replace(/\b0+([0-9a-f])/g, '$1')
}

// --- Names JSON (lazy loaded by the renderer) ---

const namesOut = { version, names, decomp, nameRanges }
const namesPath = join(root, 'src/renderer/src/data/ucd-names.json')
writeFileSync(namesPath, JSON.stringify(namesOut))
console.log(`ucd-names.json: ${Object.keys(names).length} names, ${Object.keys(decomp).length} decompositions, ${nameRanges.length} ranges`)

// --- General category ranges ---

const GC_KEYS = [...new Set(gcPoints.map((p) => p[2]))].sort()
const merged = []
for (const [s, e, gc] of gcPoints) {
  const gi = GC_KEYS.indexOf(gc)
  const last = merged[merged.length - 1]
  if (last && last[2] === gi && last[1] + 1 === s) last[1] = e
  else merged.push([s, e, gi])
}
let gcTs = `// Auto-generated from the Unicode Character Database ${version} (UnicodeData.txt)
// Do not edit manually — regenerate with scripts/gen-unicode.mjs

/** General Category keys referenced by GC_RANGES. */
export const GC_KEYS: string[] = ${JSON.stringify(GC_KEYS)}

/**
 * Compact range map: [startCodePoint, endCodePoint, gcKeyIndex], sorted by start.
 * Code points outside every range are unassigned ('Cn').
 */
export const GC_RANGES: number[][] = [
`
for (let i = 0; i < merged.length; i += 8) {
  gcTs += '  ' + merged.slice(i, i + 8).map((r) => `[${r.join(',')}]`).join(',') + ',\n'
}
gcTs += ']\n'
writeFileSync(join(root, 'src/renderer/src/core/gc-ranges.ts'), gcTs)
console.log(`gc-ranges.ts: ${merged.length} ranges`)

// --- Blocks ---

const blocks = []
for (const line of blocksTxt) {
  const m = /^([0-9A-F]+)\.\.([0-9A-F]+); (.+)$/.exec(line.trim())
  if (!m) continue
  blocks.push({ name: m[3], start: parseInt(m[1], 16), end: parseInt(m[2], 16) })
}
let blocksTs = `// Auto-generated from the Unicode Character Database ${version} (Blocks.txt)
// Do not edit manually — regenerate with scripts/gen-unicode.mjs

export interface UnicodeBlock {
  name: string
  start: number
  end: number
}

export const UCD_VERSION = '${version}'

export const UNICODE_BLOCKS: UnicodeBlock[] = [
`
for (const b of blocks) {
  blocksTs += `  { name: ${JSON.stringify(b.name)}, start: 0x${b.start.toString(16).toUpperCase().padStart(4, '0')}, end: 0x${b.end.toString(16).toUpperCase().padStart(4, '0')} },\n`
}
blocksTs += ']\n'
writeFileSync(join(root, 'src/renderer/src/core/unicode-blocks.ts'), blocksTs)
console.log(`unicode-blocks.ts: ${blocks.length} blocks (UCD ${version})`)
