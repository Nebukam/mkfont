// ============================================================
// SVG import / export (v1 SVGOPS.SVGStats, SVGFromGlyphVariant,
// TryGetMKFValues).
// ============================================================

import { optimize, type Config as SvgoConfig } from 'svgo/dist/svgo.browser.js'
import svgpath from 'svgpath'
import type { PathData, TransformSettings, Variant } from '../types/font'
import { makeBBox, pathBBox } from './geometry'
import { emptyPathData, isEmptyPathContent, RESAMPLED_TRANSFORM_KEYS, RESAMPLED_VARIANT_KEYS, TRANSFORM_KEYS } from './model'
import { msg, type Message } from '../i18n/message'

// Convert shapes to paths and bake transforms; skip cosmetic cleanups.
const SVGO_CONFIG: SvgoConfig = {
  multipass: false,
  plugins: [
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    // Inline class rules on every element they match (by default only on a single one),
    // and keep the rules: removing them also drops ids that <use> elements point to.
    { name: 'inlineStyles', params: { onlyMatchedOnce: false, removeMatchedSelectors: false } },
    'collapseGroups',
    { name: 'convertShapeToPath', params: { convertArcs: true } },
    {
      name: 'convertPathData',
      params: {
        applyTransforms: true,
        applyTransformsStroked: true,
        floatPrecision: 6,
        utilizeAbsolute: true,
        straightCurves: false,
        collapseRepeated: false,
        removeUseless: false
      }
    }
  ]
}

export interface SvgImport {
  exists: boolean
  path: string
  width: number
  height: number
  bbox: ReturnType<typeof pathBBox>
  markedBBox: boolean
  /** `<text>` contents — v1 turns them into components. */
  layers?: string[]
  /** Why nothing could be imported, when it is not simply "no paths" (shown with `tm`). */
  error?: Message
}

/** A color as the mark color is compared: lowercase, no "#", and rgb() notation (how Affinity writes colors) as rrggbb. */
function normalizeColor(c: string): string {
  const v = c.trim().toLowerCase()
  const rgb = /^rgba?\(([^)]*)\)$/.exec(v)
  if (rgb) {
    const channels = rgb[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((p) => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p)))
    if (channels.length === 3 && channels.every(Number.isFinite)) {
      return channels.map((n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')).join('')
    }
  }
  return v.replace(/^#/, '')
}

/** Accepted spellings of the mark color (v1: #rrggbb, #rgb, CMYK magenta #b9529f). */
function markColors(markColor: string): string[] {
  const c = normalizeColor(markColor)
  const out = [c, 'b9529f']
  if (c.length === 6 && c[0] === c[1] && c[2] === c[3] && c[4] === c[5]) out.push(c[0] + c[2] + c[4])
  if (c === 'ff00ff') out.push('magenta')
  return out
}

/** The value a CSS declaration list gives a property (the last declaration wins). */
function declared(css: string, prop: string): string | undefined {
  let out: string | undefined
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':')
    if (i > 0 && decl.slice(0, i).trim().toLowerCase() === prop) out = decl.slice(i + 1).replace(/!important/i, '').trim()
  }
  return out
}

/** A style property an element sets itself: inline style, then class rules, then the attribute. */
function styleOf(el: Element, prop: string, classRules: Map<string, string>): string | undefined {
  const inline = declared(el.getAttribute('style') ?? '', prop)
  if (inline !== undefined) return inline
  let fromClass: string | undefined
  for (const c of (el.getAttribute('class') ?? '').split(/\s+/)) {
    if (c) fromClass = declared(classRules.get(c) ?? '', prop) ?? fromClass
  }
  return fromClass ?? el.getAttribute(prop) ?? undefined
}

const keyword = (v: string | undefined): string | undefined => v?.trim().toLowerCase()

/** An inherited property's value: from the nearest element of `chain` that sets it. */
function inheritedValue(chain: Element[], prop: string, classRules: Map<string, string>): string | undefined {
  for (const el of chain) {
    const v = styleOf(el, prop, classRules)
    const k = keyword(v)
    if (v !== undefined && k !== 'inherit' && k !== 'unset') return v
  }
  return undefined
}

/** Overflow values that leave a viewport's content unclipped. */
const VISIBLE_OVERFLOW = new Set(['visible', 'auto'])

/** Elements whose content is not drawn where it stands (only through <use>, or never). */
const NOT_RENDERED = new Set(['defs', 'clipPath', 'mask', 'symbol', 'pattern', 'marker', 'style', 'title', 'desc', 'metadata'])
const NOT_RENDERED_SELECTOR = [...NOT_RENDERED].join(', ')

/** Most elements drawn through <use> copies: a few KB of nested references can describe billions. */
const MAX_USE_COPIES = 50_000
/** Most path data drawn, copies included (characters). */
const MAX_PATH_DATA = 8_000_000
/** Most nested <use> references followed. */
const MAX_USE_DEPTH = 16

class SvgTooComplex extends Error {
  constructor(readonly reason: Message) {
    super(reason.key)
  }
}

interface Viewport {
  width: number
  height: number
}

interface Shape {
  el: Element
  /** Transforms from the root down to the shape, its own included (SVG list order). */
  transform: string
  /** Groups, symbols, viewports and <use> elements the shape inherits paint from, nearest first. */
  inherited: Element[]
  /** The viewport its percentages resolve against. */
  viewport: Viewport
}

const joinTransforms = (...parts: (string | null | undefined)[]): string => parts.filter(Boolean).join(' ')

const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi

/** An element's transform list with space-separated arguments (svgpath cannot split "translate(100-50)"). */
function transformOf(el: Element): string | null {
  const t = el.getAttribute('transform')
  if (!t) return null
  return t.replace(/([a-zA-Z]+)\s*\(([^)]*)\)/g, (_m, name: string, args: string) => `${name}(${(args.match(NUMBER) ?? []).join(' ')})`)
}

/** CSS units in user units (96 per inch); em and ex at the default 16px font size. */
const UNITS: Record<string, number> = { px: 1, in: 96, cm: 96 / 2.54, mm: 96 / 25.4, q: 96 / 101.6, pt: 4 / 3, pc: 16, em: 16, ex: 8 }

/**
 * A length attribute in user units, or a percentage of `ref`.
 * undefined when missing, null when it cannot be resolved here.
 */
function length(el: Element, name: string, ref?: number): number | undefined | null {
  const raw = el.getAttribute(name)?.trim()
  if (!raw) return undefined
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z]*|%)$/i.exec(raw)
  if (!m) return null
  const v = parseFloat(m[1])
  const unit = m[2].toLowerCase()
  if (unit === '%') return ref !== undefined ? (v / 100) * ref : null
  if (unit === '') return v
  return UNITS[unit] !== undefined ? v * UNITS[unit] : null
}

interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

function viewBoxOf(el: Element): ViewBox | null {
  const parts = (el.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number)
  if (parts.length !== 4 || !parts.every(Number.isFinite) || !(parts[2] > 0) || !(parts[3] > 0)) return null
  return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] }
}

/** Maps a viewBox onto a viewport of `width` × `height` (preserveAspectRatio, "xMidYMid meet" by default). */
function viewBoxTransform(el: Element, vb: ViewBox, width: number, height: number): string {
  if (!(width > 0) || !(height > 0)) return ''
  const [align = 'xMidYMid', mode = 'meet'] = (el.getAttribute('preserveAspectRatio') ?? '').trim().split(/\s+/).filter(Boolean)
  let sx = width / vb.w
  let sy = height / vb.h
  let ox = 0
  let oy = 0
  if (align !== 'none') {
    const s = mode === 'slice' ? Math.max(sx, sy) : Math.min(sx, sy)
    sx = s
    sy = s
    const at = (min: string, max: string): number => (align.includes(max) ? 1 : align.includes(min) ? 0 : 0.5)
    ox = (width - vb.w * s) * at('xMin', 'xMax')
    oy = (height - vb.h * s) * at('YMin', 'YMax')
  }
  return `translate(${ox - vb.x * sx} ${oy - vb.y * sy}) scale(${sx} ${sy})`
}

/**
 * Drawn paths and rectangles, in document order, with their accumulated transforms.
 * Walks the rendered tree only and draws <use> references in place: SVGO bakes the
 * transforms of single-child groups, but other group transforms and references stay.
 */
function collectShapes(svg: Element, root: Viewport, classRules: Map<string, string>): Shape[] {
  const byId = new Map<string, Element>()
  for (const el of Array.from(svg.ownerDocument.querySelectorAll('[id]'))) {
    const id = el.getAttribute('id')!
    // Like browsers: the first element with an id wins.
    if (!byId.has(id)) byId.set(id, el)
  }
  const out: Shape[] = []
  let copies = 0
  let pathData = 0

  const offsetOf = (el: Element, vp: Viewport): string => {
    const x = length(el, 'x', vp.width) ?? 0
    const y = length(el, 'y', vp.height) ?? 0
    return x || y ? `translate(${x} ${y})` : ''
  }
  /** width / height from the first element that sets it, else 100% of the viewport. */
  const sizeOf = (els: Element[], name: 'width' | 'height', vp: Viewport): number => {
    for (const el of els) {
      const v = length(el, name, vp[name])
      if (typeof v === 'number') return v
    }
    return vp[name]
  }
  /** A nested viewport (an <svg>, or a symbol / svg drawn by <use>): its x / y, then its viewBox. */
  const enterViewport = (el: Element, sizeFrom: Element[], transform: string, inherited: Element[], depth: number, vp: Viewport): void => {
    const w = sizeOf(sizeFrom, 'width', vp)
    const h = sizeOf(sizeFrom, 'height', vp)
    // At zero size the viewBox does not apply, and the content is clipped away unless overflow is visible.
    if (!(w > 0 && h > 0) && !VISIBLE_OVERFLOW.has(keyword(styleOf(el, 'overflow', classRules)) ?? '')) return
    const vb = viewBoxOf(el)
    const t = joinTransforms(transform, offsetOf(el, vp), vb ? viewBoxTransform(el, vb, w, h) : '')
    visitChildren(el, t, [el, ...inherited], depth, vb ? { width: vb.w, height: vb.h } : { width: w, height: h })
  }
  const visitChildren = (parent: Element, transform: string, inherited: Element[], depth: number, vp: Viewport): void => {
    for (const child of Array.from(parent.children)) visit(child, transform, inherited, depth, vp)
  }
  const visit = (el: Element, transform: string, inherited: Element[], depth: number, vp: Viewport): void => {
    if (depth > 0 && ++copies > MAX_USE_COPIES) throw new SvgTooComplex(msg('imports.svg.errors.tooManyCopies'))
    const tag = el.tagName
    if (NOT_RENDERED.has(tag) || tag === 'text') return
    const t = joinTransforms(transform, transformOf(el))
    if (tag === 'path' || tag === 'rect') {
      pathData += tag === 'path' ? (el.getAttribute('d')?.length ?? 0) : 64
      if (pathData > MAX_PATH_DATA) throw new SvgTooComplex(msg('imports.svg.errors.tooMuchPathData'))
      out.push({ el, transform: t, inherited, viewport: vp })
      return
    }
    if (tag === 'svg') {
      enterViewport(el, [el], t, inherited, depth, vp)
      return
    }
    const chain = [el, ...inherited]
    if (tag === 'use') {
      const href = el.getAttribute('href') ?? el.getAttribute('xlink:href') ?? el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? ''
      const target = href.startsWith('#') ? byId.get(href.slice(1)) : undefined
      // A reference to an element the <use> is drawn inside (or to itself) is a cycle: browsers draw nothing.
      if (!target || depth >= MAX_USE_DEPTH || chain.includes(target)) return
      const ut = joinTransforms(t, offsetOf(el, vp))
      if (target.tagName === 'symbol' || target.tagName === 'svg') {
        // Drawn into the <use>'s viewport: the <use>'s width / height override the target's.
        enterViewport(target, [el, target], joinTransforms(ut, transformOf(target)), chain, depth + 1, vp)
      } else {
        // Anything else (path, group, another <use>…) is drawn as the <use>'s only child.
        visit(target, ut, chain, depth + 1, vp)
      }
      return
    }
    visitChildren(el, t, chain, depth, vp)
  }
  visitChildren(svg, '', [svg], 0, root)
  return out
}

/**
 * Painted with the mark color. Fill and stroke each come from the nearest element
 * that sets them: the shape, then the groups, symbols and <use> it inherits from.
 */
function isMarkShape(s: Shape, colors: string[], classRules: Map<string, string>): boolean {
  const chain = [s.el, ...s.inherited]
  return ['fill', 'stroke'].some((prop) => {
    const v = inheritedValue(chain, prop, classRules)
    return v !== undefined && colors.includes(normalizeColor(v))
  })
}

/** Paint values that draw nothing. */
const NO_PAINT = new Set(['none', 'transparent'])

/**
 * Draws nothing: its fill is none and so is its stroke (the default when nothing sets one).
 * Affinity writes each artboard as such a rectangle, over the whole glyph.
 */
function isUnpainted(s: Shape, classRules: Map<string, string>): boolean {
  const chain = [s.el, ...s.inherited]
  const fill = keyword(inheritedValue(chain, 'fill', classRules))
  if (fill === undefined || !NO_PAINT.has(fill)) return false
  const stroke = keyword(inheritedValue(chain, 'stroke', classRules))
  return stroke === undefined || NO_PAINT.has(stroke)
}

/**
 * Not drawn: under display:none (how Inkscape and Illustrator save hidden layers), or
 * visibility hidden from the nearest element that sets it. The root's own style is ignored.
 */
function isHidden(s: Shape, classRules: Map<string, string>): boolean {
  const chain = [s.el, ...s.inherited.slice(0, -1)]
  if (chain.some((el) => keyword(styleOf(el, 'display', classRules)) === 'none')) return true
  const visibility = keyword(inheritedValue(chain, 'visibility', classRules))
  return visibility === 'hidden' || visibility === 'collapse'
}

/** A <rect> as path data. SVGO's convertShapeToPath leaves rounded rectangles alone. */
function rectToPath(el: Element, viewport: Viewport): string | null {
  // A rectangle placed or sized in % (usually a full-page background) is skipped.
  const [x, y, w, h] = ['x', 'y', 'width', 'height'].map((n) => length(el, n))
  if (x === null || y === null || w === null || h === null) return null
  if (w === undefined || h === undefined || !(w > 0) || !(h > 0)) return null
  const left = x ?? 0
  const top = y ?? 0
  // Radii: % of the viewport; a missing or "auto" radius takes the other one.
  const radius = (name: string, ref: number): number | undefined => {
    const v = length(el, name, ref)
    return typeof v === 'number' && v >= 0 ? v : undefined
  }
  let rx = radius('rx', viewport.width)
  let ry = radius('ry', viewport.height)
  if (rx === undefined) rx = ry ?? 0
  if (ry === undefined) ry = rx
  rx = Math.min(rx, w / 2)
  ry = Math.min(ry, h / 2)
  if (rx === 0 || ry === 0) return `M${left} ${top}H${left + w}V${top + h}H${left}Z`
  const arc = (ex: number, ey: number): string => `A${rx} ${ry} 0 0 1 ${ex} ${ey}`
  return (
    `M${left + rx} ${top}H${left + w - rx}${arc(left + w, top + ry)}V${top + h - ry}${arc(left + w - rx, top + h)}` +
    `H${left + rx}${arc(left, top + h - ry)}V${top + ry}${arc(left + rx, top)}Z`
  )
}

/**
 * Path data that can be appended to other path data. A leading relative "m" is absolute only
 * at the very start of a path: after another path it would move from where that one ended.
 * SVGO writes one whenever a path goes on with a relative line.
 */
function withAbsoluteStart(d: string): string {
  if (!/^\s*m/.test(d)) return d
  try {
    return svgpath(d)
      .iterate((seg, index) => (index === 0 ? [['M', seg[1], seg[2]]] : undefined))
      .toString()
  } catch {
    return d
  }
}

function parseClassRules(doc: Document): Map<string, string> {
  const rules = new Map<string, string>()
  for (const style of Array.from(doc.getElementsByTagName('style'))) {
    const css = style.textContent ?? ''
    const re = /([^{}]+)\{([^}]*)\}/g
    let m: RegExpExecArray | null
    while ((m = re.exec(css))) {
      for (const sel of m[1].split(',')) {
        // Plain class selectors only (".st0", "path.st0"); SVGO inlines the others.
        const cm = /^[\w-]*\.([\w-]+)$/.exec(sel.trim())
        if (cm) rules.set(cm[1], (rules.get(cm[1]) ?? '') + ';' + m[2])
      }
    }
  }
  return rules
}

/**
 * Parse an SVG document into importable path data.
 * Paths are merged; a path painted with the mark color defines the glyph box.
 */
export function parseSvg(input: string, markColor = '#ff00ff'): SvgImport {
  const none: SvgImport = { exists: false, path: '', width: 0, height: 0, bbox: makeBBox(0, 0, 0, 0), markedBBox: false }
  if (!input || !input.includes('<svg')) return none

  const parser = new DOMParser()
  // Read class rules before SVGO inlines/removes <style>.
  const rawDoc = parser.parseFromString(input, 'image/svg+xml')
  const classRules = parseClassRules(rawDoc)

  let data = input
  try {
    data = optimize(input, SVGO_CONFIG).data
  } catch {
    // Fall back to the raw document (transform attributes are still applied below).
  }
  const doc = parser.parseFromString(data, 'image/svg+xml')
  const svg = doc.getElementsByTagName('svg')[0]
  if (!svg || doc.getElementsByTagName('parsererror').length) return { ...none, error: msg('imports.svg.errors.malformed') }

  const colors = markColors(markColor)
  const result: SvgImport = { ...none }

  const texts = Array.from(doc.getElementsByTagName('text'))
    .filter((t) => !t.closest(NOT_RENDERED_SELECTOR))
    .map((t) => (t.textContent ?? '').trim())
    .filter((t) => t.length > 0)
  if (texts.length) result.layers = [...new Set(texts)]

  // The viewBox (honouring its origin), else the width / height attributes in user units.
  const vb = viewBoxOf(svg)
  const vbX = vb?.x ?? 0
  const vbY = vb?.y ?? 0
  const sizeAttr = (name: string): number => {
    const v = length(svg, name)
    return typeof v === 'number' ? v : NaN
  }
  const width = vb ? vb.w : sizeAttr('width')
  const height = vb ? vb.h : sizeAttr('height')
  // Percentages resolve against the document's viewport (100 when it has none).
  const viewport = { width: width > 0 ? width : 100, height: height > 0 ? height : 100 }

  let shapes: Shape[]
  try {
    shapes = collectShapes(svg, viewport, classRules)
  } catch (e) {
    if (e instanceof SvgTooComplex) return { ...result, error: e.reason }
    throw e
  }

  let merged = ''
  let mark: ReturnType<typeof pathBBox> | null = null
  // Paths, plus the rectangles SVGO kept (rounded ones), in document order.
  // Hidden shapes are left out, but a hidden mark box still sets the glyph box.
  for (const shape of shapes) {
    if (isUnpainted(shape, classRules)) continue
    const hidden = isHidden(shape, classRules)
    if (hidden && mark) continue
    const { el, transform } = shape
    let d = el.tagName === 'rect' ? rectToPath(el, shape.viewport) : el.getAttribute('d')
    if (!d) continue
    d = withAbsoluteStart(d)
    if (transform) {
      try {
        d = svgpath(d).transform(transform).toString()
      } catch {
        /* keep untransformed */
      }
    }
    const bb = pathBBox(d)
    if (bb.width === 0 && bb.height === 0) continue
    if (!mark && isMarkShape(shape, colors, classRules)) {
      mark = bb
      continue
    }
    if (!hidden) merged += (merged ? ' ' : '') + d
  }

  if (!merged) return result

  if (mark) {
    merged = svgpath(merged).translate(-mark.x, -mark.y).toString()
    result.width = mark.width
    result.height = mark.height
    result.markedBBox = true
  } else {
    if (vbX !== 0 || vbY !== 0) merged = svgpath(merged).translate(-vbX, -vbY).toString()
    const bb = pathBBox(merged)
    result.width = isFinite(width) && width > 0 ? width : bb.width
    result.height = isFinite(height) && height > 0 ? height : bb.height
  }

  result.path = merged
  result.bbox = pathBBox(merged)
  result.exists = true
  return result
}

export function svgImportToPathData(r: SvgImport): PathData {
  if (!r.exists || isEmptyPathContent(r.path)) return emptyPathData()
  return { exists: true, markedBBox: r.markedBBox, path: r.path, width: r.width, height: r.height, bbox: r.bbox }
}

// ---- SVG export with mkf-* attributes (v1 SVGFromGlyphVariant) ----

const VARIANT_ATTRS: (keyof Variant)[] = ['width', 'height', 'doExport', 'flattenLayers', 'flattenMode']
const VARIANT_ATTR_NAMES: Record<string, string> = {
  width: 'width',
  height: 'height',
  doExport: 'do-export',
  flattenLayers: 'flatten-layers',
  flattenMode: 'flatten-mode'
}

function attrValue(v: unknown): string | null {
  if (v === null) return 'null'
  if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return String(v)
  return null
}

/**
 * Serialize a variant's source path as a standalone SVG. Transform settings are
 * stored as `mkf-*` attributes so pasting back restores them; the magenta box
 * marks the import bounds.
 */
export function variantToSvg(variant: Variant, em: number, includeMark = true, markColor = '#ff00ff'): string {
  const pd = variant.pathData
  let attrs = `mkf-em="${em}" `
  for (const k of TRANSFORM_KEYS) {
    const v = attrValue((variant.transforms as unknown as Record<string, unknown>)[k])
    if (v !== null) attrs += `mkf-${k}="${v}" `
  }
  for (const k of VARIANT_ATTRS) {
    const v = attrValue(variant[k])
    if (v !== null) attrs += `mkf-${VARIANT_ATTR_NAMES[k]}="${v}" `
  }
  const w = pd.width || pd.bbox.width
  const h = pd.height || pd.bbox.height
  const path = isEmptyPathContent(pd.path) ? '' : pd.path
  const mark = includeMark
    ? `<path style="stroke:${markColor};fill:none" d="M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} z"></path>`
    : ''
  return `<!-- Generator: MkFont --><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ${attrs.trim()}><path d="${path}"></path>${mark}</svg>`
}

/** Plain SVG of the final (composited) glyph, for external use. */
export function outlineToSvg(path: string, advance: number, top: number, bottom: number): string {
  const d = isEmptyPathContent(path) ? '' : svgpath(path).translate(0, -top).round(3).toString()
  const h = bottom - top
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(advance)} ${Math.round(h)}"><path d="${d}"/></svg>`
}

export interface MkfValues {
  transforms: Partial<TransformSettings>
  variant: Partial<Variant>
  hasTransforms: boolean
  hasVariantValues: boolean
}

const RESAMPLED_TR = new Set<string>(RESAMPLED_TRANSFORM_KEYS)
const RESAMPLED_VARIANT = new Set<string>(RESAMPLED_VARIANT_KEYS)

/** Read `mkf-*` attributes from an SVG (v1 TryGetMKFValues), rescaled to `targetEm`. */
export function readMkfValues(input: string, targetEm: number): MkfValues {
  const out: MkfValues = { transforms: {}, variant: {}, hasTransforms: false, hasVariantValues: false }
  if (!input.includes('mkf-')) return out
  const svg = new DOMParser().parseFromString(input, 'image/svg+xml').getElementsByTagName('svg')[0]
  if (!svg) return out
  const em = Number(svg.getAttribute('mkf-em'))
  const factor = isFinite(em) && em > 0 ? targetEm / em : 1
  const parse = (raw: string, resample: boolean): number | boolean | null | string => {
    if (raw === 'null') return null
    if (raw === 'true') return true
    if (raw === 'false') return false
    const n = Number(raw)
    if (!isNaN(n)) return resample ? n * factor : n
    return raw
  }
  for (const k of TRANSFORM_KEYS) {
    const raw = svg.getAttribute(`mkf-${k}`)
    if (raw === null) continue
    ;(out.transforms as Record<string, unknown>)[k] = parse(raw, RESAMPLED_TR.has(k))
    out.hasTransforms = true
  }
  for (const k of VARIANT_ATTRS) {
    const raw = svg.getAttribute(`mkf-${VARIANT_ATTR_NAMES[k]}`)
    if (raw === null) continue
    ;(out.variant as Record<string, unknown>)[k] = parse(raw, RESAMPLED_VARIANT.has(k))
    out.hasVariantValues = true
  }
  return out
}


