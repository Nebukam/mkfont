// ============================================================
// Font file import (TTF / OTF / WOFF) — v1 TTFImport via opentype.js.
// ============================================================

import opentype from 'opentype.js'
import svgpath from 'svgpath'
import type { FamilyValues, PathData, TransformSettings } from '../types/font'
import { Anchor, BoundsMode, HAlign, ScaleMode, VAlign } from '../types/font'
import { pathBBox, translateBBox } from './geometry'
import { emptyPathData, isEmptyPathContent } from './model'
import { codePointToKey } from './unicode-keys'
import { gsub } from './export-font'

export interface FontImportItem {
  key: string
  name: string
  pathData: PathData
  /** Source advance width (font units of the imported font). */
  advance: number
  transforms: Partial<TransformSettings>
  ligature: boolean
}

export interface ParsedFont {
  familyName: string
  styleName: string
  unitsPerEm: number
  ascender: number
  descender: number
  xHeight: number | null
  capHeight: number | null
  glyphCount: number
  font: opentype.Font
}

export function parseFontFile(bytes: ArrayBuffer): ParsedFont {
  const font = opentype.parse(bytes)
  const os2 = (font.tables as Record<string, Record<string, number> | undefined>).os2
  const name = (n: Record<string, string> | undefined): string => (n ? n.en ?? Object.values(n)[0] ?? '' : '')
  return {
    // i18n-ignore: font data (fallback family name of the imported font)
    familyName: name(font.names.fontFamily as unknown as Record<string, string>) || 'Imported',
    // i18n-ignore: font data (fallback style name of the imported font)
    styleName: name(font.names.fontSubfamily as unknown as Record<string, string>) || 'Regular',
    unitsPerEm: font.unitsPerEm,
    ascender: font.ascender,
    descender: font.descender,
    xHeight: os2?.sxHeight || null,
    capHeight: os2?.sCapHeight || null,
    glyphCount: font.glyphs.length,
    font
  }
}

function glyphD(g: opentype.Glyph): string {
  try {
    return g.path ? g.path.toPathData(3) : ''
  } catch {
    return ''
  }
}

/**
 * Build import items scaled to `targetAscent` (v1 GetImportData):
 * paths are flipped to Y-down, scaled so the source ascender matches the
 * target ascender, and side bearings become shift / push.
 */
export function fontImportItems(pf: ParsedFont, targetAscent: number, includeLigatures = true): FontImportItem[] {
  const { font } = pf
  const ascent = pf.ascender || pf.unitsPerEm * 0.7
  const scale = targetAscent / ascent
  const items: FontImportItem[] = []
  const seen = new Set<string>()

  const makeItem = (g: opentype.Glyph, key: string, ligature: boolean): FontImportItem => {
    const d = glyphD(g)
    const adv = (g.advanceWidth ?? pf.unitsPerEm) * scale
    let pathData: PathData = emptyPathData()
    let shift = 0
    let push = 0
    if (d && !isEmptyPathContent(d)) {
      const flipped = svgpath(d).scale(scale, -scale).translate(0, ascent * scale).toString()
      const bbox = pathBBox(flipped)
      if (bbox.width > 0 || bbox.height > 0) {
        shift = bbox.x
        push = adv - (bbox.width + shift)
        const path = svgpath(flipped).translate(-bbox.x, 0).toString()
        pathData = { exists: true, markedBBox: false, path, width: bbox.width, height: ascent * scale, bbox: translateBBox(bbox, -bbox.x, 0) }
      }
    }
    const transforms: Partial<TransformSettings> = {
      bounds: BoundsMode.MixedVertical,
      scale: ScaleMode.Ascender,
      'scale-factor': 1,
      valign: VAlign.Baseline,
      halign: HAlign.XMin,
      anchor: Anchor.BottomLeft,
      'auto-w': true,
      xshift: shift,
      xpush: pathData.emptyPath ? adv : push
    }
    return { key, name: g.name ?? '', pathData, advance: adv, transforms, ligature }
  }

  for (let i = 0; i < font.glyphs.length; i++) {
    const g = font.glyphs.get(i)
    const unicodes = (g.unicodes && g.unicodes.length ? g.unicodes : g.unicode !== undefined ? [g.unicode] : []) as number[]
    for (const cp of unicodes) {
      if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0)) continue
      const key = codePointToKey(cp)
      if (seen.has(key)) continue
      seen.add(key)
      items.push(makeItem(g, key, false))
    }
  }

  if (includeLigatures) {
    const cpOf = new Map<number, number>()
    for (let i = 0; i < font.glyphs.length; i++) {
      const g = font.glyphs.get(i)
      if (g.unicode !== undefined) cpOf.set(i, g.unicode)
    }
    let ligs: { sub: number[]; by: number }[] = []
    try {
      ligs = gsub(font).getLigatures('liga')
    } catch {
      ligs = []
    }
    for (const l of ligs) {
      const cps = l.sub.map((s) => cpOf.get(s))
      if (cps.some((c) => c === undefined)) continue
      const key = (cps as number[]).map(codePointToKey).join('+')
      if (seen.has(key)) continue
      seen.add(key)
      items.push(makeItem(font.glyphs.get(l.by), key, true))
    }
  }
  return items
}

/** Family metrics for a new font started from a font file (v1 FamilyFromTTF). */
export function familyFromFont(pf: ParsedFont, items: FontImportItem[]): Partial<FamilyValues> {
  const em = pf.unitsPerEm
  const ascent = pf.ascender || em * 0.7
  const height = (key: string): number | null => {
    const it = items.find((i) => i.key === key)
    return it && !it.pathData.emptyPath ? it.pathData.bbox.height : null
  }
  const maxAdv = items.reduce((m, i) => Math.max(m, i.advance), 0)
  return {
    'font-family': pf.familyName,
    style: pf.styleName,
    em,
    ascent,
    baseline: ascent,
    descent: pf.descender || -em * 0.25,
    width: Math.round(Math.min(maxAdv || em, em)),
    height: em,
    'x-height': pf.xHeight ?? height('0078') ?? Math.round(em * 0.5),
    'cap-height': pf.capHeight ?? height('004d') ?? Math.round(em * 0.7)
  }
}
