// ============================================================
// Font export
//   TTF — SVG font → svg2ttf (same pipeline as v1, quadratic outlines)
//   OTF — opentype.js CFF (cubic outlines kept as-is)
//   WOFF, WOFF2 — the TTF in a web container (woff.ts)
// Both fonts get a GSUB `liga` feature for ligature glyphs, and a
// GPOS `kern` feature when there are kerning pairs (gpos.ts).
// ============================================================

import svgpath from 'svgpath'
import svg2ttf from 'svg2ttf'
import opentype from 'opentype.js'
import type { Family, Glyph } from '../types/font'
import { advanceWidth, type ComputedMap } from './compute'
import { buildKernGpos, kernPairList, kernValue, type GlyphPairValue } from './gpos'
import { isEmptyPathContent } from './model'
import type { FontFormat } from './font-formats'
import { addSfntTables } from './sfnt'
import { compareKeys, isLigatureKey, keyToChars, keyToCodePoints } from './unicode-keys'
import { MessageError, msg, type Message } from '../i18n/message'

export type { FontFormat }

/** GSUB helpers of opentype.js (missing from its type definitions). */
export interface GsubApi {
  getLigatures(feature: string, script?: string, language?: string): { sub: number[]; by: number }[]
  addLigature(feature: string, ligature: { sub: number[]; by: number }, script?: string, language?: string): void
}

export function gsub(font: opentype.Font): GsubApi {
  return font.substitution as unknown as GsubApi
}

export interface ExportGlyph {
  key: string
  name: string
  chars: string
  codePoints: number[]
  advance: number
  /** Y-up font path (baseline at y = 0), '' when the glyph has no outline. */
  d: string
  ligature: boolean
}

/** A kerning pair by glyph key ("0041", ligatures "0066+0069"): `value` is added to the left glyph's advance. */
export interface KernPair {
  left: string
  right: string
  value: number
}

export interface ExportResult {
  data: ArrayBuffer
  glyphCount: number
  ligatureCount: number
  /** Glyph pairs written to the GPOS `kern` feature. */
  kerningCount: number
  /** Shown with `tm`. */
  warnings: Message[]
}

function postScriptName(key: string, custom: string): string {
  const clean = custom.trim().replace(/[^A-Za-z0-9._-]/g, '')
  if (clean) return clean
  const single = (cp: number): string =>
    cp <= 0xffff ? `uni${cp.toString(16).toUpperCase().padStart(4, '0')}` : `u${cp.toString(16).toUpperCase()}`
  return keyToCodePoints(key).map(single).join('_')
}

/** Flip a Y-down font-unit path to the Y-up font coordinate system (v1 `_UpdateFontObject`). */
export function toFontSpace(path: string, baseline: number): string {
  if (isEmptyPathContent(path)) return ''
  return svgpath(path).scale(1, -1).translate(0, baseline).round(3).toString()
}

/** Glyphs that end up in the exported font (v1: skip out-of-bounds and non-exported). */
export function collectExportGlyphs(
  family: Family,
  glyphs: Map<string, Glyph>,
  computed: ComputedMap,
  /** Subset: only glyphs whose key passes (the text preview builds just what it shows). */
  include?: (key: string) => boolean
): { list: ExportGlyph[]; warnings: Message[] } {
  const list: ExportGlyph[] = []
  const warnings: Message[] = []
  const bsl = family.values.baseline
  const usedNames = new Set<string>()

  // Single characters by code point, then ligatures.
  const keys = [...glyphs.keys()].sort(compareKeys)

  for (const key of keys) {
    if (include && !include(key)) continue
    const glyph = glyphs.get(key)!
    const variant = glyph.variants[0]
    const c = computed.get(key)?.[0]
    if (!variant || !variant.doExport || !c) continue
    if (c.oob) {
      warnings.push(msg('document.export.warnings.outOfBounds', { glyph: keyToChars(key) || key }))
      continue
    }
    let name = postScriptName(key, glyph.name)
    while (usedNames.has(name)) name += '.alt'
    usedNames.add(name)
    list.push({
      key,
      name,
      chars: keyToChars(key),
      codePoints: keyToCodePoints(key),
      advance: Math.max(0, Math.round(advanceWidth(c, family))),
      d: toFontSpace(c.path, bsl),
      ligature: isLigatureKey(key)
    })
  }

  // Ligatures need every component character in the font.
  const singles = new Set(list.filter((g) => !g.ligature).map((g) => g.codePoints[0]))
  for (const g of list) {
    if (!g.ligature) continue
    const missing = g.codePoints.filter((cp) => !singles.has(cp))
    if (missing.length) {
      warnings.push(
        msg('document.export.warnings.ligatureMissing', { chars: g.chars, missing: missing.map((cp) => String.fromCodePoint(cp)).join(', ') })
      )
      g.ligature = false
      g.codePoints = []
    }
  }
  return { list, warnings }
}

function xmlAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/[\u0000-\u001f]/g, (c) => `&#${c.charCodeAt(0)};`)
}

function charsAttr(codePoints: number[]): string {
  return codePoints.map((cp) => `&#x${cp.toString(16)};`).join('')
}

/** SVG font document (v1 family fontObject). */
export function buildSvgFont(family: Family, list: ExportGlyph[]): string {
  const v = family.values
  // i18n-ignore: font data (default style name written into the font)
  const id = `${v['font-family'] || 'mkfont'}-${v.style || 'Regular'}`
  const out: string[] = []
  out.push('<?xml version="1.0" standalone="no"?>')
  out.push('<svg xmlns="http://www.w3.org/2000/svg"><defs>')
  out.push(`<font id="${xmlAttr(id)}" horiz-adv-x="${Math.round(v.width)}" vert-adv-y="${Math.round(v.height)}">`)
  out.push(
    `<font-face font-family="${xmlAttr(v['font-family'] || 'mkfont')}" font-weight="${v.weight}" font-stretch="normal" ` +
      `units-per-em="${Math.round(v.em)}" ascent="${Math.round(v.baseline)}" descent="${Math.round(v.descent)}"` +
      (typeof v['x-height'] === 'number' ? ` x-height="${Math.round(v['x-height'])}"` : '') +
      (typeof v['cap-height'] === 'number' ? ` cap-height="${Math.round(v['cap-height'])}"` : '') +
      (typeof v['u-position'] === 'number' ? ` underline-position="${Math.round(v['u-position'])}"` : '') +
      (typeof v['u-thickness'] === 'number' ? ` underline-thickness="${Math.round(v['u-thickness'])}"` : '') +
      ' />'
  )
  out.push('<missing-glyph horiz-adv-x="0" d="" />')
  for (const g of list) {
    const uni = g.codePoints.length ? ` unicode="${charsAttr(g.codePoints)}"` : ''
    out.push(`<glyph glyph-name="${xmlAttr(g.name)}"${uni} horiz-adv-x="${g.advance}" d="${xmlAttr(g.d)}" />`)
  }
  out.push('</font></defs></svg>')
  return out.join('\n')
}

/**
 * The font version as "major.minor", the only form svg2ttf accepts: "Version 1.2",
 * "1.2.3", "2" and "1.1 beta" give 1.2, 1.2, 2.0 and 1.1 (v1 failed on most of these).
 */
export function fontVersionNumber(raw: string | undefined): string {
  const m = /^(\d+)(?:\.(\d+))?/.exec((raw ?? '').trim().replace(/^version\s*/i, ''))
  return m ? `${parseInt(m[1], 10)}.${m[2] ?? '0'}` : '1.0'
}

/** Name-table version string: the user's text, prefixed "Version " once. */
function fontVersionString(raw: string | undefined): string {
  const t = (raw ?? '').trim()
  // i18n-ignore: font data (name-table version string)
  if (!t) return 'Version 1.0'
  // i18n-ignore: font data (name-table version string)
  return /^version\s/i.test(t) ? t : `Version ${t}`
}

/**
 * The font's PostScript name (name ID 6, and the font name in an OTF's CFF table): printable
 * ASCII without spaces or `[](){}<>/%`, at most 63 characters, as the OpenType spec and font
 * sanitizers require. Accents are dropped ("Café Sans" → "CafeSans-Regular"). A family with
 * nothing left (non-Latin) gets a stable name made from a hash of it, so two such fonts
 * installed together keep different names.
 */
export function fontPostScriptName(family: string, style: string): string {
  const clean = (s: string): string =>
    s
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .replace(/[^\x21-\x7e]|[[\](){}<>/%]/g, '')
  // i18n-ignore: font data (fallback PostScript name written into the font)
  const name = clean(family) || `MkFont${fnv1a(family)}`
  const sub = clean(style)
  return (sub ? `${name}-${sub}` : name).slice(0, 63)
}

/** 32-bit FNV-1a hash of a string, as 8 hex digits. */
function fnv1a(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function fontMeta(family: Family): { familyname: string; subfamilyname: string; copyright: string; description: string; url: string; version: string } {
  const v = family.values
  return {
    familyname: v['font-family'] || 'unamed-mkfont',
    // i18n-ignore: font data (default style name written into the font)
    subfamilyname: v.style || 'Regular',
    copyright: v.copyright || 'mkfont',
    // i18n-ignore: font data (default description written into the font)
    description: v.description || 'Made with mkfont',
    url: v.url || 'https://github.com/Nebukam/mkfont',
    version: v.version || '1.0'
  }
}

/**
 * Glyph index of each exported glyph in the built font: .notdef is 0, then the glyphs in
 * list order. svg2ttf (TTF) also merges a glyph into the first one with the same advance
 * and outline (svg2ttf lib/svg.js `deduplicateGlyps`), so merged glyphs share its index.
 */
export function fontGlyphIndices(format: FontFormat, list: ExportGlyph[]): Map<string, number> {
  const indices = new Map<string, number>()
  const first = new Map<string, number>() // TTF: advance and outline → index
  let next = 1
  for (const g of list) {
    const same = `${g.advance} ${g.d.trim()}`
    let index = format === 'ttf' ? first.get(same) : undefined
    if (index === undefined) {
      index = next++
      first.set(same, index)
    }
    indices.set(g.key, index)
  }
  return indices
}

/** Kerning by glyph index; pairs with a glyph that is not in the font are left out. */
function kernGlyphPairs(kerning: KernPair[], indices: Map<string, number>): GlyphPairValue[] {
  const pairs: GlyphPairValue[] = []
  for (const p of kerning) {
    const left = indices.get(p.left)
    const right = indices.get(p.right)
    if (left !== undefined && right !== undefined) pairs.push({ left, right, value: p.value })
  }
  return pairs
}

/** The built font with a GPOS `kern` table, or unchanged when no pair has a value. */
function addKerning(font: ArrayBuffer, list: ExportGlyph[], pairs: GlyphPairValue[]): ArrayBuffer {
  if (kernPairList(pairs).length === 0) return font
  // Kerning looks at 2 glyphs, a ligature at all its characters.
  const maxContext = list.reduce((m, g) => (g.ligature ? Math.max(m, g.codePoints.length) : m), 2)
  return addSfntTables(font, { GPOS: buildKernGpos(pairs) }, { maxContext })
}

export function buildTTF(family: Family, list: ExportGlyph[], kerning: KernPair[] = []): ArrayBuffer {
  const svg = buildSvgFont(family, list)
  const meta = fontMeta(family)
  const ttf = svg2ttf(svg, { ...meta, version: fontVersionNumber(meta.version) })
  const bytes = ttf.buffer as Uint8Array
  const font = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  return addKerning(font, list, kernGlyphPairs(kerning, fontGlyphIndices('ttf', list)))
}

function toOpenTypePath(d: string): opentype.Path {
  const p = new opentype.Path()
  if (!d) return p
  svgpath(d)
    .abs()
    .unshort()
    .unarc()
    .iterate((seg: (string | number)[], _i: number, x: number, y: number) => {
      const n = seg as number[]
      switch (seg[0]) {
        case 'M': p.moveTo(n[1], n[2]); break
        case 'L': p.lineTo(n[1], n[2]); break
        case 'H': p.lineTo(n[1], y); break
        case 'V': p.lineTo(x, n[1]); break
        case 'C': p.curveTo(n[1], n[2], n[3], n[4], n[5], n[6]); break
        case 'Q': p.quadraticCurveTo(n[1], n[2], n[3], n[4]); break
        case 'Z':
        case 'z':
          p.close()
          break
      }
    })
  return p
}

export function buildOTF(family: Family, list: ExportGlyph[], kerning: KernPair[] = []): ArrayBuffer {
  const v = family.values
  const meta = fontMeta(family)
  const notdef = new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 0, path: new opentype.Path() })
  const otGlyphs: opentype.Glyph[] = [notdef]
  const indexByCp = new Map<number, number>()
  const ligatures: { sub: number[]; lig: number }[] = []

  for (const g of list) {
    const glyph = new opentype.Glyph({
      name: g.name,
      unicode: !g.ligature && g.codePoints.length === 1 ? g.codePoints[0] : undefined,
      advanceWidth: g.advance,
      path: toOpenTypePath(g.d)
    })
    const index = otGlyphs.length
    otGlyphs.push(glyph)
    if (!g.ligature && g.codePoints.length === 1) indexByCp.set(g.codePoints[0], index)
  }
  list.forEach((g, i) => {
    if (!g.ligature) return
    const sub = g.codePoints.map((cp) => indexByCp.get(cp))
    if (sub.every((s): s is number => s !== undefined)) ligatures.push({ sub, lig: i + 1 })
  })

  const font = new opentype.Font({
    familyName: meta.familyname,
    styleName: meta.subfamilyname,
    // Without it, opentype.js keeps accents and brackets in the CFF font name, and font
    // sanitizers (browsers, the text preview) reject the whole font.
    postScriptName: fontPostScriptName(meta.familyname, meta.subfamilyname),
    unitsPerEm: Math.round(v.em),
    // opentype.js requires ascender > 0 and descender <= 0 (FontForge-style positive
    // descenders are common input); the glyph outlines are unaffected.
    ascender: Math.max(1, Math.round(v.baseline)),
    descender: Math.min(0, Math.round(v.descent)),
    copyright: meta.copyright,
    description: meta.description,
    designerURL: meta.url,
    version: fontVersionString(meta.version),
    glyphs: otGlyphs
  } as opentype.FontConstructorOptions)

  const os2 = (font.tables as Record<string, Record<string, number>>).os2
  if (os2) {
    os2.usWeightClass = v.weight || 400
    os2.sxHeight = Math.round(v['x-height'])
    os2.sCapHeight = Math.round(v['cap-height'])
  }
  // Longest first: shapers take the first ligature that matches, so "ffi" must
  // come before "ff" (svg2ttf orders TTF ligatures the same way).
  ligatures.sort((a, b) => b.sub.length - a.sub.length)
  for (const l of ligatures) gsub(font).addLigature('liga', { sub: l.sub, by: l.lig })
  return addKerning(font.toArrayBuffer(), list, kernGlyphPairs(kerning, fontGlyphIndices('otf', list)))
}

export function exportFont(
  format: FontFormat,
  family: Family,
  glyphs: Map<string, Glyph>,
  computed: ComputedMap,
  kerning: KernPair[] = []
): ExportResult {
  const { list, warnings } = collectExportGlyphs(family, glyphs, computed)
  if (list.length === 0) throw new MessageError(msg('document.export.noGlyphs'))
  const data = format === 'otf' ? buildOTF(family, list, kerning) : buildTTF(family, list, kerning)
  const indices = fontGlyphIndices(format, list)
  const skipped = kerning.filter((p) => kernValue(p.value) !== 0 && !(indices.has(p.left) && indices.has(p.right))).length
  if (skipped) warnings.push(msg('document.export.warnings.kerningSkipped', { count: skipped }))
  return {
    data,
    glyphCount: list.length,
    ligatureCount: list.filter((g) => g.ligature).length,
    kerningCount: kernPairList(kernGlyphPairs(kerning, indices)).length,
    warnings
  }
}
