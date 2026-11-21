// ============================================================
// Glyph renderer (Canvas2D). Paths are in font units, Y-down:
// y = 0 is the EM top, y = baseline is the baseline.
// ============================================================

import { memo, useEffect, useRef } from 'react'
import type { BBox, FamilyValues, FitRegion } from '../../types/font'
import { isEmptyPathContent } from '../../core/model'
import { tokenColor, useThemeVersion } from '../../lib/theme'
import { t } from '../../i18n'

export type CanvasMode = 'slot' | 'preview' | 'mini'

export interface GlyphCanvasProps {
  path: string | null | undefined
  advance: number
  family: FamilyValues
  width: number
  height: number
  mode: CanvasMode
  /** Glyph exists but has no outline (v1 amber placeholder). */
  empty?: boolean
  fit?: FitRegion | null
  /** Optional path drawn on top in the accent color (selected component). */
  highlightPath?: string | null
  /** Optional box drawn in the accent color (component context). */
  highlightBox?: BBox | null
  /** Zoom factor for preview mode (1 = fit). */
  zoom?: number
  color?: string
  className?: string
}

export interface Framing {
  scale: number
  ox: number
  oy: number
}

/** Vertical frame of the font: from the EM/ascender top to the EM/descender bottom. */
export function verticalFrame(f: FamilyValues): { top: number; bottom: number } {
  const top = Math.min(0, f.baseline - f.ascent)
  const bottom = Math.max(f.em, f.baseline - f.descent)
  return { top, bottom }
}

export function computeFraming(
  f: FamilyValues,
  advance: number,
  w: number,
  h: number,
  mode: CanvasMode,
  zoom = 1
): Framing {
  const { top, bottom } = verticalFrame(f)
  const vh = Math.max(bottom - top, 1)
  const padY = mode === 'preview' ? 0.16 : mode === 'slot' ? 0.1 : 0.06
  const padX = mode === 'preview' ? 0.2 : 0.1
  const gw = Math.max(advance, 1)
  const ref = Math.max(gw, mode === 'preview' ? Math.max(f.width, f.em) * 0.5 : 0)
  let scale = Math.min((h * (1 - padY * 2)) / vh, (w * (1 - padX * 2)) / ref)
  scale *= zoom
  const ox = (w - gw * scale) / 2
  const oy = (h - vh * scale) / 2 - top * scale
  return { scale, ox, oy }
}

function hasPath(p: string | null | undefined): p is string {
  return !!p && !isEmptyPathContent(p)
}

export const GlyphCanvas = memo(function GlyphCanvas(props: GlyphCanvasProps): React.ReactElement {
  const { width, height, className } = props
  const ref = useRef<HTMLCanvasElement>(null)
  const themeVersion = useThemeVersion()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    draw(canvas, props)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.path,
    props.advance,
    props.family,
    width,
    height,
    props.mode,
    props.empty,
    props.fit,
    props.highlightPath,
    props.highlightBox,
    props.zoom,
    props.color,
    themeVersion
  ])

  return <canvas ref={ref} className={className} style={{ width, height }} />
})

/**
 * The font's guides around a glyph of advance `gw`: advance box, EM, x-height, cap height,
 * ascender, descender, baseline, origin and advance. `ctx` draws in font units; `px` is one
 * device pixel in font units; the lines span `view` (the visible part, in font units).
 */
export function drawGuides(
  ctx: CanvasRenderingContext2D,
  f: FamilyValues,
  gw: number,
  view: { left: number; right: number; top: number; bottom: number },
  px: number
): void {
  const bsl = f.baseline
  const ascY = bsl - f.ascent
  const descY = bsl - f.descent
  const line = (x0: number, y0: number, x1: number, y1: number, color: string, dash?: number[]): void => {
    ctx.strokeStyle = color
    ctx.lineWidth = px
    ctx.setLineDash(dash ? dash.map((d) => d * px) : [])
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
  }
  const hline = (y: number, color: string, dash?: number[]): void => line(view.left, y, view.right, y, color, dash)
  const vline = (x: number, color: string, dash?: number[]): void => line(x, view.top, x, view.bottom, color, dash)
  // Advance box shading
  ctx.fillStyle = tokenColor('fg', 0.025)
  ctx.fillRect(0, ascY, gw, descY - ascY)
  hline(0, tokenColor('fg', 0.06))
  hline(f.em, tokenColor('fg', 0.06))
  hline(bsl - f['x-height'], tokenColor('fg', 0.1), [3, 3])
  hline(bsl - f['cap-height'], tokenColor('fg', 0.1), [3, 3])
  hline(ascY, tokenColor('fg', 0.22))
  hline(descY, tokenColor('fg', 0.22))
  hline(bsl, f.baseline > f.em ? tokenColor('warn', 0.9) : tokenColor('ok', 0.85), [4, 3])
  vline(0, tokenColor('fg', 0.22))
  vline(gw, tokenColor('fg', 0.22))
  if (Math.abs(f.width - gw) > 0.5) vline(f.width, tokenColor('fg', 0.08), [2, 4])
  ctx.setLineDash([])
}

/**
 * Names of the guides along the left edge, and the advance under the glyph. `ctx` draws in
 * CSS pixels of a canvas `width` × `height` showing the font through `framing`.
 */
export function drawMetricLabels(ctx: CanvasRenderingContext2D, f: FamilyValues, gw: number, framing: Framing, width: number, height: number): void {
  const { scale, ox, oy } = framing
  const bsl = f.baseline
  const ascY = bsl - f.ascent
  const descY = bsl - f.descent
  ctx.setLineDash([])
  ctx.font = '10px Inter, "Segoe UI", sans-serif'
  ctx.textBaseline = 'bottom'
  ctx.textAlign = 'left'
  const label = (text: string, y: number, color: string): void => {
    const sy = oy + y * scale
    if (sy < 10 || sy > height - 2) return
    ctx.fillStyle = color
    ctx.fillText(text, 4, sy - 2)
  }
  // Secondary text color: readable (4.5:1) in both themes, still quieter than the outline.
  const muted = tokenColor('subtle')
  label(t('viewport.canvas.ascender'), ascY, muted)
  label(t('viewport.canvas.capHeight'), bsl - f['cap-height'], muted)
  label(t('viewport.canvas.xHeight'), bsl - f['x-height'], muted)
  label(t('viewport.canvas.baseline'), bsl, f.baseline > f.em ? tokenColor('warn') : tokenColor('ok'))
  label(t('viewport.canvas.descender'), descY, muted)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle = muted
  const adv = Math.round(gw * 100) / 100
  const x = ox + (gw * scale) / 2
  if (x > 0 && x < width) ctx.fillText(`${adv}`, x, Math.min(height - 14, oy + descY * scale + 4))
}

function draw(canvas: HTMLCanvasElement, p: GlyphCanvasProps): void {
  const dpr = window.devicePixelRatio || 1
  const W = Math.max(1, Math.round(p.width * dpr))
  const H = Math.max(1, Math.round(p.height * dpr))
  if (canvas.width !== W) canvas.width = W
  if (canvas.height !== H) canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, W, H)

  const f = p.family
  const gw = p.advance > 0 ? p.advance : f.width
  const { scale, ox, oy } = computeFraming(f, gw, p.width, p.height, p.mode, p.zoom)
  const px = 1 / (scale * dpr) // one device pixel in font units

  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr)

  const left = -ox / scale
  const right = (p.width - ox) / scale
  const topY = -oy / scale
  const bottomY = (p.height - oy) / scale

  const bsl = f.baseline
  const ascY = bsl - f.ascent
  const descY = bsl - f.descent
  const glyphColor = p.color ?? tokenColor('glyph')

  const hline = (y: number, color: string, dash?: number[], x0 = left, x1 = right): void => {
    ctx.strokeStyle = color
    ctx.lineWidth = px
    ctx.setLineDash(dash ? dash.map((d) => d * px) : [])
    ctx.beginPath()
    ctx.moveTo(x0, y)
    ctx.lineTo(x1, y)
    ctx.stroke()
  }

  // ---- Guides ----
  if (p.mode === 'slot') {
    hline(bsl, tokenColor('fg', 0.07))
  } else if (p.mode === 'preview') {
    drawGuides(ctx, f, gw, { left, right, top: topY, bottom: bottomY }, px)
  }

  // ---- Empty placeholder ----
  if (p.empty && !hasPath(p.path)) {
    const y0 = p.mode === 'slot' ? ascY : 0
    const y1 = p.mode === 'slot' ? descY : f.em
    ctx.setLineDash([])
    ctx.lineWidth = px * (p.mode === 'mini' ? 1 : 1.25)
    ctx.strokeStyle = tokenColor('warn', 0.75)
    ctx.strokeRect(0, y0, gw, y1 - y0)
    ctx.strokeStyle = tokenColor('warn', 0.22)
    ctx.beginPath()
    ctx.moveTo(0, y0)
    ctx.lineTo(gw, y1)
    ctx.moveTo(gw, y0)
    ctx.lineTo(0, y1)
    ctx.stroke()
  }

  // ---- Glyph ----
  let path2d: Path2D | null = null
  if (hasPath(p.path)) {
    try {
      path2d = new Path2D(p.path)
      ctx.fillStyle = glyphColor
      ctx.fill(path2d)
    } catch {
      path2d = null
    }
  }

  if (p.mode !== 'preview') return

  // ---- Out-of-advance overlay (v1: warning tint outside the glyph box) ----
  if (path2d) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(left, topY, right - left, bottomY - topY)
    ctx.rect(0, ascY, gw, descY - ascY)
    ctx.clip('evenodd')
    ctx.fillStyle = tokenColor('warn', 0.55)
    ctx.fill(path2d)
    ctx.restore()
  }

  // ---- Highlighted component ----
  if (p.highlightBox) {
    const b = p.highlightBox
    ctx.setLineDash([4 * px, 3 * px])
    ctx.strokeStyle = tokenColor('accent', 0.6)
    ctx.lineWidth = px
    ctx.strokeRect(b.x, b.y, b.width, b.height)
  }
  if (hasPath(p.highlightPath)) {
    try {
      const hp = new Path2D(p.highlightPath)
      ctx.fillStyle = tokenColor('accent', 0.45)
      ctx.fill(hp)
      ctx.setLineDash([])
      ctx.strokeStyle = tokenColor('accent', 0.95)
      ctx.lineWidth = px * 1.25
      ctx.stroke(hp)
    } catch {
      /* invalid path */
    }
  }

  // ---- Fit box (v1 drawBBox) ----
  const fit = p.fit
  if (fit && (fit.width > 0 || fit.height > 0)) {
    const info = tokenColor('emphasis', 0.9)
    const faint = tokenColor('emphasis', 0.25)
    ctx.setLineDash([])
    ctx.lineWidth = px
    ctx.strokeStyle = faint
    ctx.strokeRect(fit.x, fit.y, fit.width, fit.height)
    ctx.beginPath()
    ctx.moveTo(fit.x, fit.y)
    ctx.lineTo(fit.x + fit.width, fit.y + fit.height)
    ctx.moveTo(fit.x + fit.width, fit.y)
    ctx.lineTo(fit.x, fit.y + fit.height)
    ctx.stroke()
    // side bearings
    const cy = fit.y + fit.height * 0.5
    ctx.strokeStyle = info
    ctx.beginPath()
    ctx.moveTo(0, cy)
    ctx.lineTo(fit.x, cy)
    ctx.moveTo(fit.x + fit.width, cy)
    ctx.lineTo(gw, cy)
    ctx.stroke()
    // corners
    const c = 8 * px
    ctx.lineWidth = px * 1.5
    ctx.beginPath()
    for (const [x, y, sx, sy] of [
      [fit.x, fit.y, 1, 1],
      [fit.x + fit.width, fit.y, -1, 1],
      [fit.x, fit.y + fit.height, 1, -1],
      [fit.x + fit.width, fit.y + fit.height, -1, -1]
    ]) {
      ctx.moveTo(x + sx * c, y)
      ctx.lineTo(x, y)
      ctx.lineTo(x, y + sy * c)
    }
    ctx.stroke()
  }

  // ---- Labels (screen space) ----
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawMetricLabels(ctx, f, gw, { scale, ox, oy }, p.width, p.height)
}
