import { describe, expect, it } from 'vitest'
import { invert, type Affine } from '../../../../core/affine'
import { pathBBox } from '../../../../core/geometry'
import { createOutlineEngine, type EditKind, type OutlineEngine } from '../engine'
import { boxScale, contoursToPath, isSmoothNode, smoothedHandles, snapPoint, storageDecimals, toEditSpace } from '../geometry'

/** Imported space to font units: twice the size, moved by (10, 20). */
const M: Affine = [2, 0, 0, 2, 10, 20]
const SQUARE = 'M0 0L50 0L50 50L0 50Z'
/** A square with a curved top, and a hole. */
const SHAPE = 'M0 0C10 -20 40 -20 50 0L50 50L0 50Z M10 10h10v10h-10z'

interface Rig {
  engine: OutlineEngine
  commits: { path: string; kind: EditKind; merge?: string }[]
}

function rig(raw: string, matrix: Affine = M): Rig {
  const commits: Rig['commits'] = []
  const engine = createOutlineEngine({ width: 400, height: 400 }, { onCommit: (path, kind, merge) => commits.push({ path, kind, merge }) })
  // One pixel per font unit, no offset: pointer positions are font coordinates.
  engine.setView({ scale: 1, ox: 0, oy: 0 }, 400, 400)
  engine.load({ path: toEditSpace(raw, matrix), inverse: invert(matrix)!, matrix })
  return { engine, commits }
}

const drag = (e: OutlineEngine, from: [number, number], to: [number, number], mods = {}): void => {
  e.pointerDown(from[0], from[1], mods)
  e.pointerMove((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, mods)
  e.pointerMove(to[0], to[1], mods)
  e.pointerUp(to[0], to[1], mods)
}
const click = (e: OutlineEngine, at: [number, number], mods = {}): void => {
  e.pointerDown(at[0], at[1], mods)
  e.pointerUp(at[0], at[1], mods)
}

describe('outline geometry', () => {
  it('writes contours back through the inverse matrix', () => {
    const { engine } = rig(SQUARE)
    expect(engine.serialize()).toBe('M0 0L50 0L50 50L0 50Z')
  })

  it('keeps curves, holes and relative commands', () => {
    const { engine } = rig(SHAPE)
    expect(engine.serialize()).toBe('M0 0C10 -20 40 -20 50 0L50 50L0 50ZM10 10L20 10L20 20L10 20Z')
  })

  it('turns arcs written the compact way and quadratics into curves', () => {
    const { engine } = rig('M0 0a5 5 0 0110 0q5 5 0 10z')
    const out = engine.serialize()
    expect(out.startsWith('M0 0C')).toBe(true)
    const b = pathBBox(out)
    expect(b.x).toBeCloseTo(0, 2)
    expect(b.y).toBeCloseTo(-5, 2)
    expect(b.right).toBeCloseTo(12.5, 2)
  })

  it('is stable: storing an outline and loading it again changes nothing', () => {
    const skew: Affine = [1.37, 0.21, -0.4, 0.93, 3.3, -7.1]
    const first = rig(SHAPE, skew).engine.serialize()
    expect(rig(first, skew).engine.serialize()).toBe(first)
  })

  it('stores about a thousandth of a font unit', () => {
    expect(storageDecimals([1, 0, 0, 1, 0, 0])).toBe(3)
    expect(storageDecimals([30, 0, 0, 30, 0, 0])).toBe(5)
    expect(storageDecimals([0.05, 0, 0, 0.05, 0, 0])).toBe(2)
    expect(contoursToPath([{ closed: true, nodes: [{ x: 1 / 3, y: -1e-9, inX: 0, inY: 0, outX: 0, outY: 0 }, { x: 2, y: 2, inX: 0, inY: 0, outX: 0, outY: 0 }] }], [1, 0, 0, 1, 0, 0], 3)).toBe('M0.333 0L2 2Z')
  })

  it('tells smooth points from corners', () => {
    expect(isSmoothNode({ inX: -10, inY: 0, outX: 5, outY: 0 })).toBe(true)
    expect(isSmoothNode({ inX: -10, inY: 0, outX: 5, outY: 0.05 })).toBe(true)
    expect(isSmoothNode({ inX: -10, inY: 0, outX: 5, outY: 3 })).toBe(false)
    expect(isSmoothNode({ inX: 0, inY: 0, outX: 5, outY: 0 })).toBe(false)
    const s = smoothedHandles({ inX: -10, inY: 0, outX: 0, outY: 5 })!
    expect(isSmoothNode(s, 0.001)).toBe(true)
    expect(Math.hypot(s.inX, s.inY)).toBeCloseTo(10)
    expect(Math.hypot(s.outX, s.outY)).toBeCloseTo(5)
    expect(smoothedHandles({ inX: 0, inY: 0, outX: 0, outY: 5 })).toBeNull()
  })

  it('snaps each axis on its own, font metrics first', () => {
    const r = snapPoint(102, 55, { xs: [100, 104], ys: [0, 800] }, 5)
    expect([r.x, r.y, r.snapX, r.snapY]).toEqual([100, 55, 100, null])
    expect(snapPoint(3, 3, { xs: [], ys: [] }, 5).snapX).toBeNull()
  })

  it('scales a box from the opposite handle, the centre, or in proportion', () => {
    const box = { x: 0, y: 0, width: 100, height: 50 }
    expect(boxScale(box, [1, 1], 200, 50)).toEqual({ sx: 2, sy: 1, pivotX: 0, pivotY: 0 })
    expect(boxScale(box, [1, 0.5], 150, 999)).toEqual({ sx: 1.5, sy: 1, pivotX: 0, pivotY: 25 })
    expect(boxScale(box, [1, 1], 150, 50, { fromCentre: true }).sx).toBe(2)
    const u = boxScale(box, [1, 1], 200, 60, { uniform: true })
    expect([u.sx, u.sy]).toEqual([2, 2])
    expect(boxScale({ x: 0, y: 0, width: 0, height: 50 }, [1, 1], 30, 100).sx).toBe(1)
  })
})

describe('outline engine', () => {
  // The square's corners in font units: (10,20) (110,20) (110,120) (10,120).

  it('does not report an edit for clicks and selections', () => {
    const { engine, commits } = rig(SQUARE)
    click(engine, [10, 20])
    expect(engine.selection().count).toBe(1)
    click(engine, [110, 120], { shift: true })
    expect(engine.selection().count).toBe(2)
    click(engine, [110, 120], { shift: true })
    expect(engine.selection().count).toBe(1)
    click(engine, [110, 120], { shift: true })
    click(engine, [110, 120])
    expect(engine.selection()).toMatchObject({ count: 1, x: 110, y: 120 })
    click(engine, [10, 20], { shift: true })
    click(engine, [200, 300])
    expect(engine.selection().count).toBe(0)
    engine.selectAll()
    expect(engine.selection()).toMatchObject({ count: 4, total: 4, contours: 1 })
    expect(commits).toEqual([])
  })

  it('moves a point and reports one edit, in the stored space', () => {
    const { engine, commits } = rig(SQUARE)
    drag(engine, [110, 20], [130, 40])
    expect(commits).toEqual([{ path: 'M0 0L60 10L50 50L0 50Z', kind: 'move', merge: undefined }])
    expect(engine.selection()).toMatchObject({ count: 1, x: 130, y: 40 })
  })

  it('moves every selected point, on one axis with Shift', () => {
    const { engine, commits } = rig(SQUARE)
    click(engine, [10, 20])
    click(engine, [110, 20], { shift: true })
    drag(engine, [110, 20], [118, 60], { shift: true })
    expect(commits.map((c) => c.path)).toEqual(['M0 20L50 20L50 50L0 50Z'])
  })

  it('moves a segment by its two ends', () => {
    const { engine, commits } = rig(SQUARE)
    drag(engine, [60, 20], [60, 0])
    expect(commits.map((c) => c.path)).toEqual(['M0 -10L50 -10L50 50L0 50Z'])
  })

  it('selects with a marquee, adding with Shift', () => {
    const { engine, commits } = rig(SQUARE)
    drag(engine, [0, 0], [120, 30])
    expect(engine.selection().count).toBe(2)
    drag(engine, [100, 110], [130, 130], { shift: true })
    expect(engine.selection().count).toBe(3)
    expect(commits).toEqual([])
  })

  it('puts a drag back when it is cancelled', () => {
    const { engine, commits } = rig(SQUARE)
    engine.pointerDown(110, 20)
    engine.pointerMove(150, 60)
    expect(engine.keyDown('Escape')).toBe(true)
    engine.pointerUp(150, 60)
    expect(engine.serialize()).toBe(SQUARE)
    expect(commits).toEqual([])
  })

  it('adds a point on the outline without changing the shape', () => {
    const { engine, commits } = rig(SHAPE)
    const before = pathBBox(engine.serialize())
    // Top of the curve: x = 60 in font units, y = 20 + 2 × (-15).
    engine.doubleClick(60, -10)
    expect(commits.map((c) => c.kind)).toEqual(['insert'])
    expect(engine.selection()).toMatchObject({ count: 1, total: 9 })
    const after = pathBBox(commits[0].path)
    expect(after.y).toBeCloseTo(before.y, 2)
    expect(after.height).toBeCloseTo(before.height, 2)
    // The new point is smooth: it sits on a curve.
    expect(engine.selection().smooth).toBe(true)
  })

  it('removes points, then the contour, then everything', () => {
    const { engine, commits } = rig(SQUARE)
    click(engine, [10, 20])
    engine.keyDown('Delete')
    expect(commits.at(-1)).toMatchObject({ path: 'M50 0L50 50L0 50Z', kind: 'delete' })
    engine.selectAll()
    engine.deleteSelected()
    expect(commits.at(-1)).toMatchObject({ path: '', kind: 'delete' })
  })

  it('reverses and deletes the contours of the selected points', () => {
    const { engine, commits } = rig(SHAPE)
    // A corner of the hole: (10,10) → (30,40).
    click(engine, [30, 40])
    engine.selectContours()
    expect(engine.selection()).toMatchObject({ count: 4, contours: 1 })
    engine.reverseContours()
    expect(commits.at(-1)).toMatchObject({ path: 'M0 0C10 -20 40 -20 50 0L50 50L0 50ZM10 20L20 20L20 10L10 10Z', kind: 'reverse' })
    engine.deleteContours()
    expect(commits.at(-1)).toMatchObject({ path: 'M0 0C10 -20 40 -20 50 0L50 50L0 50Z', kind: 'deleteContour' })
  })

  it('makes a corner smooth and back', () => {
    const { engine, commits } = rig(SHAPE)
    // The curve's first point has one handle only: a corner.
    click(engine, [10, 20])
    expect(engine.selection().smooth).toBe(false)
    engine.keyDown('Enter')
    expect(commits.at(-1)!.kind).toBe('convert')
    expect(engine.selection().smooth).toBe(true)
    engine.toggleSmooth()
    expect(engine.selection().smooth).toBe(false)
    expect(commits.length).toBe(2)
  })

  it('drags a handle, keeping a smooth point smooth unless Alt is held', () => {
    const { engine, commits } = rig('M0 0C10 0 20 10 30 10C40 10 50 0 60 0L60 40L0 40Z')
    // The middle point (30,10) → font (70,40), handles (-20,0) and (20,0) in font units.
    click(engine, [70, 40])
    expect(engine.selection().smooth).toBe(true)
    drag(engine, [90, 40], [70, 60])
    expect(commits.at(-1)!.kind).toBe('handle')
    expect(engine.selection().smooth).toBe(true)
    drag(engine, [70, 60], [90, 60], { alt: true })
    expect(engine.selection().smooth).toBe(false)
  })

  it('nudges with the arrow keys as one edit per run', () => {
    const { engine, commits } = rig(SQUARE)
    click(engine, [10, 20])
    for (let i = 0; i < 3; i++) expect(engine.keyDown('ArrowRight')).toBe(true)
    engine.keyDown('Shift+ArrowUp')
    expect(commits).toEqual([])
    engine.keyUp('ArrowUp')
    expect(commits.length).toBe(1)
    expect(commits[0]).toMatchObject({ path: 'M1.5 -5L50 0L50 50L0 50Z', kind: 'move' })
    expect(commits[0].merge).toMatch(/^nudge:/)
    // The edit comes back from the font: the next nudges of the same points join it.
    engine.load({ path: toEditSpace(commits[0].path, M), inverse: invert(M)!, matrix: M })
    engine.keyDown('ArrowLeft')
    engine.keyUp('ArrowLeft')
    expect(commits[1].merge).toBe(commits[0].merge)
    // Another selection starts another step.
    click(engine, [110, 20])
    engine.keyDown('ArrowLeft')
    engine.keyUp('ArrowLeft')
    expect(commits[2].merge).not.toBe(commits[0].merge)
  })

  it('sets a typed position on every selected point', () => {
    const { engine, commits } = rig(SQUARE)
    click(engine, [10, 20])
    click(engine, [110, 20], { shift: true })
    expect(engine.selection()).toMatchObject({ x: undefined, y: 20 })
    engine.setPosition('y', 0, false)
    expect(commits.at(-1)).toMatchObject({ path: 'M0 -10L50 -10L50 50L0 50Z', kind: 'move', merge: undefined })
    engine.setPosition('x', 60, true)
    expect(commits.at(-1)!.merge).toMatch(/^x:/)
  })

  it('snaps the dragged point to metrics and to other points, not with Ctrl', () => {
    const { engine, commits } = rig(SQUARE)
    engine.setSnap({ xs: [0], ys: [50] }, true)
    drag(engine, [110, 20], [113, 53])
    // x snaps to the other points at 110, y to the metric at 50.
    expect(engine.selection()).toMatchObject({ x: 110, y: 50 })
    drag(engine, [110, 50], [113, 53], { ctrl: true })
    expect(engine.selection()).toMatchObject({ x: 113, y: 53 })
    expect(commits.length).toBe(2)
  })

  it('scales and rotates the selection with the transform box', () => {
    const { engine, commits } = rig(SQUARE)
    engine.setMode('transform')
    expect(engine.mode).toBe('select')
    engine.selectAll()
    engine.setMode('transform')
    expect(engine.mode).toBe('transform')
    // Bottom-right handle, away from the top-left corner: twice as wide, half as tall again.
    drag(engine, [110, 120], [210, 170])
    expect(commits.at(-1)).toMatchObject({ path: 'M0 0L100 0L100 75L0 75Z', kind: 'transform' })
    // The knob above the box, a quarter turn with Shift's steps: around the box's centre (110, 95).
    drag(engine, [110, -2], [300, 95], { shift: true })
    expect(commits.at(-1)).toMatchObject({ path: 'M87.5 -12.5L87.5 87.5L12.5 87.5L12.5 -12.5Z', kind: 'transform' })
    engine.keyDown('Escape')
    expect(engine.mode).toBe('select')
    expect(engine.selection().count).toBe(4)
  })

  it('keeps the selection when the same contours come back, drops it otherwise', () => {
    const { engine } = rig(SQUARE)
    click(engine, [110, 20])
    const matrix: Affine = [2, 0, 0, 2, 30, 20]
    engine.load({ path: toEditSpace('M0 0L60 10L50 50L0 50Z', matrix), inverse: invert(matrix)!, matrix })
    expect(engine.selection()).toMatchObject({ count: 1, x: 150, y: 40 })
    engine.load({ path: toEditSpace('M0 0L50 50L0 50Z', M), inverse: invert(M)!, matrix: M })
    expect(engine.selection().count).toBe(0)
    engine.load(null)
    expect(engine.selection().total).toBe(0)
    expect(engine.serialize()).toBe('')
  })
})
