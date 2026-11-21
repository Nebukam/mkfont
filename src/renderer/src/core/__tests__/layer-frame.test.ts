import { describe, expect, it } from 'vitest'
import svgpath from 'svgpath'
import type { Affine } from '../affine'
import { computeAll } from '../compute'
import { pathBBox } from '../geometry'
import { boxCorners, layerFrame, layerScaleOf, moveEdit, rotateEdit, scaleEdit, type LayerFrame, type Pt } from '../layer-frame'
import { createFamily, createGlyph, createLayer } from '../model'
import { reversePath } from '../transform'
import { BoundsMode, MirrorMode, ScaleMode, type Glyph, type Layer, type PathData, type Variant } from '../../types/font'

/** Nothing symmetric: a turn or a mirror shows. */
const SHAPE = 'M10 20L90 30C100 60 70 110 40 100Q20 90 15 60Z'
const HOST = 'M0 0h400v700h-400z'

const pathData = (path: string, width: number, height: number): PathData => ({
  exists: true,
  markedBBox: false,
  path,
  width,
  height,
  bbox: pathBBox(path)
})

function coords(d: string): number[] {
  const out: number[] = []
  svgpath(d)
    .abs()
    .unshort()
    .iterate((seg: (string | number)[], _i: number, x: number, y: number) => {
      const cmd = seg[0] as string
      if (cmd === 'H') out.push(seg[1] as number, y)
      else if (cmd === 'V') out.push(x, seg[1] as number)
      else for (let i = 1; i < seg.length; i++) out.push(seg[i] as number)
    })
  return out
}

const through = (d: string, m: Affine): string => svgpath(d).matrix([...m]).toString()

/** A host glyph (0042) with one component, the glyph 0041. */
function place(layer: Partial<Layer>, host: Partial<Variant> = {}): { layer: Layer; frame: LayerFrame; path: string; whole: string; flat: Affine | null } {
  const family = createFamily()
  const glyphs = new Map<string, Glyph>()
  glyphs.set('0041', createGlyph('0041', family.transforms, { pathData: pathData(SHAPE, 120, 130) }))
  const l = createLayer('A', layer)
  glyphs.set('0042', createGlyph('0042', family.transforms, { pathData: pathData(HOST, 400, 700), layers: [l], ...host }))
  const computed = computeAll(family, glyphs)
  const ref = computed.get('0041')![0]
  const c = computed.get('0042')![0]
  const lc = c.layers[0]
  return { layer: l, frame: layerFrame(l, lc.fit!, lc.matrix!, ref.base), path: lc.fit!.path, whole: c.path, flat: c.flatMatrix }
}

const near = (a: Pt, b: Pt, tol: number): void => {
  expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeLessThan(tol)
}

describe('component placement matrix', () => {
  it('takes the referenced glyph to its place for every setting', () => {
    let checked = 0
    for (let layerBounds = 0; layerBounds < 4; layerBounds++)
      for (let mirror = 0; mirror < 4; mirror++)
        for (const rot of [{}, { rotation: 23, skewX: 6, skewY: -4, skewRotOrder: 2, rotationAnchor: 8 }])
          for (const layerAnchor of [0, 4, 7]) {
            const settings: Partial<Layer> = { layerBounds, contextBounds: (layerBounds + 1) % 4, mirror, layerAnchor, contextAnchor: 8 - layerAnchor, layerScaleFactor: 0.6, xOffset: 14, yOffset: -9, ...rot }
            const family = createFamily()
            const glyphs = new Map<string, Glyph>()
            glyphs.set('0041', createGlyph('0041', family.transforms, { pathData: pathData(SHAPE, 120, 130) }))
            glyphs.set('0042', createGlyph('0042', family.transforms, { pathData: pathData(HOST, 400, 700), layers: [createLayer('A', settings)] }))
            const computed = computeAll(family, glyphs)
            const lc = computed.get('0042')![0].layers[0]
            let mine = through(computed.get('0041')![0].path, lc.matrix!)
            if (mirror === MirrorMode.Horizontal || mirror === MirrorMode.Vertical) mine = reversePath(mine)
            const a = coords(mine)
            const b = coords(lc.fit!.path)
            expect(a.length).toBe(b.length)
            for (let i = 0; i < a.length; i++) expect(Math.abs(a[i] - b[i])).toBeLessThan(1e-6)
            checked++
          }
    expect(checked).toBe(4 * 4 * 2 * 3)
  })

  it('has none for a component that is not placed', () => {
    const family = createFamily()
    const glyphs = new Map<string, Glyph>()
    glyphs.set('0042', createGlyph('0042', family.transforms, { layers: [createLayer('A')] }))
    const lc = computeAll(family, glyphs).get('0042')![0].layers[0]
    expect([lc.fit, lc.matrix]).toEqual([null, null])
  })

  it('says where a flattened variant puts its components', () => {
    const plain = place({ xOffset: 250 })
    expect(plain.flat).toBeNull()
    const { path, whole, flat } = place({ xOffset: 250 }, { flattenLayers: true })
    expect(flat).not.toBeNull()
    // The component comes last in the flattened path.
    const mine = coords(through(path, flat!))
    const all = coords(whole)
    const tail = all.slice(all.length - mine.length)
    for (let i = 0; i < mine.length; i++) expect(Math.abs(mine[i] - tail[i])).toBeLessThan(1e-6)
  })
})

describe('component frame', () => {
  it('reads the anchor on the component box and the frame on the outline', () => {
    const { frame, path } = place({ layerAnchor: 8, layerBounds: BoundsMode.Outside })
    const b = pathBBox(path)
    expect([frame.bounds.x, frame.bounds.y, frame.bounds.width, frame.bounds.height]).toEqual([b.x, b.y, b.width, b.height])
    expect(frame.anchor).toEqual([frame.anchorBox.x + frame.anchorBox.width, frame.anchorBox.y + frame.anchorBox.height])
    expect(frame.turn).toBe(1)
    expect(place({ mirror: MirrorMode.Horizontal }).frame.turn).toBe(-1)
    expect(place({ mirror: MirrorMode.Both }).frame.turn).toBe(1)
  })

  it('moves by the offsets, on whole units', () => {
    const start = place({ xOffset: 10.5, yOffset: 4 })
    const edit = moveEdit(start.layer, 30.4, -12.6)
    expect(edit).toEqual({ xOffset: 41, yOffset: -9 })
    const moved = place({ ...start.layer, ...edit })
    expect(moved.frame.bounds.x - start.frame.bounds.x).toBeCloseTo(30.5)
    expect(moved.frame.bounds.y - start.frame.bounds.y).toBeCloseTo(-13)
    // One axis only: the other offset is left as it was, fraction included.
    expect(moveEdit(start.layer, 30.4, -12.6, true)).toEqual({ xOffset: 41, yOffset: 4 })
    expect(moveEdit(start.layer, 3, -12.6, true)).toEqual({ xOffset: 10.5, yOffset: -9 })
  })

  it('scales from the anchor: the corner follows the pointer and nothing else changes', () => {
    for (const layerBounds of [BoundsMode.Outside, BoundsMode.Inside, BoundsMode.MixedVertical])
      for (const layerAnchor of [0, 4, 7])
        for (const mirror of [MirrorMode.None, MirrorMode.Horizontal]) {
          const start = place({ layerBounds, layerAnchor, mirror, layerScaleFactor: 0.8, rotation: 15 })
          const corners = boxCorners(start.frame.bounds)
          const corner = corners[2]
          const a = start.frame.anchor
          // Pull the corner half as far again from the anchor.
          const to: Pt = [a[0] + (corner[0] - a[0]) * 1.5, a[1] + (corner[1] - a[1]) * 1.5]
          const edit = scaleEdit(start.layer, start.frame, corner, corners[0], to)
          expect(edit).toEqual({ layerScale: ScaleMode.Manual, layerScaleFactor: 1.2 })
          const after = place({ ...start.layer, ...edit })
          near(after.frame.anchor, a, 1e-6)
          near(boxCorners(after.frame.bounds)[2], to, 1e-6)
        }
  })

  it('scales from the opposite corner when asked, or when the corner is the anchor', () => {
    // Glyph bounds, anchored by the top left: that corner of the frame is the anchor.
    const start = place({ layerBounds: BoundsMode.Inside, layerAnchor: 0 })
    const corners = boxCorners(start.frame.bounds)
    near(corners[0], start.frame.anchor, 1e-6)
    const to: Pt = [corners[2][0] + (corners[0][0] - corners[2][0]) * 2, corners[2][1] + (corners[0][1] - corners[2][1]) * 2]
    const edit = scaleEdit(start.layer, start.frame, corners[0], corners[2], to)
    expect(edit.layerScaleFactor).toBe(2)
    const after = place({ ...start.layer, ...edit })
    near(boxCorners(after.frame.bounds)[2], corners[2], 1)
    near(boxCorners(after.frame.bounds)[0], to, 1)

    // Asked for (Alt): the bottom right corner dragged, the top left one stays.
    const centred = place({ layerAnchor: 4 })
    const cc = boxCorners(centred.frame.bounds)
    const target: Pt = [cc[0][0] + (cc[2][0] - cc[0][0]) * 0.5, cc[0][1] + (cc[2][1] - cc[0][1]) * 0.5]
    const half = scaleEdit(centred.layer, centred.frame, cc[2], cc[0], target, true)
    expect(half.layerScaleFactor).toBe(0.5)
    const shrunk = place({ ...centred.layer, ...half })
    near(boxCorners(shrunk.frame.bounds)[0], cc[0], 1)
    near(boxCorners(shrunk.frame.bounds)[2], target, 1)
  })

  it('makes a component that follows another scale mode a manual one', () => {
    const start = place({ layerScale: ScaleMode.None, layerScaleFactor: 3 })
    expect(layerScaleOf(start.layer)).toBe(1)
    const corners = boxCorners(start.frame.bounds)
    const a = start.frame.anchor
    const to: Pt = [a[0] + (corners[1][0] - a[0]) * 2, a[1] + (corners[1][1] - a[1]) * 2]
    expect(scaleEdit(start.layer, start.frame, corners[1], corners[3], to)).toEqual({ layerScale: ScaleMode.Manual, layerScaleFactor: 2 })
  })

  it('keeps a factor a drag can come back from', () => {
    const start = place({})
    const corners = boxCorners(start.frame.bounds)
    // Dragged through the anchor to the other side.
    const a = start.frame.anchor
    const to: Pt = [a[0] - (corners[2][0] - a[0]), a[1] - (corners[2][1] - a[1])]
    expect(scaleEdit(start.layer, start.frame, corners[2], corners[0], to).layerScaleFactor).toBe(0.01)
  })

  it('turns around the rotation pivot, the way the pointer went', () => {
    for (const mirror of [MirrorMode.None, MirrorMode.Horizontal, MirrorMode.Vertical, MirrorMode.Both])
      for (const rotationAnchor of [4, 6]) {
        const start = place({ mirror, rotationAnchor, rotation: 10, layerScaleFactor: 0.7 })
        const p = start.frame.pivot
        // A quarter turn clockwise on screen (Y down): from the right of the pivot to under it.
        const edit = rotateEdit(start.layer, start.frame, [p[0] + 50, p[1]], [p[0], p[1] + 50])
        const after = place({ ...start.layer, ...edit })
        near(after.frame.pivot, p, 1e-6)
        // Every point of the outline made that quarter turn around the pivot.
        const quarter = (x: number, y: number): Pt => [p[0] - (y - p[1]), p[1] + (x - p[0])]
        const before = coords(mirror === MirrorMode.Horizontal || mirror === MirrorMode.Vertical ? reversePath(start.path) : start.path)
        const now = coords(mirror === MirrorMode.Horizontal || mirror === MirrorMode.Vertical ? reversePath(after.path) : after.path)
        expect(now.length).toBe(before.length)
        for (let i = 0; i < before.length; i += 2) near([now[i], now[i + 1]], quarter(before[i], before[i + 1]), 1e-6)
      }
  })

  it('rounds the angle, snaps it to steps and keeps it within half a turn', () => {
    const start = place({ rotation: 170 })
    const p = start.frame.pivot
    const at = (deg: number): Pt => [p[0] + 80 * Math.cos((deg * Math.PI) / 180), p[1] + 80 * Math.sin((deg * Math.PI) / 180)]
    expect(rotateEdit(start.layer, start.frame, at(0), at(12.34))).toEqual({ rotation: -177.7 })
    expect(rotateEdit(start.layer, start.frame, at(0), at(12.34), 15)).toEqual({ rotation: 180 })
    expect(rotateEdit(start.layer, start.frame, at(0), at(-172), 15)).toEqual({ rotation: 0 })
  })

  it('finds the pivot where the matrix puts it', () => {
    // Top left pivot of a component placed by its top left: its anchor.
    const { frame } = place({ rotationAnchor: 0, layerBounds: BoundsMode.Outside, layerAnchor: 0, contextAnchor: 0, xOffset: 40, yOffset: 60, rotation: 33 })
    near(frame.pivot, frame.anchor, 1e-6)
  })

  it('turns around the middle of the frame when the component box follows the outline', () => {
    const start = place({ rotationAnchor: 0, layerBounds: BoundsMode.Inside, layerAnchor: 7 })
    const b = start.frame.bounds
    near(start.frame.pivot, [b.x + b.width / 2, b.y + b.height / 2], 1e-6)
    const edit = rotateEdit(start.layer, start.frame, [b.x + b.width, b.y + b.height / 2], [b.x + b.width / 2, b.y + b.height])
    expect(edit).toEqual({ rotation: 90 })
    // The turned outline sits on the same anchor.
    near(place({ ...start.layer, ...edit }).frame.anchor, start.frame.anchor, 1e-6)
  })
})
