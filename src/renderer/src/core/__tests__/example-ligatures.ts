import { createGlyph } from '../model'
import { charsToKey } from '../unicode-keys'
import type { Family, Glyph } from '../../types/font'

const BOX = {
  exists: true,
  markedBBox: false,
  path: 'M0 0H500V700H0Z',
  width: 500,
  height: 700,
  bbox: { x: 0, y: 0, width: 500, height: 700, top: 0, bottom: 700, left: 0, right: 500 }
}

/**
 * The example font has no ligatures. Tests that need a real font with some
 * add a plain box for each of these texts ("TT", "T.") and get their keys.
 */
export function addLigatures(family: Family, glyphs: Map<string, Glyph>, texts: string[]): string[] {
  return texts.map((text) => {
    const key = charsToKey(text)
    glyphs.set(key, createGlyph(key, family.transforms, { pathData: BOX }))
    return key
  })
}
