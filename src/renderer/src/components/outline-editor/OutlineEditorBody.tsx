// ============================================================
// Outline editor: toolbar, drawing area and status line for one glyph.
//
// Two canvases share one framing: under, the font's guides and the glyph as the font has
// it now; over, the outline being edited (drawn by the engine). Edits go to the font when
// a gesture ends, and the outline is loaded again from the font whenever it changes there:
// the editor's own edits, undo and redo, a paste, another transform setting.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeftRight, Eraser, Info, Magnet, Maximize, MousePointer2, Ruler, Scaling, Spline, SquareDashedMousePointer, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useDocStore } from '../../stores/doc-store'
import { usePrefsStore } from '../../stores/prefs-store'
import { commitOutline, takeOutlineFocus } from '../../app/outline'
import { eventSpec } from '../../app/commands'
import { advanceWidth } from '../../core/compute'
import { invert } from '../../core/affine'
import { isEmptyPathContent, resolveTransforms } from '../../core/model'
import { glyphLabel } from '../../core/unicode-keys'
import { BoundsMode } from '../../types/font'
import { useSize } from '../../hooks/useSize'
import { tokenColor, useThemeVersion } from '../../lib/theme'
import { computeFraming, drawGuides, drawMetricLabels } from '../canvas/GlyphCanvas'
import { IconButton } from '../ui/Button'
import { NumberField } from '../ui/fields'
import { focusFallback } from '../ui/focus'
import { useTranslation } from '../../i18n'
import { createOutlineEngine, type EditorMode, type OutlineEngine, type SelectionInfo, type ViewFraming } from './engine/engine'
import { toEditSpace } from './engine/geometry'

const NO_SELECTION: SelectionInfo = { count: 0, total: 0, contours: 0, x: null, y: null, smooth: undefined }
/** How far the view zooms out of and into the fitted glyph. */
const ZOOM = { min: 0.25, max: 40, step: 1.5 }
/** App shortcuts that would act on glyphs: not from the editor, where they would surprise. */
const SWALLOWED = new Set(['Ctrl+C', 'Ctrl+X', 'Ctrl+V', 'Ctrl+Shift+V', 'Ctrl+Alt+V', 'Ctrl+T', 'Ctrl+Shift+I', 'Ctrl+A', 'Ctrl+D'])

export default function OutlineEditorBody({ docId, glyphKey }: { docId: number; glyphKey: string }): React.ReactElement {
  const { t } = useTranslation()
  const family = useDocStore((s) => s.data!.family)
  const variant = useDocStore((s) => s.data!.glyphs.get(glyphKey)?.variants[0])
  const computed = useDocStore((s) => s.computed.get(glyphKey)?.[0])
  const snapMetrics = usePrefsStore((s) => s.outlineSnapMetrics)
  const snapPoints = usePrefsStore((s) => s.outlineSnapPoints)
  const themeVersion = useThemeVersion()
  const [areaRef, size] = useSize<HTMLDivElement>()
  const underlay = useRef<HTMLCanvasElement>(null)
  const overlay = useRef<HTMLCanvasElement>(null)
  const [engine, setEngine] = useState<OutlineEngine | null>(null)
  const [info, setInfo] = useState<SelectionInfo>(NO_SELECTION)
  const [mode, setMode] = useState<EditorMode>('select')
  /** The view the user zoomed or panned to; null shows the whole glyph. */
  const [view, setView] = useState<ViewFraming | null>(null)
  const pan = useRef<{ x: number; y: number; from: ViewFraming } | null>(null)
  const space = useRef(false)

  const values = family.values
  const advance = computed ? advanceWidth(computed, family) : values.width
  const fit = useMemo(
    () => computeFraming(values, advance > 0 ? advance : values.width, Math.max(size.width, 1), Math.max(size.height, 1), 'preview'),
    [values, advance, size.width, size.height]
  )
  const framing = view ?? fit
  const dpr = window.devicePixelRatio || 1

  // ---- The engine: one per canvas (a new canvas when the screen's pixel ratio changes) ----
  const commit = useRef<(path: string, kind: Parameters<typeof commitOutline>[3], merge?: string) => void>(() => {})
  commit.current = (path, kind, merge) => void commitOutline(docId, glyphKey, path, kind, merge)
  useEffect(() => {
    const canvas = overlay.current
    if (!canvas) return
    const e = createOutlineEngine(canvas, {
      onCommit: (path, kind, merge) => commit.current(path, kind, merge),
      onSelection: setInfo,
      onMode: setMode
    })
    setEngine(e)
    // Asked for by name (double-click, Enter, the Edit button): keys go to the editor.
    if (takeOutlineFocus()) areaRef.current?.focus({ preventScroll: true })
    return () => {
      e.destroy()
      setEngine(null)
    }
  }, [dpr, areaRef])

  // ---- The outline, from the font ----
  const raw = variant?.pathData.path
  const matrix = computed?.ownMatrix
  // The matrix is rebuilt with every compute: the same numbers are the same outline.
  const sourceKey = raw && matrix ? `${matrix.join(',')}|${raw}` : ''
  useEffect(() => {
    if (!engine) return
    const inverse = matrix && invert(matrix)
    if (!raw || !matrix || !inverse || isEmptyPathContent(raw)) engine.load(null)
    else engine.load({ path: toEditSpace(raw, matrix), inverse, matrix })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, sourceKey])

  useEffect(() => {
    engine?.setColors({ fill: tokenColor('glyph', 0.2), line: tokenColor('emphasis'), accent: tokenColor('accent') })
  }, [engine, themeVersion])

  useEffect(() => {
    if (!engine) return
    const bsl = values.baseline
    const metrics = snapMetrics
      ? { xs: [0, advance], ys: [bsl, bsl - values['x-height'], bsl - values['cap-height'], bsl - values.ascent, bsl - values.descent, 0, values.em] }
      : null
    engine.setSnap(metrics, snapPoints)
  }, [engine, values, advance, snapMetrics, snapPoints])

  useEffect(() => {
    if (engine && size.width > 0 && size.height > 0) engine.setView(framing, size.width, size.height)
  }, [engine, framing, size.width, size.height])

  // ---- Under the outline: guides, and the glyph as the font has it ----
  useEffect(() => {
    const canvas = underlay.current
    if (!canvas || size.width <= 0 || size.height <= 0) return
    const W = Math.round(size.width * dpr)
    const H = Math.round(size.height * dpr)
    if (canvas.width !== W) canvas.width = W
    if (canvas.height !== H) canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const { scale, ox, oy } = framing
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr)
    const gw = advance > 0 ? advance : values.width
    drawGuides(ctx, values, gw, { left: -ox / scale, right: (size.width - ox) / scale, top: -oy / scale, bottom: (size.height - oy) / scale }, 1 / (scale * dpr))
    if (computed && !isEmptyPathContent(computed.path)) {
      try {
        // Components too: they are not edited here, but the outline is adjusted against them.
        ctx.fillStyle = tokenColor('glyph', 0.14)
        ctx.fill(new Path2D(computed.path))
      } catch {
        /* a path the canvas cannot read: the guides still show */
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawMetricLabels(ctx, values, gw, framing, size.width, size.height)
  }, [framing, size.width, size.height, values, advance, computed, themeVersion, dpr])

  // ---- View ----
  const zoomAt = (factor: number, x = size.width / 2, y = size.height / 2): void => {
    const scale = Math.max(fit.scale * ZOOM.min, Math.min(fit.scale * ZOOM.max, framing.scale * factor))
    const k = scale / framing.scale
    setView({ scale, ox: x - (x - framing.ox) * k, oy: y - (y - framing.oy) * k })
  }
  const zoomRef = useRef(zoomAt)
  zoomRef.current = zoomAt
  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    // Not passive: the wheel zooms the view instead of scrolling anything.
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomRef.current(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [areaRef])

  // ---- Pointer ----
  const at = (e: React.MouseEvent<HTMLElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }
  const mods = (e: { shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean }): { shift: boolean; alt: boolean; ctrl: boolean } => ({
    shift: e.shiftKey,
    alt: e.altKey,
    ctrl: e.ctrlKey || e.metaKey
  })

  // ---- Keys ----
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!engine || e.target !== e.currentTarget) return
    const spec = eventSpec(e.nativeEvent)
    const used = (): void => {
      e.preventDefault()
      e.stopPropagation()
    }
    if (e.key === ' ') {
      space.current = true
      return used()
    }
    if (spec === 'F') {
      setView(null)
      return used()
    }
    if (spec === 'Ctrl+=' || spec === 'Ctrl+-') {
      zoomAt(spec === 'Ctrl+=' ? ZOOM.step : 1 / ZOOM.step)
      return used()
    }
    if (engine.keyDown(spec)) return used()
    if (spec === 'Escape') {
      // Nothing left to leave in the editor: back to the grid, the window stays.
      focusFallback({ force: true })
      return used()
    }
    if (SWALLOWED.has(spec)) return used()
    // A chord for the app (undo, save…): what the editor holds goes in the font first.
    if (e.ctrlKey || e.metaKey) {
      engine.cancel()
      engine.flush()
    }
  }

  const baseline = values.baseline
  const bounds = variant ? resolveTransforms(variant.transforms, family.transforms).bounds : BoundsMode.Outside
  const label = glyphLabel(glyphKey)
  const has = info.count > 0

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-line px-1.5 py-1">
        <ToolGroup label={t('outline.tools.groupMode')}>
          <Tool icon={MousePointer2} tip={t('outline.tools.select')} pressed={mode === 'select'} onClick={() => engine?.setMode('select')} />
          <Tool icon={Scaling} tip={t('outline.tools.transform')} pressed={mode === 'transform'} disabled={info.count < 2} onClick={() => engine?.setMode('transform')} />
        </ToolGroup>
        <ToolGroup label={t('outline.tools.groupPoints')}>
          <Tool icon={Spline} tip={t('outline.tools.smooth')} pressed={info.smooth === true} disabled={!has} onClick={() => engine?.toggleSmooth()} />
          <Tool icon={Eraser} tip={t('outline.tools.deletePoints')} disabled={!has} onClick={() => engine?.deleteSelected()} />
        </ToolGroup>
        <ToolGroup label={t('outline.tools.groupContours')}>
          <Tool icon={SquareDashedMousePointer} tip={t('outline.tools.selectContour')} disabled={!has} onClick={() => engine?.selectContours()} />
          <Tool icon={ArrowLeftRight} tip={t('outline.tools.reverseContour')} disabled={!has} onClick={() => engine?.reverseContours()} />
          <Tool icon={Trash2} tip={t('outline.tools.deleteContour')} disabled={!has} onClick={() => engine?.deleteContours()} />
        </ToolGroup>
        <ToolGroup label={t('outline.tools.groupSnap')}>
          <Tool icon={Ruler} tip={t('outline.tools.snapMetrics')} pressed={snapMetrics} onClick={() => usePrefsStore.getState().set('outlineSnapMetrics', !snapMetrics)} />
          <Tool icon={Magnet} tip={t('outline.tools.snapPoints')} pressed={snapPoints} onClick={() => usePrefsStore.getState().set('outlineSnapPoints', !snapPoints)} />
        </ToolGroup>
        <div className="ml-auto flex items-center gap-1">
          <NumberField
            className="w-[76px]"
            label={t('outline.position.x')}
            tip={t('outline.position.xTip')}
            ariaLabel={t('outline.position.xTip')}
            value={has ? info.x ?? undefined : undefined}
            disabled={!has}
            precision={2}
            onChange={(v, meta) => v !== null && engine?.setPosition('x', v, meta.interactive)}
          />
          <NumberField
            className="w-[76px]"
            label={t('outline.position.y')}
            tip={t('outline.position.yTip')}
            ariaLabel={t('outline.position.yTip')}
            // Shown as a type designer reads it: up from the baseline.
            value={has && typeof info.y === 'number' ? baseline - info.y : undefined}
            disabled={!has}
            precision={2}
            onChange={(v, meta) => v !== null && engine?.setPosition('y', baseline - v, meta.interactive)}
          />
        </div>
      </div>

      <div
        ref={areaRef}
        tabIndex={0}
        role="application"
        aria-label={t('outline.canvas', { glyph: label })}
        className="relative min-h-0 flex-1 touch-none overflow-hidden bg-slot outline-none focus-visible:shadow-[inset_0_0_0_2px_rgb(var(--c-accent))]"
        onKeyDown={onKeyDown}
        onKeyUp={(e) => {
          if (e.key === ' ') space.current = false
          if (e.target === e.currentTarget) engine?.keyUp(eventSpec(e.nativeEvent))
        }}
        onBlur={() => {
          space.current = false
          engine?.flush()
        }}
        onPointerDown={(e) => {
          if (!engine) return
          e.currentTarget.focus({ preventScroll: true })
          const [x, y] = at(e)
          if (e.button === 1 || (e.button === 0 && space.current)) {
            e.preventDefault()
            e.currentTarget.setPointerCapture(e.pointerId)
            pan.current = { x, y, from: framing }
          } else if (e.button === 0) {
            e.currentTarget.setPointerCapture(e.pointerId)
            engine.pointerDown(x, y, mods(e))
          }
        }}
        onPointerMove={(e) => {
          if (!engine) return
          const [x, y] = at(e)
          const p = pan.current
          if (p) setView({ scale: p.from.scale, ox: p.from.ox + x - p.x, oy: p.from.oy + y - p.y })
          else if (e.buttons & 1) engine.pointerMove(x, y, mods(e))
          else e.currentTarget.style.cursor = space.current ? 'grab' : engine.cursorAt(x, y)
        }}
        onPointerUp={(e) => {
          if (!engine) return
          if (pan.current) pan.current = null
          else if (e.button === 0) engine.pointerUp(...at(e), mods(e))
        }}
        // The press was taken away (another window, a dialog): nothing half-moved stays.
        onLostPointerCapture={() => {
          pan.current = null
          engine?.cancel()
        }}
        onDoubleClick={(e) => engine?.doubleClick(...at(e))}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={underlay} aria-hidden className="pointer-events-none absolute left-0 top-0" style={{ width: size.width, height: size.height }} />
        {/* A canvas of its own for each pixel ratio: the engine sizes it once, for that ratio. */}
        <canvas key={dpr} ref={overlay} aria-hidden className="pointer-events-none absolute left-0 top-0" />
        <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 rounded bg-panel/80 p-0.5">
          <Tool icon={ZoomOut} size="xs" tip={t('outline.tools.zoomOut')} onClick={() => zoomAt(1 / ZOOM.step)} />
          <Tool icon={ZoomIn} size="xs" tip={t('outline.tools.zoomIn')} onClick={() => zoomAt(ZOOM.step)} />
          <Tool icon={Maximize} size="xs" tip={t('outline.tools.fit')} disabled={!view} onClick={() => setView(null)} />
        </div>
      </div>

      <div className="flex h-6 shrink-0 items-center gap-2 border-t border-line px-2 pr-5 text-2xs text-muted">
        <span className="min-w-0 flex-1 truncate" aria-live="polite">
          {has ? t('outline.status.points', { selected: info.count, total: info.total }) : t('outline.status.hint')}
        </span>
        {bounds !== BoundsMode.Outside && (
          <span role="img" aria-label={t('outline.status.refit')} data-tip={t('outline.status.refit')} className="shrink-0 text-subtle">
            <Info size={12} aria-hidden />
          </span>
        )}
      </div>
    </>
  )
}

function ToolGroup({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-0.5">
      {children}
    </div>
  )
}

/** A toolbar button. A press with the mouse leaves focus on the drawing area, where the keys are. */
function Tool({
  icon,
  tip,
  pressed,
  disabled,
  size = 'sm',
  onClick
}: {
  icon: LucideIcon
  tip: string
  /** For buttons that are on or off; leave out for plain actions. */
  pressed?: boolean
  disabled?: boolean
  size?: 'xs' | 'sm'
  onClick: () => void
}): React.ReactElement {
  return (
    <IconButton
      icon={icon}
      size={size}
      tip={tip}
      aria-pressed={pressed}
      active={pressed === true}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={onClick}
    />
  )
}
