// ============================================================
// 2D affine matrices, in svgpath / SVG order [a, b, c, d, e, f]:
//   x' = a·x + c·y + e
//   y' = b·x + d·y + f
// ============================================================

export type Affine = readonly [a: number, b: number, c: number, d: number, e: number, f: number]

export const IDENTITY: Affine = [1, 0, 0, 1, 0, 0]

export function translation(dx: number, dy: number): Affine {
  return [1, 0, 0, 1, dx, dy]
}

/** The matrix that applies `before` first, then `after`. */
export function multiply(after: Affine, before: Affine): Affine {
  const [a1, b1, c1, d1, e1, f1] = after
  const [a2, b2, c2, d2, e2, f2] = before
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1
  ]
}

/** The inverse matrix, or null when the matrix flattens the plane (zero scale). */
export function invert(m: Affine): Affine | null {
  const [a, b, c, d, e, f] = m
  const det = a * d - b * c
  if (!isFinite(det) || Math.abs(det) < 1e-12) return null
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det]
}

export function applyAffine(m: Affine, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
}

/** Mean scale factor of the matrix (the square root of its area scale). */
export function uniformScale(m: Affine): number {
  return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]))
}
