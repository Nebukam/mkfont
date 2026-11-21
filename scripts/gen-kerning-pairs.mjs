// ============================================================
// Generates MkFont's common kerning pairs from André Fuchs'
// kerning-pairs project (MIT): https://github.com/andre-fuchs/kerning-pairs
//
// Usage:
//   node scripts/gen-kerning-pairs.mjs <relevant_kerning_raw.json>
//
// The input is the project's result/relevant_kerning_raw.json: pairs of
// two characters, ranked by how often they occur in text (24 languages),
// how many fonts kern them, and by how much.
//
// Output:
//   src/renderer/src/data/kerning-pairs.json   the same pairs, compact
// The license of the list is in src/renderer/src/data/kerning-pairs.LICENSE.md.
// ============================================================

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const input = process.argv[2]
if (!input) {
  console.error('usage: node scripts/gen-kerning-pairs.mjs <relevant_kerning_raw.json>')
  process.exit(1)
}

const pairs = JSON.parse(readFileSync(input, 'utf-8'))
if (!Array.isArray(pairs)) throw new Error('Expected a JSON array of pairs')
const seen = new Set()
for (const p of pairs) {
  if (typeof p !== 'string' || Array.from(p).length !== 2) throw new Error(`Not a pair of two characters: ${JSON.stringify(p)}`)
  if (seen.has(p)) throw new Error(`Duplicate pair: ${JSON.stringify(p)}`)
  seen.add(p)
}

const out = resolve(root, 'src/renderer/src/data/kerning-pairs.json')
writeFileSync(out, JSON.stringify(pairs) + '\n')
console.log(`${pairs.length} pairs -> ${out}`)
