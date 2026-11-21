// ============================================================
// A component's frame in the glyph view, and what dragging it means for the
// component's settings.
//
// A component is placed by pinning one anchor of its own box to an anchor of its
// context, plus the X / Y offsets (see `fitLayerPath`). So:
//   - moving it changes the offsets;
//   - scaling it changes the scale factor, which grows the component from its anchor;
//   - turning it changes the rotation, around the rotation pivot.
//
// Points are in the host glyph's layer space: Y-down font units, before a flattened
// variant is fitted again (`VariantComputed.flatMatrix`).
// ============================================================

import type { Layer } from '../types/font'
import { BoundsMode, ScaleMode } from '../types/font'
import { applyAffine, type Affine } from './affine'
import type { FitResult } from './transform'

export type Pt = readonly [x: number, y: number]

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export interface LayerFrame {
  /** The placed outline's bounding box: the frame that is drawn and grabbed. */
  bounds: Box
  /** The box the component's anchor is read on (it follows the component's bounds setting). */
  anchorBox: Box
  /** The component's anchor on `anchorBox`. Scaling leaves it in place. */
  anchor: Pt
  /**
   * What a turn goes around: where the rotation pivot lands, for a component that keeps
   * its own box. A box that follows the outline is put back on its anchor after the turn,
   * whatever the pivot: the middle of the frame then.
   */
  pivot: Pt
  /** -1 when the placement mirrors the component: it then turns the other way. */
  turn: 1 | -1
}

/** What a gesture changes on the component. */
export type LayerEdit = Partial<Pick<Layer, 'xOffset' | 'yOffset' | 'layerScale' | 'layerScaleFactor' | 'rotation'>>

/** An anchor (0–8, row by row from the top left) as fractions of a box. */
export function anchorFractions(anchor: number): Pt {
  return [(anchor % 3) / 2, Math.floor(anchor / 3) / 2]
}

/** The four corners of a box, clockwise from the top left. The opposite of corner `i` is `(i + 2) % 4`. */
export function boxCorners(b: Box): [Pt, Pt, Pt, Pt] {
  return [
    [b.x, b.y],
    [b.x + b.width, b.y],
    [b.x + b.width, b.y + b.height],
    [b.x, b.y + b.height]
  ]
}

/**
 * @param fit the placed component (`LayerComputed.fit`)
 * @param matrix from the referenced glyph's path to `fit.path` (`LayerComputed.matrix`)
 * @param refBase the referenced glyph's own fit: the rotation pivot is read on its box
 */
export function layerFrame(layer: Layer, fit: FitResult, matrix: Affine, refBase: Pick<FitResult, 'width' | 'height'>): LayerFrame {
  const anchorBox = { x: fit.fit.x, y: fit.fit.y, width: fit.fit.width, height: fit.fit.height }
  const [ax, ay] = anchorFractions(layer.layerAnchor)
  const [px, py] = anchorFractions(layer.rotationAnchor)
  const bounds = { x: fit.bbox.x, y: fit.bbox.y, width: fit.bbox.width, height: fit.bbox.height }
  return {
    bounds,
    anchorBox,
    anchor: [anchorBox.x + anchorBox.width * ax, anchorBox.y + anchorBox.height * ay],
    pivot:
      layer.layerBounds === BoundsMode.Outside
        ? applyAffine(matrix, refBase.width * px, refBase.height * py)
        : [bounds.x + bounds.width / 2, bounds.y + bounds.height / 2],
    turn: matrix[0] * matrix[3] - matrix[1] * matrix[2] < 0 ? -1 : 1
  }
}

/** The scale a component is placed at: its factor, when it is scaled at all. */
export function layerScaleOf(layer: Pick<Layer, 'layerScale' | 'layerScaleFactor'>): number {
  return layer.layerScale === ScaleMode.Manual && isFinite(layer.layerScaleFactor) ? layer.layerScaleFactor : 1
}

// ---- Gestures. `layer` and `frame` are those the gesture started with. ----

/** Dragged by `dx, dy`. `lockAxis` keeps the larger of the two only. Offsets land on whole units. */
export function moveEdit(layer: Layer, dx: number, dy: number, lockAxis = false): LayerEdit {
  if (lockAxis) {
    if (Math.abs(dx) >= Math.abs(dy)) dy = 0
    else dx = 0
  }
  return {
    xOffset: dx === 0 ? layer.xOffset : Math.round(layer.xOffset + dx),
    yOffset: dy === 0 ? layer.yOffset : Math.round(layer.yOffset + dy)
  }
}

/** Smallest and largest factor a drag can reach. */
const MIN_SCALE = 0.01
const MAX_SCALE = 100
/** A corner this near the pivot (as a share of the frame's diagonal) has nothing to pull against. */
const MIN_LEVER = 0.1

/**
 * A corner of the frame dragged to `to`. The component grows from its anchor, so only the
 * scale factor changes. With `fromOpposite`, or when the corner sits on the anchor, the
 * opposite corner stays in place instead and the offsets make up for it.
 */
export function scaleEdit(layer: Layer, frame: LayerFrame, corner: Pt, opposite: Pt, to: Pt, fromOpposite = false): LayerEdit {
  const diagonal = Math.hypot(corner[0] - opposite[0], corner[1] - opposite[1])
  if (diagonal < 1e-9) return {}
  let pivot = fromOpposite ? opposite : frame.anchor
  if (Math.hypot(corner[0] - pivot[0], corner[1] - pivot[1]) < diagonal * MIN_LEVER) pivot = opposite
  const vx = corner[0] - pivot[0]
  const vy = corner[1] - pivot[1]
  // How far along the pivot-to-corner line the pointer is: 1 at the corner.
  const k = ((to[0] - pivot[0]) * vx + (to[1] - pivot[1]) * vy) / (vx * vx + vy * vy)
  const from = layerScaleOf(layer) || 1
  const size = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.abs(from) * k))
  const factor = Math.sign(from) * Math.round(size * 1000) / 1000
  const edit: LayerEdit = { layerScale: ScaleMode.Manual, layerScaleFactor: factor }
  if (pivot !== frame.anchor) {
    // The anchor is what stays put when the factor changes: move it as the scaling would.
    const grown = factor / from - 1
    edit.xOffset = Math.round(layer.xOffset + grown * (frame.anchor[0] - pivot[0]))
    edit.yOffset = Math.round(layer.yOffset + grown * (frame.anchor[1] - pivot[1]))
  }
  return edit
}

/**
 * The pointer went from `from` to `to` around the rotation pivot. Tenths of a degree, or
 * multiples of `step` degrees; the result is within -180…180.
 */
export function rotateEdit(layer: Layer, frame: LayerFrame, from: Pt, to: Pt, step = 0): LayerEdit {
  const angle = (p: Pt): number => Math.atan2(p[1] - frame.pivot[1], p[0] - frame.pivot[0])
  let deg = layer.rotation + (frame.turn * (angle(to) - angle(from)) * 180) / Math.PI
  deg = ((((deg + 180) % 360) + 360) % 360) - 180
  // Rounded last: the arithmetic above would leave 49.199999….
  deg = step > 0 ? Math.round(deg / step) * step : Math.round(deg * 10) / 10
  return { rotation: deg <= -180 ? 180 : deg + 0 }
}
