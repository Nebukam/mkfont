// ============================================================
// Geometry helpers — exact path bounds without the DOM.
//
// v1 relied on SVGGraphicsElement.getBBox(), which returns the tight
// geometric bounds of a path (curve extrema included). This module
// computes the same bounds in plain JS so the transform engine can run
// in Node (tests), in workers, and without forcing layout.
// ============================================================

import svgpath from 'svgpath'
import type { BBox } from '../types/font'

export function makeBBox(x: number, y: number, width: number, height: number): BBox {
  return { x, y, width, height, top: y, bottom: y + height, left: x, right: x + width }
}

export function translateBBox(b: BBox, dx: number, dy = 0): BBox {
  return makeBBox(b.x + dx, b.y + dy, b.width, b.height)
}

/** Solve a*t^2 + b*t + c = 0 for t in (0, 1). */
function quadraticRoots(a: number, b: number, c: number, out: number[]): void {
  const EPS = 1e-12
  if (Math.abs(a) < EPS) {
    if (Math.abs(b) < EPS) return
    const t = -c / b
    if (t > 0 && t < 1) out.push(t)
    return
  }
  const disc = b * b - 4 * a * c
  if (disc < 0) return
  const sq = Math.sqrt(disc)
  const t1 = (-b + sq) / (2 * a)
  const t2 = (-b - sq) / (2 * a)
  if (t1 > 0 && t1 < 1) out.push(t1)
  if (t2 > 0 && t2 < 1) out.push(t2)
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3
}

function quadAt(p0: number, p1: number, p2: number, t: number): number {
  const mt = 1 - t
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2
}

/**
 * Tight bounding box of an SVG path string (Y-down, any command set).
 * Matches Chrome's getBBox(): moveTo points of empty contours are included,
 * curve extrema are exact, arcs are approximated by cubic curves.
 */
export function pathBBox(d: string): BBox {
  if (!d || d.trim().length === 0) return makeBBox(0, 0, 0, 0)

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const add = (x: number, y: number): void => {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  const roots: number[] = []

  try {
    svgpath(d)
      .abs()
      .unshort()
      .unarc()
      .iterate((seg: (string | number)[], _i: number, x: number, y: number) => {
        const cmd = seg[0] as string
        switch (cmd) {
          case 'M':
          case 'L':
            add(seg[1] as number, seg[2] as number)
            break
          case 'H':
            add(x, y)
            add(seg[1] as number, y)
            break
          case 'V':
            add(x, y)
            add(x, seg[1] as number)
            break
          case 'C': {
            const x1 = seg[1] as number, y1 = seg[2] as number
            const x2 = seg[3] as number, y2 = seg[4] as number
            const x3 = seg[5] as number, y3 = seg[6] as number
            add(x, y)
            add(x3, y3)
            roots.length = 0
            // derivative coefficients: 3[(-p0+3p1-3p2+p3)t^2 + 2(p0-2p1+p2)t + (p1-p0)]
            quadraticRoots(-x + 3 * x1 - 3 * x2 + x3, 2 * (x - 2 * x1 + x2), x1 - x, roots)
            for (const t of roots) add(cubicAt(x, x1, x2, x3, t), cubicAt(y, y1, y2, y3, t))
            roots.length = 0
            quadraticRoots(-y + 3 * y1 - 3 * y2 + y3, 2 * (y - 2 * y1 + y2), y1 - y, roots)
            for (const t of roots) add(cubicAt(x, x1, x2, x3, t), cubicAt(y, y1, y2, y3, t))
            break
          }
          case 'Q': {
            const x1 = seg[1] as number, y1 = seg[2] as number
            const x2 = seg[3] as number, y2 = seg[4] as number
            add(x, y)
            add(x2, y2)
            const dx = x - 2 * x1 + x2
            if (Math.abs(dx) > 1e-12) {
              const t = (x - x1) / dx
              if (t > 0 && t < 1) add(quadAt(x, x1, x2, t), quadAt(y, y1, y2, t))
            }
            const dy = y - 2 * y1 + y2
            if (Math.abs(dy) > 1e-12) {
              const t = (y - y1) / dy
              if (t > 0 && t < 1) add(quadAt(x, x1, x2, t), quadAt(y, y1, y2, t))
            }
            break
          }
          // 'Z' closes back to the subpath start, which is already counted.
        }
      })
  } catch {
    return makeBBox(0, 0, 0, 0)
  }

  if (!isFinite(minX) || !isFinite(minY)) return makeBBox(0, 0, 0, 0)
  return makeBBox(minX, minY, maxX - minX, maxY - minY)
}
