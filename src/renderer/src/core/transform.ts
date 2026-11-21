// ============================================================
// MkFont v2 — Transform engine
//
// Faithful port of v1 `SVGOPS.FitPath` / `SVGOPS.FitLayerPath`
// (app/js/operations/svg-operations.js). Behaviour, including the
// odd-looking bits, is intentional: existing .mkfont files must render
// exactly like they did in v1.
//
// Coordinates are Y-down font units: y = 0 is the top of the EM box,
// y = baseline is the baseline.
// ============================================================

import svgpath from 'svgpath'
import SVGPathReverse from 'svg-path-reverse'
import type { BBox, FamilyValues, FitRegion, Layer, PathData, ResolvedTransforms } from '../types/font'
import { BoundsMode, HAlign, MirrorMode, ScaleMode, SkewRotOrder, VAlign } from '../types/font'
import { pathBBox } from './geometry'
import type { Affine } from './affine'
import { EMPTY_PATH_CONTENT, isEmptyPathContent } from './model'

// --- Types ---

/** v1 "computed path" object. */
export interface FitResult {
  path: string
  width: number
  height: number
  bbox: BBox
  fit: FitRegion
}

/** v1 family `_contextInfos`. */
export interface FontContext {
  em: number
  asc: number
  dsc: number
  bsl: number
  xh: number
  ch: number
  /** family width */
  w: number
  /** family height */
  h: number
  mono: boolean
  xshift: number
  xpush: number
}

/** Input of fitPath: an imported path with its reference box. */
export interface SvgStats {
  path: string
  width: number
  height: number
  bbox: BBox
  emptyPath?: boolean
}

type PathTransform = ReturnType<typeof svgpath>

export function buildFontContext(values: FamilyValues, transforms: ResolvedTransforms): FontContext {
  return {
    em: values.em,
    asc: values.ascent,
    dsc: values.descent,
    bsl: values.baseline,
    xh: values['x-height'],
    ch: values['cap-height'],
    w: values.width,
    h: values.height,
    mono: values.monospace,
    xshift: transforms.xshift ?? 0,
    xpush: transforms.xpush ?? 0
  }
}

export function statsFromPathData(pd: PathData | null | undefined): SvgStats {
  if (!pd || pd.emptyPath || isEmptyPathContent(pd.path)) {
    return { path: EMPTY_PATH_CONTENT, width: 0, height: 0, bbox: pathBBox(''), emptyPath: true }
  }
  return { path: pd.path, width: pd.width, height: pd.height, bbox: pd.bbox }
}

// --- Rotation & skew helpers (v1 _Rot/_SkewX/_SkewY) ---

function rot(tr: PathTransform, angle: number, anchor: number, w: number, h: number): void {
  if (angle === 0) return
  let ox = 0
  let oy = 0
  switch (anchor) {
    case 1: case 4: case 7: ox = w * 0.5; break // top, center, bottom
    case 2: case 5: case 8: ox = w; break // right column
  }
  switch (anchor) {
    case 6: case 7: case 8: oy = h; break // bottom row
    case 3: case 4: case 5: oy = h * 0.5; break // middle row
  }
  tr.rotate(angle, ox, oy)
}

function skewX(tr: PathTransform, amount: number): void {
  if (amount !== 0) tr.skewX(amount)
}

function skewY(tr: PathTransform, amount: number): void {
  if (amount !== 0) tr.skewY(amount)
}

function applyRotSkew(
  tr: PathTransform,
  order: number,
  angle: number,
  anchor: number,
  skx: number,
  sky: number,
  w: number,
  h: number
): void {
  switch (order) {
    case SkewRotOrder.RXY: rot(tr, angle, anchor, w, h); skewX(tr, skx); skewY(tr, sky); break
    case SkewRotOrder.RYX: rot(tr, angle, anchor, w, h); skewY(tr, sky); skewX(tr, skx); break
    case SkewRotOrder.XRY: skewX(tr, skx); rot(tr, angle, anchor, w, h); skewY(tr, sky); break
    case SkewRotOrder.YRX: skewY(tr, sky); rot(tr, angle, anchor, w, h); skewX(tr, skx); break
    case SkewRotOrder.XYR: skewX(tr, skx); skewY(tr, sky); rot(tr, angle, anchor, w, h); break
    case SkewRotOrder.YXR: skewY(tr, sky); skewX(tr, skx); rot(tr, angle, anchor, w, h); break
  }
}

function safeScale(s: number): number {
  return isFinite(s) && !isNaN(s) ? s : 1
}

// --- FitPath ---

/** A unit triangle that goes through the same operations as the path, to read their matrix back. */
const PROBE = 'M0 0L1 0L0 1'

function probeMatrix(probe: PathTransform): Affine {
  const pts: number[] = []
  probe.iterate((seg: (string | number)[]) => {
    pts.push(seg[1] as number, seg[2] as number)
  })
  const [e, f, ax, ay, cx, cy] = pts
  return [ax - e, ay - f, cx - e, cy - f, e, f]
}

/**
 * Fit an imported path into the font coordinate space.
 * @param t resolved transform settings (variant + family inheritance)
 * @param ctxWidth variant width or family width (v1 ResolveVariant(WIDTH))
 * @param ctxHeight variant height or family height (v1 ResolveVariant(HEIGHT))
 */
export function fitPath(
  t: ResolvedTransforms,
  ctx: FontContext,
  stats: SvgStats,
  ctxWidth: number,
  ctxHeight: number
): FitResult {
  return fitPathWithMatrix(t, ctx, stats, ctxWidth, ctxHeight).fit
}

/**
 * `fitPath`, plus the affine matrix that takes the imported path to its fitted place
 * (null for an empty path). The matrix holds for this path only: in the bounds modes that
 * follow the outline's bounding box, a different outline gets a different one.
 */
export function fitPathWithMatrix(
  t: ResolvedTransforms,
  ctx: FontContext,
  stats: SvgStats,
  ctxWidth: number,
  ctxHeight: number
): { fit: FitResult; matrix: Affine | null } {
  const refMode = t.bounds
  const sShift = t.xshift ?? ctx.xshift
  const sPush = t.xpush ?? ctx.xpush
  const yUserOffset = t.yoffset ?? 0
  let autoWidth = t['auto-w']
  const ctxH = ctxHeight
  const ctxW = ctxWidth
  const mono = ctx.mono
  const mirror = t.mirror
  const angle = t.rot ?? 0
  const skx = t['skew-x'] ?? 0
  const sky = t['skew-y'] ?? 0
  let doReverse = false

  if (stats.emptyPath) {
    let width = autoWidth ? Math.max(sShift + sPush, 0) : ctxW
    if (mono) width = ctx.w
    return {
      fit: {
        height: ctxH,
        width,
        path: stats.path,
        bbox: stats.bbox,
        fit: { x: 0, y: 0, width: ctxW, height: ctxH, yoff: 0 }
      },
      matrix: null
    }
  }

  const tr = svgpath(stats.path)
  // Every operation on the path is repeated on the probe; the path's own chain is untouched.
  const probe = svgpath(PROBE)
  let bbox = stats.bbox
  let scale = 1
  let heightRef = stats.height
  let widthRef = stats.width
  let offsetY = 0
  let offsetX = 0
  let fitH = heightRef
  let fitW = widthRef
  const anchor = t.anchor

  if (angle !== 0 || skx !== 0 || sky !== 0) {
    applyRotSkew(tr, t['skew-rot-order'] ?? 0, angle, t['rot-anchor'] ?? 4, skx, sky, widthRef, heightRef)
    applyRotSkew(probe, t['skew-rot-order'] ?? 0, angle, t['rot-anchor'] ?? 4, skx, sky, widthRef, heightRef)
    if (refMode === BoundsMode.Inside || refMode === BoundsMode.MixedVertical) {
      bbox = pathBBox(tr.toString())
    }
  }

  switch (refMode) {
    case BoundsMode.Inside:
      fitH = heightRef = bbox.height
      fitW = widthRef = bbox.width
      tr.translate(-bbox.x, -bbox.y)
      probe.translate(-bbox.x, -bbox.y)
      break
    case BoundsMode.MixedVertical:
      fitW = widthRef = bbox.width
      tr.translate(-bbox.x, 0)
      probe.translate(-bbox.x, 0)
      break
    case BoundsMode.MixedHorizontal:
      fitH = heightRef = bbox.height
      tr.translate(0, -bbox.y)
      probe.translate(0, -bbox.y)
      break
  }

  switch (mirror) {
    case MirrorMode.Horizontal:
      tr.scale(-1, 1).translate(fitW, 0)
      probe.scale(-1, 1).translate(fitW, 0)
      doReverse = true
      break
    case MirrorMode.Vertical:
      tr.scale(1, -1).translate(0, fitH)
      probe.scale(1, -1).translate(0, fitH)
      doReverse = true
      break
    case MirrorMode.Both:
      tr.scale(-1, -1).translate(fitW, fitH)
      probe.scale(-1, -1).translate(fitW, fitH)
      break
  }

  switch (t.scale) {
    case ScaleMode.EM: scale = ctx.em / heightRef; break
    case ScaleMode.Ascender: scale = ctx.asc / heightRef; break
    case ScaleMode.Spread: scale = (ctx.asc - ctx.dsc) / heightRef; break
    case ScaleMode.XHeight: scale = ctx.xh / heightRef; break
    case ScaleMode.CapHeight: scale = ctx.ch / heightRef; break
    case ScaleMode.Height: scale = ctxH / heightRef; break
    case ScaleMode.Manual: scale = t['scale-factor']; break
    case ScaleMode.Normalize: {
      const nrm = t['nrm-factor']
      let hra = fitH / ctxH
      let wra = fitW / ctxW
      if (hra > wra) {
        hra = fitH / (ctxH + ctxH * nrm)
        scale = 1 / hra
      } else {
        wra = fitW / (ctxW + ctxW * nrm)
        scale = 1 / wra
      }
      autoWidth = false
      break
    }
    default:
      break
  }
  scale = safeScale(scale)

  heightRef *= scale
  widthRef *= scale
  fitH *= scale
  fitW *= scale

  switch (t.valign) {
    case VAlign.Descender: offsetY = ctx.asc - ctx.dsc - heightRef; break
    case VAlign.Spread: offsetY = ctx.em * 0.5 - heightRef; break
    case VAlign.Ascender: offsetY = ctx.bsl - heightRef - ctx.asc; break
    case VAlign.EM: offsetY = ctx.em - heightRef; break
    case VAlign.Baseline:
    default:
      offsetY = ctx.bsl - heightRef
      break
  }

  switch (anchor) {
    case 6: case 7: case 8: break // bottom row
    case 3: case 4: case 5: offsetY += heightRef * 0.5; break // middle row
    default: offsetY += heightRef; break // top row
  }

  if (autoWidth) widthRef += sShift + sPush
  else widthRef = ctxW
  if (mono) widthRef = ctx.w

  switch (anchor) {
    case 0: case 3: case 6: break // left column
    case 1: case 4: case 7: offsetX -= fitW * 0.5; break // center column
    default: offsetX -= fitW; break // right column
  }

  switch (t.halign) {
    case HAlign.XMin: offsetX += sShift; break
    case HAlign.Spread: offsetX += widthRef * 0.5; break
    case HAlign.XMax:
    default:
      offsetX += widthRef - sPush
      break
  }

  offsetY += yUserOffset

  let path = tr.scale(scale).translate(offsetX, offsetY).toString()
  if (doReverse) path = SVGPathReverse.reverse(path)
  probe.scale(scale).translate(offsetX, offsetY)

  return {
    fit: {
      height: Math.max(heightRef, 0),
      width: Math.max(widthRef, 0),
      fit: { width: fitW, height: fitH, x: offsetX, y: offsetY, yoff: yUserOffset },
      path,
      bbox: pathBBox(path)
    },
    matrix: probeMatrix(probe)
  }
}

// --- FitLayerPath ---

/**
 * Place a component (layer) relative to its context.
 * @param context the host fit (own path, control layer path, or previous layer)
 * @param refBase the referenced glyph's own computed fit (v1 `_computedPath`)
 * @param layerPath the referenced glyph's final path (v1 `PATH`), possibly reversed
 */
export function fitLayerPath(layer: Layer, context: FitResult, refBase: FitResult, layerPath: string): FitResult {
  return fitLayerPathWithMatrix(layer, context, refBase, layerPath).fit
}

/**
 * `fitLayerPath`, plus the affine matrix that takes the referenced glyph's path to its
 * place in the host. As with `fitPathWithMatrix`, the matrix holds for this path only.
 */
export function fitLayerPathWithMatrix(
  layer: Layer,
  context: FitResult,
  refBase: FitResult,
  layerPath: string
): { fit: FitResult; matrix: Affine } {
  const fit = context.fit
  let ctxW = context.width
  let ctxH = context.height
  let lyrWidth = refBase.width
  let lyrHeight = refBase.height
  let offsetX = fit.x
  let offsetY = fit.y
  let scale = 1
  let doReverse = false
  const tr = svgpath(layerPath)
  // Every operation on the path is repeated on the probe, to read the matrix back.
  const probe = svgpath(PROBE)

  if (layer.rotation !== 0 || layer.skewX !== 0 || layer.skewY !== 0) {
    applyRotSkew(tr, layer.skewRotOrder, layer.rotation, layer.rotationAnchor, layer.skewX, layer.skewY, lyrWidth, lyrHeight)
    applyRotSkew(probe, layer.skewRotOrder, layer.rotation, layer.rotationAnchor, layer.skewX, layer.skewY, lyrWidth, lyrHeight)
  }

  switch (layer.contextBounds) {
    case BoundsMode.Inside:
      offsetX += context.bbox.x - fit.x
      offsetY += context.bbox.y - fit.y
      ctxW = context.bbox.width
      ctxH = context.bbox.height
      break
    case BoundsMode.MixedVertical:
      offsetX += context.bbox.x - fit.x
      ctxW = context.bbox.width
      break
    case BoundsMode.MixedHorizontal:
      offsetY += context.bbox.y - fit.y
      ctxH = context.bbox.height
      break
  }

  if (layer.layerBounds !== BoundsMode.Outside) {
    const vbbox = pathBBox(tr.toString())
    switch (layer.layerBounds) {
      case BoundsMode.Inside:
        tr.translate(-vbbox.x, -vbbox.y)
        probe.translate(-vbbox.x, -vbbox.y)
        lyrWidth = vbbox.width
        lyrHeight = vbbox.height
        break
      case BoundsMode.MixedVertical:
        tr.translate(-vbbox.x, 0)
        probe.translate(-vbbox.x, 0)
        lyrWidth = vbbox.width
        break
      case BoundsMode.MixedHorizontal:
        tr.translate(0, -vbbox.y)
        probe.translate(0, -vbbox.y)
        lyrHeight = vbbox.height
        break
    }
  }

  switch (layer.mirror) {
    case MirrorMode.Horizontal:
      tr.scale(-1, 1).translate(lyrWidth, 0)
      probe.scale(-1, 1).translate(lyrWidth, 0)
      doReverse = true
      break
    case MirrorMode.Vertical:
      tr.scale(1, -1).translate(0, lyrHeight)
      probe.scale(1, -1).translate(0, lyrHeight)
      doReverse = true
      break
    case MirrorMode.Both:
      tr.scale(-1, -1).translate(lyrWidth, lyrHeight)
      probe.scale(-1, -1).translate(lyrWidth, lyrHeight)
      break
  }

  if (layer.layerScale === ScaleMode.Manual) {
    scale = safeScale(layer.layerScaleFactor)
    lyrWidth *= scale
    lyrHeight *= scale
  }

  const ctxAnchor = layer.contextAnchor
  const selfAnchor = layer.layerAnchor

  switch (ctxAnchor) {
    case 1: case 4: case 7: offsetX += ctxW * 0.5; break
    case 2: case 5: case 8: offsetX += ctxW; break
  }
  switch (selfAnchor) {
    case 1: case 4: case 7: offsetX -= lyrWidth * 0.5; break
    case 2: case 5: case 8: offsetX -= lyrWidth; break
  }
  switch (ctxAnchor) {
    case 3: case 4: case 5: offsetY += ctxH * 0.5; break
    case 6: case 7: case 8: offsetY += ctxH; break
  }
  switch (selfAnchor) {
    case 3: case 4: case 5: offsetY -= lyrHeight * 0.5; break
    case 6: case 7: case 8: offsetY -= lyrHeight; break
  }

  const yUserOffset = layer.yOffset
  offsetY += yUserOffset
  offsetX += layer.xOffset

  let path = tr.scale(scale).translate(offsetX, offsetY).toString()
  if (doReverse) path = SVGPathReverse.reverse(path)
  probe.scale(scale).translate(offsetX, offsetY)

  return {
    fit: {
      height: Math.max(lyrHeight, 0),
      width: Math.max(lyrWidth, 0),
      fit: { width: lyrWidth, height: lyrHeight, x: offsetX, y: offsetY, yoff: yUserOffset },
      path,
      bbox: pathBBox(path)
    },
    matrix: probeMatrix(probe)
  }
}

/** Reverse winding (v1 svg-path-reverse) — used for inverted layers. */
export function reversePath(path: string): string {
  try {
    return SVGPathReverse.reverse(path)
  } catch {
    return path
  }
}
