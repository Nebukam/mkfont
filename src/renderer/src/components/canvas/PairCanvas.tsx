// ============================================================
// Kerning renderer (Canvas2D): glyphs set side by side with the
// kerning between them applied. Same coordinates as GlyphCanvas
// (font units, Y-down, baseline at y = baseline).
// ============================================================

import { memo, useEffect, useRef } from 'react'
import type { FamilyValues } from '../../types/font'
import { isEmptyPathContent } from '../../core/model'
import { tokenColor, useThemeVersion } from '../../lib/theme'
import { computeFraming, type CanvasMode } from './GlyphCanvas'

export interface SetGlyph {
  /** Final outline, or nothing (an empty glyph, or one not in the font). */
  path: string | null | undefined
  advance: number
  /** Drawn in the system font when the glyph is not in the font. */
  fallback?: string
  /** Drawn quieter: the glyphs around a pair in a proof. */
  dim?: boolean
}

export interface PairCanvasProps {
  glyphs: SetGlyph[]
  /** Kerning after each glyph but the last, in font units. */
  kerns: number[]
  /** The joint whose kerning is marked under the baseline (an index into `kerns`). */
  mark?: number
  /** The marked kerning is inherited from the base letters' pair: a lighter mark. */
  markInherited?: boolean
  /** A value suggested for the marked joint while it has no kerning: a dashed mark. */
  hint?: number
  family: FamilyValues
  width: number
  height: number
  mode: CanvasMode
  /** The pair does nothing in exported fonts (a glyph is missing): drawn faded. */
  faded?: boolean
  className?: string
}

export const PairCanvas = memo(function PairCanvas(props: PairCanvasProps): React.ReactElement {
  const ref = useRef<HTMLCanvasElement>(null)
  // A theme change re-renders, and every render redraws (the glyph lists are rebuilt by
  // the callers anyway).
  useThemeVersion()
  useEffect(() => {
    if (ref.current) draw(ref.current, props)
  })
  return <canvas ref={ref} className={props.className} style={{ width: props.width, height: props.height }} aria-hidden />
})

function draw(canvas: HTMLCanvasElement, p: PairCanvasProps): void {
  const dpr = window.devicePixelRatio || 1
  const W = Math.max(1, Math.round(p.width * dpr))
  const H = Math.max(1, Math.round(p.height * dpr))
  if (canvas.width !== W) canvas.width = W
  if (canvas.height !== H) canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, W, H)
  if (!p.glyphs.length) return

  // Pen positions: each glyph starts after the previous advance plus the kerning between them.
  const xs: number[] = []
  let x = 0
  p.glyphs.forEach((g, i) => {
    xs.push(x)
    x += g.advance + (p.kerns[i] ?? 0)
  })
  const total = Math.max(1, xs[xs.length - 1] + p.glyphs[p.glyphs.length - 1].advance)

  const f = p.family
  const { scale, ox, oy } = computeFraming(f, total, p.width, p.height, p.mode)
  const px = 1 / (scale * dpr)
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr)
  const left = -ox / scale
  const right = (p.width - ox) / scale
  const bsl = f.baseline

  // Baseline
  ctx.fillStyle = tokenColor('fg', p.mode === 'preview' ? 0.12 : 0.07)
  ctx.fillRect(left, bsl, right - left, px)

  // Advance edges of the glyphs (the proof only): the kerning shows as their overlap.
  if (p.mode === 'preview') {
    ctx.fillStyle = tokenColor('fg', 0.1)
    for (let i = 0; i < p.glyphs.length; i++) {
      const top = bsl - f.ascent
      const h = f.ascent - f.descent
      ctx.fillRect(xs[i], top, px, h)
      ctx.fillRect(xs[i] + p.glyphs[i].advance, top, px, h)
    }
  }

  ctx.globalAlpha = p.faded ? 0.4 : 1
  p.glyphs.forEach((g, i) => {
    ctx.save()
    ctx.translate(xs[i], 0)
    if (g.path && !isEmptyPathContent(g.path)) {
      try {
        ctx.fillStyle = tokenColor('glyph', g.dim ? 0.45 : 1)
        ctx.fill(new Path2D(g.path))
      } catch {
        /* invalid path */
      }
    } else if (g.fallback) {
      ctx.fillStyle = tokenColor('fg', 0.2)
      ctx.font = `${Math.round(f['cap-height'] / 0.7)}px "Segoe UI", system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(g.fallback, g.advance / 2, bsl)
    }
    ctx.restore()
  })
  ctx.globalAlpha = 1

  // The kerning at the marked joint: a bar under the baseline, as wide as the kerning.
  // Without kerning, a suggested value shows as a dashed bar.
  const m = p.mark
  if (m === undefined) return
  const kern = p.kerns[m] ?? 0
  const amount = kern || p.hint || 0
  if (!amount) return
  const joint = xs[m] + p.glyphs[m].advance
  const from = Math.min(joint, joint + amount)
  const barH = (p.mode === 'preview' ? 3 : 2) * dpr * px
  const gap = (p.mode === 'preview' ? 6 : 4) * dpr * px
  if (kern) {
    ctx.fillStyle = tokenColor(kern < 0 ? 'emphasis' : 'warn', p.markInherited ? 0.45 : 0.9)
    ctx.fillRect(from, bsl + gap, Math.abs(kern), barH)
  } else {
    ctx.strokeStyle = tokenColor('fg', 0.4)
    ctx.lineWidth = barH
    ctx.setLineDash([3 * dpr * px, 2 * dpr * px])
    ctx.beginPath()
    ctx.moveTo(from, bsl + gap + barH / 2)
    ctx.lineTo(from + Math.abs(amount), bsl + gap + barH / 2)
    ctx.stroke()
    ctx.setLineDash([])
  }
}
