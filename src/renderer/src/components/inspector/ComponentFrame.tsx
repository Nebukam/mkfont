// ============================================================
// Components in the glyph view. A click on a component's filled area selects it and
// shows its frame: drag the component to move it, a corner to scale it, the knob to
// turn it. What the drag would set is a draft (shown here and in the component's
// fields) until the release writes it to the document, as one history entry.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FamilyValues, Layer } from '../../types/font'
import { useDocStore, transact } from '../../stores/doc-store'
import { useInspectorStore } from '../../stores/inspector-store'
import { computeFraming } from '../canvas/GlyphCanvas'
import { computeVariant, type VariantComputed } from '../../core/compute'
import { buildFontContext } from '../../core/transform'
import { applyAffine, IDENTITY, invert, multiply, type Affine } from '../../core/affine'
import { boxCorners, layerFrame, moveEdit, rotateEdit, scaleEdit, type LayerEdit, type LayerFrame, type Pt } from '../../core/layer-frame'
import { isEmptyPathContent } from '../../core/model'
import { setLayerValues } from '../../core/ops'
import { formatNumber } from '../ui/fields'
import { cn } from '../../lib/cn'
import { useTranslation } from '../../i18n'

/** The glyph as the view shows it: the computed one, or the one a drag in progress would give. */
export function useShownVariant(unicode: string): VariantComputed | undefined {
  const stored = useDocStore((s) => s.computed.get(unicode)?.[0])
  const draft = useInspectorStore((s) => (s.layerDraft?.key === unicode ? s.layerDraft : null))
  return useMemo(() => {
    if (!draft || !stored) return stored
    const { data, computed, dep } = useDocStore.getState()
    const variant = data?.glyphs.get(unicode)?.variants[0]
    const layer = variant?.layers[draft.index]
    if (!data || !variant || !layer) return stored
    const layers = variant.layers.slice()
    layers[draft.index] = { ...layer, ...draft.values }
    const ctx = buildFontContext(data.family.values, data.family.transforms)
    return computeVariant({ ...variant, layers }, data.family, ctx, dep.layerRefs.get(unicode)?.[0] ?? [], computed)
  }, [draft, stored, unicode])
}

type GestureKind = 'move' | 'scale' | 'rotate'

interface Gesture {
  kind: GestureKind
  index: number
  pointerId: number
  /** Where the press was, in the view (CSS pixels) and in the glyph's layer space. */
  pressed: Pt
  start: Pt
  /** View to layer space, as it was at the press: the drag is read against a still frame. */
  toLayer: Affine
  layer: Layer
  frame: LayerFrame
  /** Scaling: the grabbed corner and the one across. */
  corner: Pt
  opposite: Pt
  moved: boolean
  edit: LayerEdit | null
}

/** A press that slips less than this is a click. */
const SLIP_PX = 3
const HANDLE_PX = 8
/** The handles are easier to grab than they look. */
const GRAB_PX = 16
/** The rotate knob sits this far from the frame (as in the outline editor). */
const KNOB_PX = 22

const HISTORY = { move: 'inspector.history.dragComponent', scale: 'inspector.history.scaleComponent', rotate: 'inspector.history.rotateComponent' } as const

const points = (pts: readonly Pt[]): string => pts.map((p) => `${p[0]},${p[1]}`).join(' ')

function differs(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.width - b.width) + Math.abs(a.height - b.height) > 0.5
}

export function ComponentFrame({
  unicode,
  shown,
  family,
  advance,
  width,
  height,
  zoom
}: {
  unicode: string
  /** The glyph as drawn under this overlay (see useShownVariant). */
  shown: VariantComputed | undefined
  family: FamilyValues
  advance: number
  width: number
  height: number
  zoom: number
}): React.ReactElement | null {
  const { t } = useTranslation()
  const layers = useDocStore((s) => s.data?.glyphs.get(unicode)?.variants[0].layers)
  const selection = useInspectorStore((s) => (s.layerSelection?.key === unicode ? s.layerSelection.index : null))
  const draft = useInspectorStore((s) => (s.layerDraft?.key === unicode ? s.layerDraft : null))
  const svg = useRef<SVGSVGElement>(null)
  const frameEl = useRef<SVGGElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const [dragging, setDragging] = useState<GestureKind | null>(null)

  // Font units to the view's CSS pixels, as GlyphCanvas frames the glyph; a flattened
  // variant moves its placed components once more.
  const toScreen = useMemo(() => {
    const { scale, ox, oy } = computeFraming(family, advance > 0 ? advance : family.width, width, height, 'preview', zoom)
    return multiply([scale, 0, 0, scale, ox, oy], shown?.flatMatrix ?? IDENTITY)
  }, [family, advance, width, height, zoom, shown?.flatMatrix])

  const selected = selection !== null && layers?.[selection] ? shown?.layers[selection] : undefined
  const refBase = useDocStore((s) => (selected?.refKey ? s.computed.get(selected.refKey)?.[0]?.base : undefined))
  const layer = selection !== null && layers?.[selection] ? { ...layers[selection], ...(draft?.index === selection ? draft.values : null) } : null
  const frame = layer && selected?.fit && selected.matrix && refBase ? layerFrame(layer, selected.fit, selected.matrix, refBase) : null

  // Another glyph, or a list that changed under the selection: nothing selected.
  useEffect(() => () => useInspectorStore.getState().selectLayer(null), [unicode])
  const count = layers?.length ?? 0
  const lastCount = useRef(count)
  useEffect(() => {
    if (lastCount.current !== count) useInspectorStore.getState().selectLayer(null)
    lastCount.current = count
  }, [count])

  // The frame takes the keyboard once it shows: the arrow keys nudge the component.
  const framed = frame !== null
  useEffect(() => {
    if (framed) frameEl.current?.focus({ preventScroll: true })
  }, [framed, selection])

  const finish = (commit: boolean): void => {
    const g = gesture.current
    if (!g) return
    gesture.current = null
    if (svg.current?.hasPointerCapture?.(g.pointerId)) svg.current.releasePointerCapture(g.pointerId)
    if (commit && g.moved && g.edit) {
      const edit = g.edit
      transact(t(HISTORY[g.kind], { component: g.layer.characterRef }), (d) => setLayerValues(d, unicode, g.index, edit))
    }
    useInspectorStore.getState().setLayerDraft(null)
    setDragging(null)
  }

  // Escape gives up the drag in progress, before anything else hears the key.
  useEffect(() => {
    if (!dragging) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      finish(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging])

  if (!shown || !layers) return null

  const inView = (e: React.PointerEvent): Pt => {
    const r = svg.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  const begin = (e: React.PointerEvent, kind: GestureKind, index: number, corner = 0): void => {
    // The stored glyph: a press starts with no draft.
    const state = useDocStore.getState()
    const l = state.data?.glyphs.get(unicode)?.variants[0].layers[index]
    const lc = state.computed.get(unicode)?.[0]?.layers[index]
    const base = lc?.refKey ? state.computed.get(lc.refKey)?.[0]?.base : undefined
    const toLayer = invert(toScreen)
    if (!l || !lc?.fit || !lc.matrix || !base || !toLayer) return
    const f = layerFrame(l, lc.fit, lc.matrix, base)
    const corners = boxCorners(f.bounds)
    const pressed = inView(e)
    gesture.current = {
      kind,
      index,
      pointerId: e.pointerId,
      pressed,
      start: applyAffine(toLayer, pressed[0], pressed[1]),
      toLayer,
      layer: l,
      frame: f,
      corner: corners[corner],
      opposite: corners[(corner + 2) % 4],
      moved: false,
      edit: null
    }
    svg.current?.setPointerCapture?.(e.pointerId)
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (e.button !== 0 || gesture.current) return
    // Focus goes to the frame (or stays where it was), not to the page.
    e.preventDefault()
    const part = (e.target as Element).closest<SVGElement>('[data-part]')
    const store = useInspectorStore.getState()
    switch (part?.dataset.part) {
      case 'layer': {
        const index = Number(part.dataset.index)
        if (index !== selection) store.selectLayer({ key: unicode, index })
        else frameEl.current?.focus({ preventScroll: true })
        begin(e, 'move', index)
        break
      }
      case 'body':
        if (selection !== null) begin(e, 'move', selection)
        frameEl.current?.focus({ preventScroll: true })
        break
      case 'corner':
        if (selection !== null) begin(e, 'scale', selection, Number(part.dataset.corner))
        break
      case 'knob':
        if (selection !== null) begin(e, 'rotate', selection)
        break
      default:
        store.selectLayer(null)
    }
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>): void => {
    const g = gesture.current
    if (!g || e.pointerId !== g.pointerId) return
    const at = inView(e)
    if (!g.moved && Math.hypot(at[0] - g.pressed[0], at[1] - g.pressed[1]) < SLIP_PX) return
    if (!g.moved) {
      g.moved = true
      setDragging(g.kind)
    }
    const p = applyAffine(g.toLayer, at[0], at[1])
    const dx = p[0] - g.start[0]
    const dy = p[1] - g.start[1]
    g.edit =
      g.kind === 'move'
        ? moveEdit(g.layer, dx, dy, e.shiftKey)
        : g.kind === 'scale'
          ? scaleEdit(g.layer, g.frame, g.corner, g.opposite, [g.corner[0] + dx, g.corner[1] + dy], e.altKey)
          : rotateEdit(g.layer, g.frame, g.start, p, e.shiftKey ? 15 : 0)
    useInspectorStore.getState().setLayerDraft({ key: unicode, index: g.index, values: g.edit })
  }

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (selection === null || !layer || e.altKey || e.ctrlKey || e.metaKey) return
    if (e.key === 'Escape') {
      e.preventDefault()
      useInspectorStore.getState().selectLayer(null)
      return
    }
    const step = e.shiftKey ? 10 : 1
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
    const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
    if (!dx && !dy) return
    e.preventDefault()
    transact(
      t('inspector.history.dragComponent', { component: layer.characterRef }),
      (d) => setLayerValues(d, unicode, selection, { xOffset: layer.xOffset + dx, yOffset: layer.yOffset + dy }),
      { mergeKey: `lyr:${unicode}:${selection}:nudge` }
    )
  }

  const hover = (index: number | null): void => {
    if (gesture.current) return
    const store = useInspectorStore.getState()
    if (index !== null) store.setLayerFocus({ key: unicode, index })
    else if (store.layerFocus?.key === unicode) store.setLayerFocus(null)
  }

  // ---- The frame, in CSS pixels: handles keep their size at every zoom ----
  const screen = (p: Pt): Pt => applyAffine(toScreen, p[0], p[1])
  let frameParts: React.ReactNode = null
  let body: React.ReactNode = null
  if (frame && layer) {
    const corners = boxCorners(frame.bounds).map(screen)
    const cx = (corners[0][0] + corners[2][0]) / 2
    const cy = (corners[0][1] + corners[2][1]) / 2
    // The knob stands off the top edge; off the bottom one when the top is at the view's edge.
    const edge = (a: Pt, b: Pt): { at: Pt; knob: Pt } => {
      const mx = (a[0] + b[0]) / 2
      const my = (a[1] + b[1]) / 2
      const len = Math.hypot(mx - cx, my - cy) || 1
      return { at: [mx, my], knob: [mx + ((mx - cx) / len) * KNOB_PX, my + ((my - cy) / len) * KNOB_PX] }
    }
    const top = edge(corners[0], corners[1])
    const stem = top.knob[1] > HANDLE_PX ? top : edge(corners[2], corners[3])
    const anchor = screen(frame.anchor)
    const pivot = screen(frame.pivot)
    body = <polygon data-part="body" points={points(corners)} fill="transparent" className="cursor-move" />
    frameParts = (
      <g
        ref={frameEl}
        tabIndex={0}
        role="group"
        data-own-keys
        aria-label={t('inspector.frame.label', { component: layer.characterRef })}
        aria-description={t('inspector.frame.description')}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown Escape"
        className="group fill-none stroke-accent outline-none"
        onKeyDown={onKeyDown}
      >
        {differs(frame.anchorBox, frame.bounds) && (
          <polygon points={points(boxCorners(frame.anchorBox).map(screen))} strokeDasharray="3 3" strokeOpacity={0.5} className="pointer-events-none" />
        )}
        <polygon points={points(corners)} className="pointer-events-none group-focus-visible:stroke-2" />
        <line x1={stem.at[0]} y1={stem.at[1]} x2={stem.knob[0]} y2={stem.knob[1]} className="pointer-events-none" />
        {/* The anchor: scaling keeps it in place. While turning, what the turn goes around. */}
        <rect
          x={anchor[0] - 3}
          y={anchor[1] - 3}
          width={6}
          height={6}
          transform={`rotate(45 ${anchor[0]} ${anchor[1]})`}
          className={cn('pointer-events-none fill-accent', dragging === 'rotate' && 'opacity-40')}
        />
        {dragging === 'rotate' && <circle cx={pivot[0]} cy={pivot[1]} r={5.5} className="pointer-events-none" />}
        {corners.map((c, i) => (
          <g
            key={i}
            data-part="corner"
            data-corner={i}
            data-tip={dragging ? undefined : t('inspector.frame.scaleTip')}
            style={{ cursor: (c[0] - cx) * (c[1] - cy) > 0 ? 'nwse-resize' : 'nesw-resize' }}
          >
            <rect x={c[0] - GRAB_PX / 2} y={c[1] - GRAB_PX / 2} width={GRAB_PX} height={GRAB_PX} fill="transparent" stroke="none" />
            <rect x={c[0] - HANDLE_PX / 2} y={c[1] - HANDLE_PX / 2} width={HANDLE_PX} height={HANDLE_PX} className="fill-slot" />
          </g>
        ))}
        <g data-part="knob" data-tip={dragging ? undefined : t('inspector.frame.rotateTip')} className={dragging === 'rotate' ? 'cursor-grabbing' : 'cursor-grab'}>
          <circle cx={stem.knob[0]} cy={stem.knob[1]} r={GRAB_PX / 2} fill="transparent" stroke="none" />
          <circle cx={stem.knob[0]} cy={stem.knob[1]} r={HANDLE_PX / 2 + 0.5} className="fill-slot" />
        </g>
      </g>
    )
  }

  const values = draft?.values
  return (
    <>
      <svg
        ref={svg}
        width={width}
        height={height}
        className={cn('absolute inset-0 touch-none', dragging === 'move' && 'cursor-move', dragging === 'rotate' && 'cursor-grabbing')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => finish(true)}
        onLostPointerCapture={() => finish(false)}
      >
        {/* Under the components: a press on another component inside the frame selects that one. */}
        {body}
        <g transform={`matrix(${toScreen.join(' ')})`}>
          {shown.layers.map((l, i) =>
            l.fit && !isEmptyPathContent(l.fit.path) ? (
              <path
                key={i}
                d={l.fit.path}
                data-part="layer"
                data-index={i}
                fill="transparent"
                className={i === selection ? 'cursor-move' : 'cursor-pointer'}
                onPointerEnter={() => hover(i)}
                onPointerLeave={() => hover(null)}
              />
            ) : null
          )}
        </g>
        {frameParts}
      </svg>
      {values && (
        <div className="pointer-events-none absolute bottom-1.5 left-1.5 flex gap-2 rounded bg-panel/80 px-1.5 py-0.5 font-mono text-2xs text-fg">
          {values.layerScaleFactor !== undefined && <span>{formatNumber(values.layerScaleFactor)}×</span>}
          {values.rotation !== undefined && <span>{formatNumber(values.rotation)}°</span>}
          {values.xOffset !== undefined && values.yOffset !== undefined && (
            <span>
              {formatNumber(values.xOffset)}, {formatNumber(values.yOffset)}
            </span>
          )}
        </div>
      )}
    </>
  )
}
