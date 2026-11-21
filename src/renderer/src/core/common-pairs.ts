/*!
 * Common kerning pairs: "kerning-pairs" by André Fuchs, https://github.com/andre-fuchs/kerning-pairs
 * Copyright 2019 André Fuchs
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
 * OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// ============================================================
// Common kerning pairs: 3,736 pairs of characters, ranked by how
// often they occur in text (24 languages), how many fonts kern them
// and by how much (data/kerning-pairs.json, `npm run gen:kerning-pairs`).
// The first 1,000 or so occur on about every page of text.
// ============================================================

import LIST from '../data/kerning-pairs.json'
import { pairKey } from './kerning'
import { codePointToKey } from './unicode-keys'

/** Sub-lists of the common pairs. Pairs with a space have their own list, outside "all". */
export type CommonGroup = 'all' | 'upper' | 'lower' | 'mixed' | 'punct' | 'space'

/** In display order. Names and descriptions: `kerning.commonGroups.<id>` in the catalog. */
export const COMMON_GROUPS: { id: CommonGroup }[] = [
  { id: 'all' },
  { id: 'upper' },
  { id: 'mixed' },
  { id: 'lower' },
  { id: 'punct' },
  { id: 'space' }
]

const isUpper = (c: string): boolean => c !== c.toLowerCase()
const isLower = (c: string): boolean => c !== c.toUpperCase()

/** The sub-list of a pair of characters. */
export function commonGroupOf(left: string, right: string): Exclude<CommonGroup, 'all'> {
  if (left === ' ' || right === ' ') return 'space'
  if (isUpper(left) && isUpper(right)) return 'upper'
  if (isLower(left) && isLower(right)) return 'lower'
  if ((isUpper(left) || isLower(left)) && (isUpper(right) || isLower(right))) return 'mixed'
  return 'punct'
}

interface Index {
  rank: Map<string, number>
  groups: Record<CommonGroup, string[]>
}

let index: Index | null = null

/** Built on first use: pair keys by rank, and each pair's rank. */
function build(): Index {
  if (index) return index
  const rank = new Map<string, number>()
  const groups: Record<CommonGroup, string[]> = { all: [], upper: [], lower: [], mixed: [], punct: [], space: [] }
  ;(LIST as string[]).forEach((text, i) => {
    const [l, r] = Array.from(text)
    const key = pairKey(codePointToKey(l.codePointAt(0)!), codePointToKey(r.codePointAt(0)!))
    rank.set(key, i + 1)
    const group = commonGroupOf(l, r)
    groups[group].push(key)
    if (group !== 'space') groups.all.push(key)
  })
  index = { rank, groups }
  return index
}

/** The pair keys of a sub-list, most relevant first. */
export function commonPairs(group: CommonGroup): string[] {
  return build().groups[group]
}

/** How many pairs the common list has (3,736). */
export const COMMON_PAIR_COUNT = (LIST as string[]).length

/** A pair's rank in the common list (1 is the most relevant), if it is listed. */
export function commonRank(key: string): number | undefined {
  return build().rank.get(key)
}

let glyphKeys: Set<string> | null = null

/** Every character of the common list, as glyph keys (the space included). */
export function commonGlyphKeys(): Set<string> {
  if (!glyphKeys) glyphKeys = new Set((LIST as string[]).flatMap((text) => Array.from(text, (c) => codePointToKey(c.codePointAt(0)!))))
  return glyphKeys
}
