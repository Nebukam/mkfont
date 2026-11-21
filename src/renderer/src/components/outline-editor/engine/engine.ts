// ============================================================
// Outline editor engine: the scene (Paper.js) and the gestures on it. No React here.
//
// Paper keeps the outline as contours of points with two handles each, draws it with its
// selection (anchors, handles), and does the curve maths (nearest point, splitting). This
// file adds what an editor needs on top: what a press, a drag and a key do.
//
// Coordinates: the scene is in font units (Y down). Pointer positions come in as CSS pixels
// of the canvas and go through the view's framing.
// ============================================================

// The import is named P: `paper` is the library's global types namespace (paper.Path…).
import P from 'paper/dist/paper-core'
import type { Affine } from '../../../core/affine'
import {
  BOX_HANDLES,
  boxScale,
  contoursToPath,
  isSmoothNode,
  smoothedHandles,
  snapPoint,
  storageDecimals,
  type Box,
  type Contour,
  type SnapTargets
} from './geometry'

/** What an edit did, for its name in the history. */
export type EditKind = 'move' | 'handle' | 'insert' | 'delete' | 'convert' | 'transform' | 'reverse' | 'deleteContour'
export type EditorMode = 'select' | 'transform'

/** Font units to pixels: `screen = origin + font × scale` (the glyph canvases' framing). */
export interface ViewFraming {
  scale: number
  ox: number
  oy: number
}

export interface SelectionInfo {
  /** Selected points, and points in all. */
  count: number
  total: number
  /** Contours with a selected point. */
  contours: number
  /** Position shared by the selected points: null with none selected, undefined when they differ. */
  x: number | null | undefined
  y: number | null | undefined
  /** Whether the selected points are smooth: undefined when mixed or none. */
  smooth: boolean | undefined
}

export interface Modifiers {
  shift?: boolean
  alt?: boolean
  ctrl?: boolean
}

export interface EngineSource {
  /** The outline in font units (see `toEditSpace`). */
  path: string
  /** Font units back to the space the outline is stored in. */
  inverse: Affine
  /** The fit matrix the outline was loaded through (for the stored precision). */
  matrix: Affine
}

export interface EngineCallbacks {
  /**
   * An edit is done: `path` is the outline in its stored space ('' when nothing is left).
   * `merge` names a run of small edits (nudges, typed positions) that make one history step.
   */
  onCommit: (path: string, kind: EditKind, merge?: string) => void
  onSelection?: (info: SelectionInfo) => void
  onMode?: (mode: EditorMode) => void
}

export interface EngineColors {
  /** Fill of the outline being edited. */
  fill: string
  /** Outline, anchors and handles. */
  line: string
  /** Marquee, transform box and snap lines. */
  accent: string
}

export interface OutlineEngine {
  load(source: EngineSource | null): void
  setView(framing: ViewFraming, width: number, height: number): void
  setColors(colors: EngineColors): void
  setSnap(targets: SnapTargets | null, snapToPoints: boolean): void
  setMode(mode: EditorMode): void
  readonly mode: EditorMode
  /** Pointer events, in CSS pixels of the canvas. */
  pointerDown(x: number, y: number, mods?: Modifiers): void
  pointerMove(x: number, y: number, mods?: Modifiers): void
  pointerUp(x: number, y: number, mods?: Modifiers): void
  doubleClick(x: number, y: number): void
  /** A press was taken away (pointer capture lost): put things back. */
  cancel(): boolean
  /** CSS cursor for what is under the pointer. */
  cursorAt(x: number, y: number): string
  /** A key, as a shortcut spec ("Shift+ArrowLeft"). True when the editor used it. */
  keyDown(spec: string): boolean
  keyUp(spec: string): void
  /** Finish what a held key started (focus left the canvas). */
  flush(): void
  selectAll(): void
  deselect(): void
  selectContours(): void
  deleteSelected(): void
  toggleSmooth(): void
  reverseContours(): void
  deleteContours(): void
  /** Put every selected point at this x or y (font units, Y down). */
  setPosition(axis: 'x' | 'y', value: number, merge: boolean): void
  selection(): SelectionInfo
  /** The outline as it would be stored now. */
  serialize(): string
  destroy(): void
}

type Seg = paper.Segment
type Pt = paper.Point
type HandleName = 'handleIn' | 'handleOut'

/** A segment's numbers: point, handle in, handle out. */
type Saved = [number, number, number, number, number, number]

type Hit =
  | { type: 'box'; handle: readonly [number, number] }
  | { type: 'rotate' }
  | { type: 'inside' }
  | { type: 'handle'; seg: Seg; which: HandleName }
  | { type: 'anchor'; seg: Seg }
  | { type: 'curve'; location: paper.CurveLocation }

type Gesture =
  | { type: 'move'; start: Pt; grabbed: Seg | null; saved: Map<Seg, Saved>; moved: boolean; onClick: { seg: Seg; then: 'solo' | 'drop' } | null }
  | { type: 'handle'; start: Pt; seg: Seg; which: HandleName; smooth: boolean; saved: Map<Seg, Saved>; moved: boolean }
  | { type: 'marquee'; start: Pt; base: Set<Seg>; moved: boolean; end: Pt }
  | { type: 'scale'; start: Pt; handle: readonly [number, number]; box: Box; saved: Map<Seg, Saved>; moved: boolean }
  | { type: 'rotate'; start: Pt; cx: number; cy: number; saved: Map<Seg, Saved>; moved: boolean }

/** Pixels around a point, a handle or the outline that still count as on it. */
const HIT_PX = 7
/** Half the square drawn for a point. */
const ANCHOR_PX = 4
/** A press that moves less than this is a click. */
const DRAG_PX = 3
const SNAP_PX = 6
/** The rotate knob sits this far above the transform box. */
const KNOB_PX = 22
const ARROWS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }

export function createOutlineEngine(target: HTMLCanvasElement | { width: number; height: number }, cb: EngineCallbacks): OutlineEngine {
  const scope = new P.PaperScope()
  if ('getContext' in target) scope.setup(target)
  else scope.setup(new P.Size(target.width, target.height))
  scope.settings.handleSize = 7
  const main = scope.project.activeLayer
  const ui = new P.Layer()
  scope.project.addLayer(ui)
  main.activate()

  let compound: paper.CompoundPath | null = null
  let inverse: Affine | null = null
  let decimals = 3
  /** The outline as stored when it was loaded or last committed: an edit that ends there is no edit. */
  let stored = ''
  let framing: ViewFraming = { scale: 1, ox: 0, oy: 0 }
  let mode: EditorMode = 'select'
  let colors: EngineColors | null = null
  let snapTargets: SnapTargets | null = null
  let snapToPoints = false
  let gesture: Gesture | null = null
  let snapLines: { x: number | null; y: number | null } = { x: null, y: null }
  /** Arrow keys held: the nudges commit together when the key is released. */
  let nudging = false
  /** Changes with the selection: small edits merge only while it is the same. */
  let epoch = 0
  const selected = new Set<Seg>()

  const paths = (): paper.Path[] => (compound ? (compound.children as paper.Path[]) : [])
  const px = (): number => 1 / framing.scale
  const toFont = (x: number, y: number): Pt => new P.Point((x - framing.ox) / framing.scale, (y - framing.oy) / framing.scale)

  // ---- Scene ----

  function contours(): Contour[] {
    return paths().map((p) => ({
      closed: p.closed,
      nodes: p.segments.map((s) => ({ x: s.point.x, y: s.point.y, inX: s.handleIn.x, inY: s.handleIn.y, outX: s.handleOut.x, outY: s.handleOut.y }))
    }))
  }

  function serialize(): string {
    return inverse ? contoursToPath(contours(), inverse, decimals) : ''
  }

  const topology = (): string => paths().map((p) => `${p.segments.length}${p.closed ? 'c' : 'o'}`).join(',')

  function selectionIndices(): [number, number][] {
    const out: [number, number][] = []
    paths().forEach((p, pi) => p.segments.forEach((s, si) => selected.has(s) && out.push([pi, si])))
    return out
  }

  /**
   * Show a point as selected or not. A selected point shows its handles too, except under
   * the transform box: there the points are moved as a whole and their handles are not
   * for grabbing.
   */
  function mark(s: Seg, on: boolean): void {
    s.selected = false
    if (!on) return
    if (mode === 'transform') s.point.selected = true
    else s.selected = true
  }

  function style(): void {
    if (!compound) return
    if (colors) compound.fillColor = new P.Color(colors.fill)
    compound.fillRule = 'nonzero'
    // A selected path shows its outline and every anchor.
    for (const p of paths()) p.selected = true
    for (const p of paths()) for (const s of p.segments) mark(s, selected.has(s))
  }

  function load(source: EngineSource | null): void {
    const keep = selectionIndices()
    const before = compound ? topology() : null
    gesture = null
    nudging = false
    snapLines = { x: null, y: null }
    selected.clear()
    compound?.remove()
    compound = null
    inverse = null
    if (source) {
      scope.activate()
      main.activate()
      compound = new P.CompoundPath(source.path)
      inverse = source.inverse
      decimals = storageDecimals(source.matrix)
      // The same contours as before (the editor's own edit coming back, an undo of a move):
      // the selection stays on the same points.
      if (before !== null && before === topology()) {
        const ps = paths()
        for (const [pi, si] of keep) selected.add(ps[pi].segments[si])
      }
    }
    stored = serialize()
    style()
    // The same points selected: a run of small edits (nudges) goes on as one history step.
    if (selected.size && selected.size === keep.length) geometryChanged()
    else selectionChanged()
  }

  function applyColors(): void {
    if (!colors) return
    main.selectedColor = new P.Color(colors.line)
    ui.selectedColor = new P.Color(colors.accent)
    if (compound) compound.fillColor = new P.Color(colors.fill)
    drawUi()
  }

  // ---- Selection ----

  function info(): SelectionInfo {
    let x: number | null | undefined = null
    let y: number | null | undefined = null
    let smooth: boolean | undefined
    let first = true
    const touched = new Set<paper.Path>()
    for (const s of selected) {
      touched.add(s.path)
      const sm = isSmoothNode({ inX: s.handleIn.x, inY: s.handleIn.y, outX: s.handleOut.x, outY: s.handleOut.y })
      if (first) {
        x = s.point.x
        y = s.point.y
        smooth = sm
        first = false
      } else {
        if (x !== undefined && Math.abs((x as number) - s.point.x) > 1e-6) x = undefined
        if (y !== undefined && Math.abs((y as number) - s.point.y) > 1e-6) y = undefined
        if (smooth !== sm) smooth = undefined
      }
    }
    return { count: selected.size, total: paths().reduce((n, p) => n + p.segments.length, 0), contours: touched.size, x, y, smooth }
  }

  function selectionChanged(): void {
    epoch++
    if (mode === 'transform' && selected.size < 2 && !gesture) setMode('select')
    drawUi()
    cb.onSelection?.(info())
  }

  /** The points moved, the selection did not: the position shown follows. */
  function geometryChanged(): void {
    drawUi()
    cb.onSelection?.(info())
  }

  function setSelection(segs: Iterable<Seg>): void {
    const next = new Set(segs)
    for (const s of selected) if (!next.has(s)) mark(s, false)
    for (const s of next) mark(s, true)
    selected.clear()
    for (const s of next) selected.add(s)
    selectionChanged()
  }

  // ---- Hit testing ----

  function selectionBox(): Box | null {
    if (selected.size < 2) return null
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (const s of selected) {
      x0 = Math.min(x0, s.point.x)
      y0 = Math.min(y0, s.point.y)
      x1 = Math.max(x1, s.point.x)
      y1 = Math.max(y1, s.point.y)
    }
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
  }

  function hit(pt: Pt): Hit | null {
    const tol = HIT_PX * px()
    if (mode === 'transform') {
      const box = selectionBox()
      if (box) {
        if (pt.getDistance(new P.Point(box.x + box.width / 2, box.y - KNOB_PX * px())) <= tol) return { type: 'rotate' }
        for (const h of BOX_HANDLES) {
          if (pt.getDistance(new P.Point(box.x + box.width * h[0], box.y + box.height * h[1])) <= tol) return { type: 'box', handle: h }
        }
      }
    }
    let best: Hit | null = null
    // Right on a point's square: the point, also when a short handle lies under it.
    let bestD = ANCHOR_PX * px()
    for (const p of paths()) {
      for (const seg of p.segments) {
        const d = seg.point.getDistance(pt)
        if (d <= bestD) {
          best = { type: 'anchor', seg }
          bestD = d
        }
      }
    }
    if (best) return best
    bestD = tol
    for (const seg of mode === 'transform' ? [] : selected) {
      for (const which of ['handleIn', 'handleOut'] as const) {
        const h = seg[which]
        if (h.isZero()) continue
        const d = seg.point.add(h).getDistance(pt)
        if (d <= bestD) {
          best = { type: 'handle', seg, which }
          bestD = d
        }
      }
    }
    // Near a handle and a point: the nearer one.
    for (const p of paths()) {
      for (const seg of p.segments) {
        const d = seg.point.getDistance(pt)
        if (d <= bestD) {
          best = { type: 'anchor', seg }
          bestD = d
        }
      }
    }
    if (best) return best
    for (const p of paths()) {
      if (p.segments.length < 2) continue
      const location = p.getNearestLocation(pt)
      if (location && location.distance <= bestD) {
        best = { type: 'curve', location }
        bestD = location.distance
      }
    }
    if (best) return best
    if (mode === 'transform') {
      const box = selectionBox()
      if (box && pt.x >= box.x && pt.x <= box.x + box.width && pt.y >= box.y && pt.y <= box.y + box.height) return { type: 'inside' }
    }
    return null
  }

  // ---- Saving and restoring points during a gesture ----

  function save(): Map<Seg, Saved> {
    const m = new Map<Seg, Saved>()
    for (const p of paths()) for (const s of p.segments) m.set(s, [s.point.x, s.point.y, s.handleIn.x, s.handleIn.y, s.handleOut.x, s.handleOut.y])
    return m
  }

  function restore(saved: Map<Seg, Saved>): void {
    for (const [s, v] of saved) {
      s.point = new P.Point(v[0], v[1])
      s.handleIn = new P.Point(v[2], v[3])
      s.handleOut = new P.Point(v[4], v[5])
    }
  }

  function commit(kind: EditKind, merge?: string): void {
    const path = serialize()
    if (path === stored) return
    stored = path
    cb.onCommit(path, kind, merge)
  }

  // ---- Overlay: marquee, snap lines, transform box ----

  function drawUi(): void {
    ui.removeChildren()
    if (!colors) return
    const accent = new P.Color(colors.accent)
    const line = (item: paper.Item, dash = false): void => {
      item.strokeColor = accent
      item.strokeWidth = 1
      item.strokeScaling = false
      if (dash) item.dashArray = [4, 3]
      ui.addChild(item)
    }
    if (gesture?.type === 'marquee' && gesture.moved) {
      const r = new P.Path.Rectangle({ from: gesture.start, to: gesture.end, insert: false })
      r.fillColor = new P.Color(colors.accent)
      r.fillColor.alpha = 0.1
      line(r)
    }
    const span = 100000
    if (snapLines.x !== null) line(new P.Path.Line({ from: [snapLines.x, -span], to: [snapLines.x, span], insert: false }))
    if (snapLines.y !== null) line(new P.Path.Line({ from: [-span, snapLines.y], to: [span, snapLines.y], insert: false }))
    const box = mode === 'transform' ? selectionBox() : null
    if (box) {
      line(new P.Path.Rectangle({ point: [box.x, box.y], size: [box.width, box.height], insert: false }), true)
      const half = 3.5 * px()
      for (const h of BOX_HANDLES) {
        const cx = box.x + box.width * h[0]
        const cy = box.y + box.height * h[1]
        const sq = new P.Path.Rectangle({ point: [cx - half, cy - half], size: [half * 2, half * 2], insert: false })
        sq.fillColor = accent
        ui.addChild(sq)
      }
      const cx = box.x + box.width / 2
      const ky = box.y - KNOB_PX * px()
      line(new P.Path.Line({ from: [cx, box.y], to: [cx, ky], insert: false }))
      const knob = new P.Path.Circle({ center: [cx, ky], radius: 4 * px(), insert: false })
      knob.fillColor = accent
      ui.addChild(knob)
    }
  }

  // ---- Gestures ----

  function snapCandidates(): SnapTargets | null {
    if (!snapTargets && !snapToPoints) return null
    const xs = [...(snapTargets?.xs ?? [])]
    const ys = [...(snapTargets?.ys ?? [])]
    if (snapToPoints) {
      for (const p of paths())
        for (const s of p.segments)
          if (!selected.has(s)) {
            xs.push(s.point.x)
            ys.push(s.point.y)
          }
    }
    return { xs, ys }
  }

  function pointerDown(x: number, y: number, mods: Modifiers = {}): void {
    flush()
    if (!compound) return
    const pt = toFont(x, y)
    const h = hit(pt)
    if (h?.type === 'box') {
      gesture = { type: 'scale', start: pt, handle: h.handle, box: selectionBox()!, saved: save(), moved: false }
    } else if (h?.type === 'rotate') {
      const box = selectionBox()!
      gesture = { type: 'rotate', start: pt, cx: box.x + box.width / 2, cy: box.y + box.height / 2, saved: save(), moved: false }
    } else if (h?.type === 'inside') {
      gesture = { type: 'move', start: pt, grabbed: null, saved: save(), moved: false, onClick: null }
    } else if (h?.type === 'handle') {
      const s = h.seg
      const smooth = isSmoothNode({ inX: s.handleIn.x, inY: s.handleIn.y, outX: s.handleOut.x, outY: s.handleOut.y })
      gesture = { type: 'handle', start: pt, seg: s, which: h.which, smooth, saved: save(), moved: false }
    } else if (h?.type === 'anchor') {
      const seg = h.seg
      // A press on a selected point may start a drag of them all (Shift then holds an axis):
      // what a plain click does to the selection waits for the release.
      let onClick: { seg: Seg; then: 'solo' | 'drop' } | null = null
      if (!selected.has(seg)) setSelection(mods.shift ? [...selected, seg] : [seg])
      else if (mods.shift) onClick = { seg, then: 'drop' }
      else if (selected.size > 1) onClick = { seg, then: 'solo' }
      gesture = { type: 'move', start: pt, grabbed: seg, saved: save(), moved: false, onClick }
    } else if (h?.type === 'curve') {
      const c = h.location.curve
      const ends = [c.segment1, c.segment2]
      if (mods.shift) setSelection([...selected, ...ends])
      else if (!ends.every((s) => selected.has(s))) setSelection(ends)
      gesture = { type: 'move', start: pt, grabbed: null, saved: save(), moved: false, onClick: null }
    } else {
      gesture = { type: 'marquee', start: pt, end: pt, base: mods.shift ? new Set(selected) : new Set(), moved: false }
    }
  }

  function pointerMove(x: number, y: number, mods: Modifiers = {}): void {
    const g = gesture
    if (!g) return
    const pt = toFont(x, y)
    if (!g.moved) {
      if (pt.getDistance(g.start) < DRAG_PX * px()) return
      g.moved = true
    }
    switch (g.type) {
      case 'move': {
        let dx = pt.x - g.start.x
        let dy = pt.y - g.start.y
        if (mods.shift) {
          if (Math.abs(dx) >= Math.abs(dy)) dy = 0
          else dx = 0
        }
        snapLines = { x: null, y: null }
        const targets = g.grabbed && !mods.ctrl ? snapCandidates() : null
        if (targets && g.grabbed) {
          const from = g.saved.get(g.grabbed)!
          const s = snapPoint(from[0] + dx, from[1] + dy, targets, SNAP_PX * px())
          // An axis the drag is held on stays held.
          if (!(mods.shift && dx === 0)) {
            dx = s.x - from[0]
            snapLines.x = s.snapX
          }
          if (!(mods.shift && dy === 0)) {
            dy = s.y - from[1]
            snapLines.y = s.snapY
          }
        }
        for (const s of selected) {
          const v = g.saved.get(s)
          if (v) s.point = new P.Point(v[0] + dx, v[1] + dy)
        }
        break
      }
      case 'handle': {
        const s = g.seg
        const v = new P.Point(pt.x - s.point.x, pt.y - s.point.y)
        s[g.which] = v
        const other: HandleName = g.which === 'handleIn' ? 'handleOut' : 'handleIn'
        const from = g.saved.get(s)!
        const ox = other === 'handleIn' ? from[2] : from[4]
        const oy = other === 'handleIn' ? from[3] : from[5]
        // A smooth point keeps its other handle in line, at its own length; Alt breaks it.
        if (g.smooth && !mods.alt && !v.isZero()) {
          const len = Math.hypot(ox, oy)
          s[other] = v.normalize(-len)
        } else s[other] = new P.Point(ox, oy)
        break
      }
      case 'marquee': {
        g.end = pt
        const r = new P.Rectangle(g.start, pt)
        const next = new Set(g.base)
        for (const p of paths()) for (const s of p.segments) if (r.contains(s.point)) next.add(s)
        // Not a new selection yet for small edits' sake: the release settles it.
        for (const s of selected) if (!next.has(s)) mark(s, false)
        for (const s of next) mark(s, true)
        selected.clear()
        for (const s of next) selected.add(s)
        break
      }
      case 'scale': {
        const { sx, sy, pivotX, pivotY } = boxScale(g.box, g.handle, pt.x, pt.y, { fromCentre: mods.alt, uniform: mods.shift })
        for (const s of selected) {
          const v = g.saved.get(s)
          if (!v) continue
          s.point = new P.Point(pivotX + (v[0] - pivotX) * sx, pivotY + (v[1] - pivotY) * sy)
          s.handleIn = new P.Point(v[2] * sx, v[3] * sy)
          s.handleOut = new P.Point(v[4] * sx, v[5] * sy)
        }
        break
      }
      case 'rotate': {
        let a = Math.atan2(pt.y - g.cy, pt.x - g.cx) - Math.atan2(g.start.y - g.cy, g.start.x - g.cx)
        if (mods.shift) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12)
        const cos = Math.cos(a)
        const sin = Math.sin(a)
        const rot = (vx: number, vy: number): Pt => new P.Point(vx * cos - vy * sin, vx * sin + vy * cos)
        for (const s of selected) {
          const v = g.saved.get(s)
          if (!v) continue
          const p = rot(v[0] - g.cx, v[1] - g.cy)
          s.point = new P.Point(g.cx + p.x, g.cy + p.y)
          s.handleIn = rot(v[2], v[3])
          s.handleOut = rot(v[4], v[5])
        }
        break
      }
    }
    if (g.type === 'marquee') drawUi()
    else geometryChanged()
  }

  function pointerUp(x: number, y: number, mods: Modifiers = {}): void {
    const g = gesture
    if (!g) return
    if (g.moved) pointerMove(x, y, mods)
    gesture = null
    snapLines = { x: null, y: null }
    if (g.type === 'marquee') {
      if (g.moved) selectionChanged()
      else if (!mods.shift) setSelection([])
      else drawUi()
      return
    }
    if (!g.moved) {
      if (g.type === 'move' && g.onClick) {
        const { seg, then } = g.onClick
        setSelection(then === 'solo' ? [seg] : [...selected].filter((s) => s !== seg))
      } else drawUi()
      return
    }
    drawUi()
    commit(g.type === 'move' ? 'move' : g.type === 'handle' ? 'handle' : 'transform')
  }

  function cancel(): boolean {
    const g = gesture
    if (!g) return false
    gesture = null
    snapLines = { x: null, y: null }
    if (g.type === 'marquee') setSelection(g.base)
    else {
      restore(g.saved)
      geometryChanged()
    }
    return true
  }

  function doubleClick(x: number, y: number): void {
    if (!compound) return
    const h = hit(toFont(x, y))
    if (h?.type === 'anchor') {
      setSelection([h.seg])
      toggleSmooth()
    } else if (h?.type === 'curve') {
      const { curve, time } = h.location
      // On a point already: nothing to add.
      if (time < 1e-4 || time > 1 - 1e-4) return
      const added = curve.divideAtTime(time)
      if (!added) return
      style()
      setSelection([added.segment1])
      commit('insert')
    }
  }

  function cursorAt(x: number, y: number): string {
    if (gesture || !compound) return 'default'
    const h = hit(toFont(x, y))
    if (!h) return 'default'
    if (h.type === 'rotate') return 'grab'
    if (h.type === 'inside') return 'move'
    if (h.type === 'box') {
      const [hx, hy] = h.handle
      if (hx === 0.5) return 'ns-resize'
      if (hy === 0.5) return 'ew-resize'
      return hx === hy ? 'nwse-resize' : 'nesw-resize'
    }
    return 'pointer'
  }

  // ---- Actions ----

  function setMode(next: EditorMode): void {
    if (next === 'transform' && selected.size < 2) next = 'select'
    if (mode === next) return
    mode = next
    for (const s of selected) mark(s, true)
    drawUi()
    cb.onMode?.(mode)
  }

  function selectAll(): void {
    setSelection(paths().flatMap((p) => p.segments))
  }

  const touchedPaths = (): paper.Path[] => paths().filter((p) => p.segments.some((s) => selected.has(s)))

  function selectContours(): void {
    setSelection(touchedPaths().flatMap((p) => p.segments))
  }

  function removePath(p: paper.Path): void {
    for (const s of p.segments) selected.delete(s)
    p.remove()
  }

  function deleteSelected(): void {
    if (!selected.size) return
    for (const s of [...selected]) {
      const p = s.path
      selected.delete(s)
      s.remove()
      // Less than two points is no contour.
      if (p && p.segments.length < 2) removePath(p)
    }
    style()
    selectionChanged()
    commit('delete')
  }

  function deleteContours(): void {
    const touched = touchedPaths()
    if (!touched.length) return
    for (const p of touched) removePath(p)
    style()
    selectionChanged()
    commit('deleteContour')
  }

  function reverseContours(): void {
    const touched = touchedPaths()
    if (!touched.length) return
    for (const p of touched) p.reverse()
    style()
    geometryChanged()
    commit('reverse')
  }

  function toggleSmooth(): void {
    if (!selected.size) return
    const handles = (s: Seg): { inX: number; inY: number; outX: number; outY: number } => ({
      inX: s.handleIn.x,
      inY: s.handleIn.y,
      outX: s.handleOut.x,
      outY: s.handleOut.y
    })
    // Any corner among them: all become smooth. All smooth: all become corners.
    const toSmooth = [...selected].some((s) => !isSmoothNode(handles(s)))
    for (const s of selected) {
      if (!toSmooth) {
        s.clearHandles()
        continue
      }
      if (isSmoothNode(handles(s), 0.01)) continue
      const aligned = smoothedHandles(handles(s))
      if (aligned) {
        s.handleIn = new P.Point(aligned.inX, aligned.inY)
        s.handleOut = new P.Point(aligned.outX, aligned.outY)
      } else s.smooth({ type: 'catmull-rom', factor: 0.5 })
    }
    geometryChanged()
    commit('convert')
  }

  function setPosition(axis: 'x' | 'y', value: number, merge: boolean): void {
    if (!selected.size || !isFinite(value)) return
    for (const s of selected) s.point = axis === 'x' ? new P.Point(value, s.point.y) : new P.Point(s.point.x, value)
    geometryChanged()
    commit('move', merge ? `${axis}:${epoch}` : undefined)
  }

  // ---- Keys ----

  function flush(): void {
    if (!nudging) return
    nudging = false
    commit('move', `nudge:${epoch}`)
  }

  function keyDown(spec: string): boolean {
    const shift = spec.startsWith('Shift+')
    const arrow = ARROWS[shift ? spec.slice(6) : spec]
    if (arrow) {
      if (!selected.size || gesture) return true
      const step = shift ? 10 : 1
      for (const s of selected) s.point = new P.Point(s.point.x + arrow[0] * step, s.point.y + arrow[1] * step)
      nudging = true
      geometryChanged()
      return true
    }
    if (spec === 'Escape') {
      // One step back at a time; with nothing left to leave, the key is not the editor's.
      if (cancel()) return true
      if (mode === 'transform') setMode('select')
      else if (selected.size) setSelection([])
      else return false
      return true
    }
    if (gesture) return false
    switch (spec) {
      case 'Delete':
      case 'Backspace':
        deleteSelected()
        return true
      case 'Enter':
        toggleSmooth()
        return true
      case 'Ctrl+A':
        selectAll()
        return true
      case 'Ctrl+D':
        setSelection([])
        return true
      case 'C':
        selectContours()
        return true
      case 'R':
        reverseContours()
        return true
      case 'T':
        setMode(mode === 'transform' ? 'select' : 'transform')
        return true
    }
    return false
  }

  function keyUp(spec: string): void {
    const key = spec.startsWith('Shift+') ? spec.slice(6) : spec
    if (ARROWS[key] || key === 'Shift') flush()
  }

  return {
    load,
    setView(next, width, height) {
      framing = next
      const view = scope.view
      if (view.viewSize.width !== width || view.viewSize.height !== height) view.viewSize = new P.Size(width, height)
      view.matrix = new P.Matrix(next.scale, 0, 0, next.scale, next.ox, next.oy)
      // Handles of the transform box keep their size on screen.
      drawUi()
    },
    setColors(next) {
      colors = next
      applyColors()
    },
    setSnap(targets, toPoints) {
      snapTargets = targets
      snapToPoints = toPoints
    },
    setMode,
    get mode() {
      return mode
    },
    pointerDown,
    pointerMove,
    pointerUp,
    doubleClick,
    cancel,
    cursorAt,
    keyDown,
    keyUp,
    flush,
    selectAll,
    deselect: () => setSelection([]),
    selectContours,
    deleteSelected,
    toggleSmooth,
    reverseContours,
    deleteContours,
    setPosition,
    selection: info,
    serialize,
    destroy() {
      scope.project.remove()
    }
  }
}
