import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import svgpath from 'svgpath'
import { createPortal } from 'react-dom'
import { useSize } from '../../hooks/useSize'
import { ClipboardPaste, Copy, Download, ExternalLink, Link2, MoreHorizontal, PenTool, ZoomIn, ZoomOut } from 'lucide-react'
import { useDocStore } from '../../stores/doc-store'
import { useInspectorStore } from '../../stores/inspector-store'
import { useSelectionStore } from '../../stores/selection-store'
import { GLYPH_VIEW, usePrefsStore } from '../../stores/prefs-store'
import { GlyphCanvas } from '../canvas/GlyphCanvas'
import { ComponentFrame, useShownVariant } from './ComponentFrame'
import { IconButton } from '../ui/Button'
import { DropdownMenu } from '../ui/Menu'
import { advanceWidth } from '../../core/compute'
import { pathBBox } from '../../core/geometry'
import { categoryColor, getUnicodeInfo, SUBCATEGORIES, titleCaseName } from '../../core/unicode'
import { categoryName } from '../../lib/category-names'
import { formatKey, glyphLabel, keyToDisplayChars, isLigatureKey } from '../../core/unicode-keys'
import { useUnicodeDb } from '../../hooks/doc'
import { copySelection } from '../../app/clipboard'
import { pasteSvgInto } from '../../app/clipboard'
import { readClipboardText, isElectron } from '../../platform'
import { editInExternalEditor, unbind, useBindings } from '../../app/bindings'
import { pickSvgForGlyph } from '../../app/imports'
import { openOutlineEditor } from '../../app/outline'
import { commandTip } from '../../app/commands'
import { glyphMenu } from '../../app/context-menus'
import { copyHex, copyCharacters } from '../../app/actions'
import { toast } from '../ui/Overlays'
import { basename } from '../../platform'
import { cn } from '../../lib/cn'
import { useTranslation } from '../../i18n'

/** Kept free under the glyph view in a short inspector: its resize handle stays in sight. */
const VIEW_ROOM = 48

/** A glyph view height from GLYPH_VIEW.min to `max`, in whole pixels. */
function clampViewHeight(h: number, max: number): number {
  return Math.round(Math.max(GLYPH_VIEW.min, Math.min(max, h)))
}

/**
 * The element's nearest scrolling ancestor (the inspector) and its visible height; null
 * without one.
 */
function useScroller<T extends HTMLElement>(): [React.RefObject<T | null>, HTMLElement | null, number | null] {
  const ref = useRef<T>(null)
  const [scroller, setScroller] = useState<HTMLElement | null>(null)
  const [height, setHeight] = useState<number | null>(null)
  useLayoutEffect(() => {
    let el = ref.current?.parentElement ?? null
    while (el && !['auto', 'scroll'].includes(getComputedStyle(el).overflowY)) el = el.parentElement
    if (!el) return
    const found = el
    setScroller(found)
    // 0 while it is hidden: no limit then.
    const update = (): void => setHeight(found.clientHeight || null)
    update()
    const obs = new ResizeObserver(update)
    obs.observe(found)
    return () => obs.disconnect()
  }, [])
  return [ref, scroller, height]
}

/** Below this share of the glyph view in sight, hovering the inspector shows a copy beside it (v1). */
const POP_OUT_BELOW = 0.9

/**
 * Whether the glyph view is scrolled mostly out of the inspector while the pointer is over
 * the inspector: then a copy of the view floats beside it.
 */
function usePopOut(view: React.RefObject<HTMLElement | null>, scroller: HTMLElement | null): boolean {
  const [hidden, setHidden] = useState(false)
  const [hover, setHover] = useState(false)
  useEffect(() => {
    const el = view.current
    if (!scroller || !el) return
    const io = new IntersectionObserver(([e]) => setHidden(e.intersectionRatio < POP_OUT_BELOW), { root: scroller, threshold: [0, POP_OUT_BELOW, 1] })
    io.observe(el)
    // Another glyph shown while the pointer is already over the inspector.
    setHover(scroller.matches(':hover'))
    const enter = (): void => setHover(true)
    const leave = (): void => setHover(false)
    scroller.addEventListener('pointerenter', enter)
    scroller.addEventListener('pointerleave', leave)
    return () => {
      io.disconnect()
      scroller.removeEventListener('pointerenter', enter)
      scroller.removeEventListener('pointerleave', leave)
    }
  }, [view, scroller])
  return hidden && hover
}

export function GlyphPreview({ unicode }: { unicode: string }): React.ReactElement {
  const family = useDocStore((s) => s.data!.family)
  // With the drag of a component in progress, when there is one.
  const c = useShownVariant(unicode)
  const { t } = useTranslation()
  const focus = useInspectorStore((s) => s.layerFocus)
  const selection = useInspectorStore((s) => s.layerSelection)
  const [zoom, setZoom] = useState(1)
  const [ref, size] = useSize<HTMLDivElement>()
  const viewId = useId()
  const stored = usePrefsStore((s) => s.glyphViewHeight)
  // The square view follows the inspector's width, not the measured one: that one narrows
  // when the inspector's scrollbar shows, and a height following it can make the scrollbar
  // come and go in a loop.
  const inspectorWidth = usePrefsStore((s) => s.rightWidth)
  // No taller than the inspector shows (a short window, a zoomed interface), so the handle
  // stays reachable. Only the view is limited: the stored height is back once there is room.
  const [box, scroller, visible] = useScroller<HTMLDivElement>()
  const popOut = usePopOut(ref, scroller)
  const max = visible ? Math.max(GLYPH_VIEW.min, Math.min(GLYPH_VIEW.max, visible - VIEW_ROOM)) : GLYPH_VIEW.max
  // Height while the bottom edge is dragged: the pref is written once, on release.
  const [dragged, setDragged] = useState<number | null>(null)
  // A stored height that is not a number (a damaged pref) means square, like null.
  const fixed = Number.isFinite(stored) ? stored : null
  const height = clampViewHeight(dragged ?? fixed ?? inspectorWidth, max)
  const width = size.width || 300
  // Tinted: the component under the pointer (boxed too), else the selected one (it has its frame).
  const lf = focus && focus.key === unicode && c ? c.layers[focus.index] : null
  const tinted = lf ?? (selection && selection.key === unicode && c ? c.layers[selection.index] : null)
  const boxed = lf && !(selection && selection.key === unicode && selection.index === focus?.index) ? lf : null
  // Where a flattened variant puts its components.
  const tintedPath = useMemo(() => {
    const path = tinted?.fit?.path
    return path && c?.flatMatrix ? svgpath(path).matrix([...c.flatMatrix]).toString() : (path ?? null)
  }, [tinted?.fit?.path, c?.flatMatrix])
  const boxedPath = boxed === tinted ? tintedPath : null
  const highlightBox = useMemo(() => (boxedPath ? { ...pathBBox(boxedPath) } : null), [boxedPath])
  const advance = c ? advanceWidth(c, family) : family.values.width
  const canvas = (w: number, h: number): React.ReactElement => (
    <GlyphCanvas
      path={c?.path}
      advance={advance}
      family={family.values}
      width={w}
      height={h}
      mode="preview"
      empty={c?.empty}
      fit={c?.base.fit}
      highlightPath={tintedPath}
      highlightBox={highlightBox}
      zoom={zoom}
    />
  )
  return (
    <div ref={box} className="relative">
      <div ref={ref} id={viewId} className="relative overflow-hidden border-b border-line bg-slot">
        {canvas(width, height)}
        <ComponentFrame unicode={unicode} shown={c} family={family.values} advance={advance} width={width} height={height} zoom={zoom} />
        <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 rounded bg-panel/80 p-0.5">
          <IconButton icon={ZoomOut} size="xs" tip={t('inspector.header.zoomOut')} disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, z / 1.5))} />
          <IconButton icon={ZoomIn} size="xs" tip={t('inspector.header.zoomIn')} disabled={zoom >= 4} onClick={() => setZoom((z) => Math.min(4, z * 1.5))} />
        </div>
      </div>
      {/* Outside the clipped view, so it can straddle the view's bottom border. */}
      <ViewResizer controls={viewId} height={height} max={max} dragging={dragged !== null} onDrag={setDragged} />
      {popOut && scroller && <FloatingView beside={scroller} width={width} height={height} render={canvas} />}
    </div>
  )
}

/** Gap between the inspector and the floating view, and from the window edges. */
const FLOAT_GAP = 8

/**
 * A copy of the glyph view to the left of the inspector, centred on it and kept in the
 * window. It only shows: the pointer goes through it, and screen readers skip it.
 */
function FloatingView({
  beside,
  width,
  height,
  render
}: {
  beside: HTMLElement
  width: number
  height: number
  render: (w: number, h: number) => React.ReactElement
}): React.ReactElement {
  const rect = beside.getBoundingClientRect()
  const h = Math.min(height, window.innerHeight - 2 * FLOAT_GAP)
  const top = Math.max(FLOAT_GAP, Math.min(window.innerHeight - h - FLOAT_GAP, rect.top + rect.height / 2 - h / 2))
  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed z-40 animate-pop-in overflow-hidden rounded-lg bg-slot shadow-pop"
      style={{ top, left: Math.max(FLOAT_GAP, rect.left - FLOAT_GAP - width), width, height: h }}
    >
      {render(width, h)}
    </div>,
    document.body
  )
}

/**
 * Bottom edge of the glyph view: drag it, or focus it and use the arrow keys (Shift: bigger
 * steps). A double-click makes the view square again. Mirrors the panel resizers.
 */
function ViewResizer({
  controls,
  height,
  max,
  dragging,
  onDrag
}: {
  controls: string
  height: number
  /** Tallest height allowed now: GLYPH_VIEW.max, or less in a short inspector. */
  max: number
  dragging: boolean
  onDrag: (h: number | null) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const start = useRef<{ y: number; h: number; moved: boolean } | null>(null)
  const store = (h: number | null): void => usePrefsStore.getState().set('glyphViewHeight', h)
  const clamp = (h: number): number => clampViewHeight(h, max)
  const stop = (): void => {
    start.current = null
    onDrag(null)
  }
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={t('inspector.header.resizeView')}
      aria-controls={controls}
      aria-valuenow={height}
      aria-valuemin={GLYPH_VIEW.min}
      aria-valuemax={max}
      aria-valuetext={t('inspector.header.pixels', { value: height })}
      tabIndex={0}
      // 6 px centred on the bottom border, over the view and the padding below: no layout height.
      className="group absolute inset-x-0 -bottom-[3px] z-10 h-1.5 cursor-row-resize touch-none outline-none"
      onKeyDown={(e) => {
        // Chords stay with the app's shortcuts.
        if (e.altKey || e.ctrlKey || e.metaKey) return
        const step = e.shiftKey ? 64 : 16
        let h: number
        switch (e.key) {
          case 'ArrowUp': h = height - step; break
          case 'ArrowDown': h = height + step; break
          case 'Home': h = GLYPH_VIEW.min; break
          case 'End': h = max; break
          default: return
        }
        e.preventDefault()
        h = clamp(h)
        // A step against a limit changes nothing: a square view stays square.
        if (h === height) return
        store(h)
        // The handle moves with the view's bottom: keep it in sight.
        const el = e.currentTarget
        requestAnimationFrame(() => el.scrollIntoView({ block: 'nearest' }))
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        // Focus stays where it was, as with the panel resizers.
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        start.current = { y: e.clientY, h: height, moved: false }
      }}
      onPointerMove={(e) => {
        const s = start.current
        if (!s) return
        const dy = e.clientY - s.y
        // A click that slips a pixel (a double-click too) must not fix the height.
        if (!s.moved && Math.abs(dy) < 3) return
        s.moved = true
        onDrag(clamp(s.h + dy))
      }}
      onPointerUp={(e) => {
        const s = start.current
        if (!s) return
        const h = clamp(s.h + e.clientY - s.y)
        if (s.moved && h !== s.h) store(h)
        stop()
      }}
      // Cancelled before the release: back to the stored height.
      onLostPointerCapture={() => {
        if (start.current) stop()
      }}
      onDoubleClick={() => store(null)}
    >
      {/* Lies on the bottom border and doubles as the focus indicator (the handle opts out of the outline ring). */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-[3px] h-px transition-colors group-focus-visible:h-0.5 group-focus-visible:bg-accent',
          dragging ? 'bg-accent' : 'bg-transparent group-hover:bg-accent/60'
        )}
      />
    </div>
  )
}

export function GlyphIdentity({ unicode, exists }: { unicode: string; exists: boolean }): React.ReactElement {
  useUnicodeDb()
  const { t } = useTranslation()
  const info = getUnicodeInfo(unicode)
  const bound = useBindings((s) => s.byKey.get(unicode))
  const liga = isLigatureKey(unicode)
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <button
        type="button"
        data-tip={t('inspector.header.copyCharacter')}
        // The action is only in the tooltip; the name keeps the visible character in it.
        aria-label={t('inspector.header.copyCharacterName', { glyph: glyphLabel(unicode) })}
        onClick={() => void copyCharacters([unicode])}
        className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-md border border-line bg-raised px-1.5 text-2xl leading-none text-fg hover:border-accent"
      >
        {keyToDisplayChars(unicode) || '·'}
      </button>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-fg" data-tip={info.name ?? undefined}>
          {info.name ? titleCaseName(info.name) : liga ? t('inspector.header.ligature') : t('inspector.header.unknownCharacter')}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => void copyHex([unicode])}
            data-tip={t('inspector.header.copyUnicode')}
            aria-label={t('inspector.header.copyCode', { code: formatKey(unicode) })}
            className="rounded bg-hover px-1.5 py-px font-mono text-2xs text-muted hover:text-fg"
          >
            {formatKey(unicode)}
          </button>
          <span className="flex items-center gap-1 rounded bg-hover px-1.5 py-px text-2xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: categoryColor(unicode) }} />
            {liga ? t('inspector.header.ligature') : SUBCATEGORIES[info.gc] ? t('inspector.header.category', { name: categoryName(info.gc), gc: info.gc }) : info.gc}
          </span>
          {info.block && <span className="truncate rounded bg-hover px-1.5 py-px text-2xs text-muted">{info.block.name}</span>}
          {!exists && <span className="rounded bg-warn/15 px-1.5 py-px text-2xs text-warn">{t('inspector.header.notInFont')}</span>}
        </div>
        {bound && (
          <div className="mt-1.5 flex items-center gap-1 text-2xs text-emphasis">
            <Link2 size={11} />
            <span className="truncate" data-tip={bound}>
              {t('inspector.header.live', { file: basename(bound) })}
            </span>
            <button type="button" className="ml-auto text-subtle hover:text-fg" onClick={() => unbind(unicode)}>
              {t('inspector.header.unbind')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function GlyphActions({ unicode }: { unicode: string }): React.ReactElement {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-1 border-b border-line px-3 pb-2.5">
      <IconButton icon={Download} variant="default" tip={t('inspector.header.importSvg')} onClick={() => void pickSvgForGlyph(unicode)} />
      <IconButton
        icon={ClipboardPaste}
        variant="default"
        tip={t('inspector.header.pasteSvg')}
        onClick={async () => {
          const text = await readClipboardText()
          if (text.includes('<svg')) pasteSvgInto(unicode, text)
          else toast.info(t('inspector.noSvgInClipboard'))
        }}
      />
      <IconButton icon={Copy} variant="default" tip={t('inspector.header.copyGlyph')} onClick={() => void copySelection()} />
      <IconButton icon={PenTool} variant="default" tip={commandTip('glyph.editOutline')} onClick={() => openOutlineEditor(unicode)} />
      {isElectron && <IconButton icon={ExternalLink} variant="default" tip={t('inspector.header.externalEditor')} onClick={() => void editInExternalEditor(unicode)} />}
      <div className="ml-auto">
        <DropdownMenu
          align="end"
          minWidth={240}
          items={() => {
            const s = useSelectionStore.getState()
            return glyphMenu(s.keys.length ? s.keys : [unicode], s.active ?? unicode)
          }}
          trigger={({ toggle, open }) => <IconButton icon={MoreHorizontal} variant="default" tip={t('inspector.header.moreActions')} active={open} onClick={toggle} />}
        />
      </div>
    </div>
  )
}
