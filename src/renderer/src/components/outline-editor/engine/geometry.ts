// ============================================================
// Outline editor: geometry that needs no drawing library.
//
// The editor works in font units (Y down, like the rest of the app): the glyph's imported
// path is brought there through its fit matrix when it is loaded, and edited points go
// back through the inverse matrix when they are stored.
// ============================================================

import svgpath from 'svgpath'
import { applyAffine, uniformScale, type Affine } from '../../../core/affine'

/** A point of a contour: its position, and its two handles relative to it. */
export interface Node {
  x: number
  y: number
  inX: number
  inY: number
  outX: number
  outY: number
}

export interface Contour {
  closed: boolean
  nodes: Node[]
}

/**
 * The imported path in font units, with absolute lines, curves and closes only: what the
 * editor loads. (Arcs become curves here: svgo writes arc flags without separators, which
 * the drawing library does not read.)
 */
export function toEditSpace(raw: string, matrix: Affine): string {
  return svgpath(raw)
    .matrix([...matrix])
    .abs()
    .unshort()
    .unarc()
    .toString()
}

/**
 * Decimals to store edited coordinates with: about a thousandth of a font unit, whatever
 * the scale between the imported path and the font.
 */
export function storageDecimals(matrix: Affine): number {
  const scale = uniformScale(matrix)
  if (!(scale > 0)) return 3
  return Math.max(2, Math.min(6, Math.ceil(3 + Math.log10(scale))))
}

function num(v: number, decimals: number): string {
  const r = Number(v.toFixed(decimals))
  // "-0" would make two equal paths differ.
  return String(r === 0 ? 0 : r)
}

/**
 * Contours as a path of absolute M / L / C / Z commands, each point taken through
 * `matrix` (the inverse of the fit: back to the space the path was imported in).
 * No contour gives an empty string.
 */
export function contoursToPath(contours: readonly Contour[], matrix: Affine, decimals: number): string {
  const pt = (x: number, y: number): string => {
    const [px, py] = applyAffine(matrix, x, y)
    return `${num(px, decimals)} ${num(py, decimals)}`
  }
  const parts: string[] = []
  for (const c of contours) {
    const n = c.nodes.length
    if (n < 2) continue
    parts.push(`M${pt(c.nodes[0].x, c.nodes[0].y)}`)
    const last = c.closed ? n : n - 1
    for (let i = 0; i < last; i++) {
      const a = c.nodes[i]
      const b = c.nodes[(i + 1) % n]
      const straight = a.outX === 0 && a.outY === 0 && b.inX === 0 && b.inY === 0
      // The closing line back to the first point is the Z itself.
      if (straight && i === n - 1) continue
      parts.push(straight ? `L${pt(b.x, b.y)}` : `C${pt(a.x + a.outX, a.y + a.outY)} ${pt(b.x + b.inX, b.y + b.inY)} ${pt(b.x, b.y)}`)
    }
    if (c.closed) parts.push('Z')
  }
  return parts.join('')
}

/**
 * Whether a point is smooth: both handles pulled out, in opposite directions within
 * `toleranceDeg`. Not stored anywhere: read from the handles, so it survives a save.
 */
export function isSmoothNode(n: Pick<Node, 'inX' | 'inY' | 'outX' | 'outY'>, toleranceDeg = 1.5): boolean {
  const li = Math.hypot(n.inX, n.inY)
  const lo = Math.hypot(n.outX, n.outY)
  if (li < 1e-9 || lo < 1e-9) return false
  const cos = -(n.inX * n.outX + n.inY * n.outY) / (li * lo)
  return cos >= Math.cos((toleranceDeg * Math.PI) / 180)
}

/**
 * Handles of a point made smooth: both along the line that splits their angle, each at its
 * own length. Null when a handle is missing (the caller then asks the curve's neighbours).
 */
export function smoothedHandles(n: Pick<Node, 'inX' | 'inY' | 'outX' | 'outY'>): Pick<Node, 'inX' | 'inY' | 'outX' | 'outY'> | null {
  const li = Math.hypot(n.inX, n.inY)
  const lo = Math.hypot(n.outX, n.outY)
  if (li < 1e-9 || lo < 1e-9) return null
  // Tangent: from the incoming handle's side to the outgoing one's.
  let tx = n.outX / lo - n.inX / li
  let ty = n.outY / lo - n.inY / li
  const lt = Math.hypot(tx, ty)
  if (lt < 1e-9) {
    // Handles on top of each other: turn the tangent a quarter away from them.
    tx = -n.outY / lo
    ty = n.outX / lo
  } else {
    tx /= lt
    ty /= lt
  }
  return { inX: -tx * li, inY: -ty * li, outX: tx * lo, outY: ty * lo }
}

// ---- Snapping ----

export interface SnapTargets {
  /** Vertical lines (x positions): the origin, the advance, other points. */
  xs: readonly number[]
  /** Horizontal lines (y positions): font metrics, other points. */
  ys: readonly number[]
}

export interface SnapResult {
  x: number
  y: number
  /** The line snapped to on each axis, for the guide drawn while dragging. */
  snapX: number | null
  snapY: number | null
}

function nearest(v: number, targets: readonly number[], tolerance: number): number | null {
  let best: number | null = null
  let bestD = tolerance
  for (const t of targets) {
    const d = Math.abs(t - v)
    // Earlier targets win ties: font metrics are listed before other points.
    if (d < bestD || (best === null && d <= tolerance)) {
      best = t
      bestD = d
    }
  }
  return best
}

/** `x, y` moved onto the nearest line of each axis within `tolerance`, each axis on its own. */
export function snapPoint(x: number, y: number, targets: SnapTargets, tolerance: number): SnapResult {
  const snapX = nearest(x, targets.xs, tolerance)
  const snapY = nearest(y, targets.ys, tolerance)
  return { x: snapX ?? x, y: snapY ?? y, snapX, snapY }
}

// ---- Transform box ----

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** The eight scale handles of a box, row by row: [column, row] with 0 = min, 0.5 = middle, 1 = max. */
export const BOX_HANDLES: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.5, 0],
  [1, 0],
  [0, 0.5],
  [1, 0.5],
  [0, 1],
  [0.5, 1],
  [1, 1]
]

/**
 * Scale factors for dragging a box handle to `px, py`: the opposite handle stays put (or
 * the centre, with `fromCentre`); an edge handle scales one axis; `uniform` keeps the
 * proportions. A box with no extent on an axis is left alone on it.
 */
export function boxScale(
  box: Box,
  handle: readonly [number, number],
  px: number,
  py: number,
  opts: { fromCentre?: boolean; uniform?: boolean } = {}
): { sx: number; sy: number; pivotX: number; pivotY: number } {
  const [hx, hy] = handle
  const pivotX = box.x + box.width * (opts.fromCentre ? 0.5 : 1 - hx)
  const pivotY = box.y + box.height * (opts.fromCentre ? 0.5 : 1 - hy)
  const startX = box.x + box.width * hx
  const startY = box.y + box.height * hy
  const axis = (start: number, pivot: number, p: number, free: boolean): number => {
    const span = start - pivot
    if (!free || Math.abs(span) < 1e-9) return 1
    return (p - pivot) / span
  }
  let sx = axis(startX, pivotX, px, hx !== 0.5)
  let sy = axis(startY, pivotY, py, hy !== 0.5)
  if (opts.uniform) {
    if (hx === 0.5) sx = sy
    else if (hy === 0.5) sy = sx
    else {
      const s = Math.abs(sx) > Math.abs(sy) ? sx : sy
      sx = Math.abs(s) * Math.sign(sx || 1)
      sy = Math.abs(s) * Math.sign(sy || 1)
    }
  }
  return { sx, sy, pivotX, pivotY }
}
