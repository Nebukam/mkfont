// ============================================================
// Virtualized grid (fixed-height rows) of glyphs, or of kerning pairs.
// ============================================================

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { GlyphSlot, slotId } from './GlyphSlot'
import { neighbourAfterRemoval } from './grid-cursor'
import { useSelectionStore, type SelectionStore } from '../../stores/selection-store'
import { useDocStore } from '../../stores/doc-store'
import { useUIStore } from '../../stores/ui-store'
import { onLeaveDocument, useWorkspace } from '../../stores/workspace'
import { usePrefsStore, zoomCells } from '../../stores/prefs-store'
import { openContextMenu, type MenuItem } from '../ui/Menu'
import { glyphMenu } from '../../app/context-menus'
import { t } from '../../i18n'

const GAP = 6
const PAD = 12
const OVERSCAN = 3

/** What a cell gets from the grid. */
export interface GridCellProps {
  width: number
  height: number
  /** The grid's keyboard cursor is on this cell (while the grid is used from the keyboard). */
  cursor?: boolean
  onSelect: (key: string, e: React.MouseEvent) => void
  onContext: (key: string, e: React.MouseEvent) => void
}

/** What a grid lists: glyphs, or kerning pairs (the pair views). */
export interface GridItems {
  /** The selection the grid shows and changes. */
  selection: SelectionStore
  renderCell: (key: string, props: GridCellProps) => React.ReactElement
  /** DOM id of a cell (the grid points screen readers at its cursor cell). */
  cellId: (key: string) => string
  menu: (keys: string[], active: string | null) => MenuItem[]
  /** The grid's accessible name (looked up when shown). */
  label: () => string
  /** Cell width for a height of 1 (glyph cells are square). */
  aspect: number
}

export const GLYPH_ITEMS: GridItems = {
  selection: useSelectionStore,
  renderCell: (key, props) => <GlyphSlot key={key} unicode={key} {...props} />,
  cellId: slotId,
  menu: glyphMenu,
  label: () => t('viewport.grid.glyphs'),
  aspect: 1
}

/**
 * Where the grid was when a font's tab was left: the first glyph in view and how far into
 * its row, so the tab comes back to the same glyphs even if the cell size or the panel
 * widths changed meanwhile. Used or dropped on the first render of that font after a
 * switch back; never later (a grid remounting in the same tab starts at the top).
 */
interface LeftAt {
  /** The view it was taken in (range + search): another view starts at the top. */
  view: string
  key: string
  /** Fraction of the row height scrolled past the row's top. */
  into: number
  /** The pixel position: within the top padding, or should that glyph be gone. */
  top: number
}
const leftAt = new Map<number, LeftAt>()

/** Cell layout for a given client width. */
function gridMetrics(width: number, cellSize: number, showLabels: boolean, aspect = 1): { cols: number; cellW: number; cellH: number; rowH: number } {
  const inner = Math.max(100, width - PAD * 2)
  const cols = Math.max(1, Math.floor((inner + GAP) / (cellSize * aspect + GAP)))
  const cellW = Math.floor((inner - GAP * (cols - 1)) / cols)
  const cellH = Math.round((cellW / aspect) * (showLabels ? 1.16 : 1)) + (showLabels ? 6 : 0)
  return { cols, cellW, cellH, rowH: cellH + GAP }
}

export function GlyphGrid({
  keys,
  resetKey,
  settled = true,
  items = GLYPH_ITEMS
}: {
  keys: string[]
  /** Changes when the range or the search changes: the grid scrolls back to the top. */
  resetKey: string
  /** False while a deferred search is still catching up with the typed text. */
  settled?: boolean
  /** What the grid lists (glyphs by default). */
  items?: GridItems
}): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })
  const [scrollTop, setScrollTop] = useState(0)
  const cellSize = usePrefsStore((s) => s.cellSize)
  const showLabels = usePrefsStore((s) => s.showSlotLabels)
  const revealKey = useUIStore((s) => s.revealKey)
  const docId = useDocStore((s) => s.docId)
  const keysRef = useRef(keys)
  keysRef.current = keys
  const itemsRef = useRef(items)
  itemsRef.current = items
  const selection = items.selection
  const aspect = items.aspect

  // Keyboard cursor: the cell the arrow keys move from. It follows clicks and the active
  // glyph; Ctrl+arrows move it alone, and Space then adds or removes its glyph (Ctrl+click).
  const [cursor, setCursor] = useState<string | null>(() => selection.getState().active)
  const cursorRef = useRef(cursor)
  cursorRef.current = cursor
  // The cursor shows while the grid is used from the keyboard: not after a click, and not
  // when the grid lost focus. Tracked here: :focus-visible does not change when keys
  // follow a click.
  const [keyboardNav, setKeyboardNav] = useState(false)
  useEffect(
    () =>
      selection.subscribe((s, prev) => {
        if (s.active && s.active !== prev.active) setCursor(s.active)
      }),
    [selection]
  )
  // Another font (tab), or a grid of other items: its own active item.
  useEffect(() => {
    setCursor(selection.getState().active)
  }, [docId, selection])

  // When the glyph under the cursor leaves this view (deleted from "My glyphs"), the
  // cursor moves to the glyph after it, so the arrow keys go on from there. The selection
  // stays as it was: undoing the delete brings the glyphs back selected.
  // Looked up once per change, not per scroll frame ("All characters" lists ~150k keys).
  const cursorIndex = useMemo(() => (cursor ? keys.indexOf(cursor) : -1), [keys, cursor])
  const tracked = useRef({ keys, key: cursor, index: -1, resetKey, docId })
  useLayoutEffect(() => {
    const t = tracked.current
    const vanished = cursorIndex < 0 && !!cursor && cursor === t.key && t.index >= 0 && t.resetKey === resetKey && t.docId === docId
    const next = vanished ? neighbourAfterRemoval(t.keys, t.index, keys) : cursor
    tracked.current = { keys, key: next, index: next === cursor ? cursorIndex : next ? keys.indexOf(next) : -1, resetKey, docId }
    if (next !== cursor) setCursor(next)
  }, [keys, resetKey, docId, cursor, cursorIndex])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const obs = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    obs.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    // Ctrl+wheel resizes cells (non-passive so the page itself does not zoom).
    const onWheel = (e: WheelEvent): void => {
      if (!e.ctrlKey) return
      e.preventDefault()
      zoomCells(e.deltaY < 0 ? 12 : -12)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      obs.disconnect()
      el.removeEventListener('wheel', onWheel)
    }
  }, [])

  const { cols, cellW, cellH, rowH } = gridMetrics(size.w, cellSize, showLabels, aspect)
  const rows = Math.ceil(keys.length / cols)
  const totalH = PAD * 2 + Math.max(0, rows * rowH - GAP)
  const first = Math.max(0, Math.floor((scrollTop - PAD) / rowH) - OVERSCAN)
  const last = Math.min(rows - 1, Math.ceil((scrollTop + size.h - PAD) / rowH) + OVERSCAN)

  const colsRef = useRef(cols)
  colsRef.current = cols

  /**
   * Bring a cell into view: the smallest scroll, or centered for jumps.
   * Measures the element itself, so it is right even before a resize re-render.
   */
  const scrollToIndex = useCallback(
    (index: number, center = false) => {
      const el = scrollRef.current
      if (!el || index < 0) return
      const m = gridMetrics(el.clientWidth, cellSize, showLabels, aspect)
      const top = PAD + Math.floor(index / m.cols) * m.rowH
      const bottom = top + m.cellH
      if (top >= el.scrollTop && bottom <= el.scrollTop + el.clientHeight) return
      if (center) el.scrollTop = Math.max(0, top - (el.clientHeight - m.cellH) / 2)
      else if (top < el.scrollTop) el.scrollTop = top - PAD
      else el.scrollTop = bottom - el.clientHeight + PAD
    },
    [cellSize, showLabels, aspect]
  )

  // Scroll position follows the view: a reveal request (navigation, presets, created
  // glyphs) scrolls to its glyph; another font (tab) comes back where it was left; a
  // new range or search otherwise goes back to the top. All are handled together so a
  // range switch never cancels the reveal that caused it.
  const lastResetKey = useRef(resetKey)
  /** The font this grid last rendered: its first render of another one restores it. */
  const shownDoc = useRef<number | null>(null)
  // Saved the moment another font is shown, while this one is still on screen.
  const shownView = useRef({ docId, view: '' })
  shownView.current = { docId, view: `${docId}|${resetKey}` }
  useEffect(
    () =>
      onLeaveDocument(() => {
        const el = scrollRef.current
        const { docId: left, view } = shownView.current
        // A font closing (its tab is gone already) never comes back.
        if (!el || !useWorkspace.getState().sessions.some((s) => s.store.getState().docId === left)) return
        const { cellSize: cell, showSlotLabels: labels } = usePrefsStore.getState()
        const m = gridMetrics(el.clientWidth, cell, labels, itemsRef.current.aspect)
        const row = Math.max(0, Math.floor((el.scrollTop - PAD) / m.rowH))
        const key = keysRef.current[row * m.cols]
        if (!key) return
        leftAt.delete(left)
        leftAt.set(left, { view, key, into: (el.scrollTop - (PAD + row * m.rowH)) / m.rowH, top: el.scrollTop })
        if (leftAt.size > 100) leftAt.delete(leftAt.keys().next().value!)
      }),
    []
  )
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    // Rendered with a stale size (first mount, or before the resize observer caught up),
    // the content is too short and a jump would be clamped: measure, then run again.
    if (el.clientWidth !== size.w || el.clientHeight !== size.h) {
      setSize({ w: el.clientWidth, h: el.clientHeight })
      return
    }
    const resetChanged = lastResetKey.current !== resetKey
    lastResetKey.current = resetKey
    // First render of this font (a switch, or the grid mounting): its saved position is
    // used now or dropped, whatever wins below.
    const switched = shownDoc.current !== docId
    shownDoc.current = docId
    let saved: LeftAt | undefined
    if (switched) {
      saved = leftAt.get(docId)
      leftAt.delete(docId)
      if (saved?.view !== `${docId}|${resetKey}`) saved = undefined
    }
    const target = useUIStore.getState().revealKey
    const index = target ? keys.indexOf(target) : -1
    if (index >= 0) {
      scrollToIndex(index, true)
    } else if (saved) {
      const at = saved.top <= PAD ? -1 : keys.indexOf(saved.key)
      if (at >= 0) {
        const m = gridMetrics(el.clientWidth, cellSize, showLabels, aspect)
        el.scrollTop = Math.max(0, PAD + Math.floor(at / m.cols) * m.rowH + saved.into * m.rowH)
      } else {
        el.scrollTop = saved.top
      }
      setScrollTop(el.scrollTop)
    } else if (switched || resetChanged) {
      el.scrollTop = 0
      setScrollTop(0)
    }
    // Keep the request while a deferred search may still change the content;
    // once settled, it is done (or its glyph is not in this view).
    if (target && settled) useUIStore.getState().reveal(null)
  }, [resetKey, keys, revealKey, settled, scrollToIndex, size.w, size.h, docId, aspect])

  // The browser clamps scrollTop silently when content shrinks: resync.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el && el.scrollTop !== scrollTop) setScrollTop(el.scrollTop)
  })

  const onSelect = useCallback((key: string, e: React.MouseEvent) => {
    // A text selection left in the preview would otherwise take Ctrl+C from the glyphs.
    window.getSelection()?.removeAllRanges()
    // The click focuses the grid itself: a focus() from script would count as keyboard
    // focus after keyboard use, and show the keyboard focus ring.
    setCursor(key)
    itemsRef.current.selection.getState().click(key, { ctrl: e.ctrlKey || e.metaKey, shift: e.shiftKey }, keysRef.current)
  }, [])

  const onContext = useCallback((key: string, e: React.MouseEvent) => {
    setCursor(key)
    const { selection: store, menu } = itemsRef.current
    const sel = store.getState()
    if (!sel.set.has(key)) sel.click(key, {}, keysRef.current)
    const s = store.getState()
    openContextMenu(e, menu(s.keys, s.active))
  }, [])

  const onKeyDown = (e: React.KeyboardEvent): void => {
    const sel = selection.getState()
    const list = keysRef.current
    if (!list.length) return
    // A cursor outside this view (another range, a search) falls back to the active glyph.
    const cur = cursorIndex >= 0 ? cursorIndex : sel.active ? list.indexOf(sel.active) : -1
    if (e.key === ' ' && !e.altKey && !e.ctrlKey && !e.metaKey) {
      // Space: add or remove the cursor's glyph, like Ctrl+click.
      e.preventDefault()
      setKeyboardNav(true)
      const key = list[Math.max(0, cur)]
      sel.click(key, { ctrl: true }, list)
      setCursor(key)
      return
    }
    let next = cur
    const c = colsRef.current
    const page = Math.max(1, Math.floor(size.h / rowH)) * c
    switch (e.key) {
      case 'ArrowRight': next = cur + 1; break
      case 'ArrowLeft': next = cur - 1; break
      case 'ArrowDown': next = cur + c; break
      case 'ArrowUp': next = cur - c; break
      case 'PageDown': next = cur + page; break
      case 'PageUp': next = cur - page; break
      case 'Home': next = 0; break
      case 'End': next = list.length - 1; break
      default: return
    }
    if (e.altKey) return
    e.preventDefault()
    setKeyboardNav(true)
    if (cur === -1) next = 0
    next = Math.max(0, Math.min(list.length - 1, next))
    const key = list[next]
    setCursor(key)
    if (e.shiftKey) sel.click(key, { shift: true }, list)
    else if (!e.ctrlKey && !e.metaKey) sel.setSelection([key], key)
    scrollToIndex(next)
  }

  // The Menu key / Shift+F10 opens the glyph menu at the cursor. Right-clicks on cells
  // have their own menu; one on the empty space below short lists opens nothing.
  const onKeyboardContextMenu = (e: React.MouseEvent): void => {
    // Chromium sends keyboard context menus as "mouse" pointer events with no button (-1).
    const ne = e.nativeEvent as PointerEvent
    if (e.target !== e.currentTarget || (ne.button !== -1 && ne.pointerType !== '')) return
    e.preventDefault()
    const key = cursorRef.current ?? selection.getState().active
    if (!key || !keysRef.current.includes(key)) return
    const sel = selection.getState()
    if (!sel.set.has(key)) sel.click(key, {}, keysRef.current)
    const r = (document.getElementById(items.cellId(key)) ?? e.currentTarget).getBoundingClientRect()
    const s = selection.getState()
    openContextMenu({ clientX: r.left + 12, clientY: r.top + 12, preventDefault: () => undefined }, items.menu(s.keys, s.active))
  }

  // ---- Marquee selection (drag on empty space; Ctrl/Shift adds) ----
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const geomRef = useRef({ cols, cellW, cellH, rowH, rows })
  geomRef.current = { cols, cellW, cellH, rowH, rows }

  const startMarquee = (e: React.MouseEvent): void => {
    if (e.button !== 0 || e.target !== e.currentTarget) return
    const el = scrollRef.current
    if (!el) return
    window.getSelection()?.removeAllRanges()
    const rect = el.getBoundingClientRect()
    if (e.clientX - rect.left >= el.clientWidth) return // scrollbar
    e.preventDefault()
    el.focus({ preventScroll: true })
    const toContent = (cx: number, cy: number): { x: number; y: number } => ({ x: cx - rect.left, y: cy - rect.top + el.scrollTop })
    const start = toContent(e.clientX, e.clientY)
    const additive = e.ctrlKey || e.metaKey || e.shiftKey
    const base = additive ? selection.getState().keys : []
    let pointer = { x: e.clientX, y: e.clientY }
    let moved = false
    let raf = 0

    const apply = (): void => {
      const p = toContent(pointer.x, pointer.y)
      const x0 = Math.min(start.x, p.x)
      const y0 = Math.min(start.y, p.y)
      const x1 = Math.max(start.x, p.x)
      const y1 = Math.max(start.y, p.y)
      setMarquee({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 })
      const g = geomRef.current
      const picked: string[] = []
      for (let r = Math.max(0, Math.floor((y0 - PAD) / g.rowH)); r <= Math.min(g.rows - 1, Math.floor((y1 - PAD) / g.rowH)); r++) {
        const top = PAD + r * g.rowH
        if (top > y1 || top + g.cellH < y0) continue
        for (let c = 0; c < g.cols; c++) {
          const left = PAD + c * (g.cellW + GAP)
          if (left > x1 || left + g.cellW < x0) continue
          const k = keysRef.current[r * g.cols + c]
          if (k) picked.push(k)
        }
      }
      selection.getState().setSelection([...base, ...picked], picked[picked.length - 1] ?? null)
    }
    const onMove = (ev: MouseEvent): void => {
      pointer = { x: ev.clientX, y: ev.clientY }
      if (!moved && Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 4) return
      moved = true
      apply()
    }
    // Scroll while dragging near the top / bottom edge.
    const tick = (): void => {
      if (moved) {
        const r = el.getBoundingClientRect()
        const edge = 32
        let dy = 0
        if (pointer.y < r.top + edge) dy = -Math.ceil((r.top + edge - pointer.y) / 3)
        else if (pointer.y > r.bottom - edge) dy = Math.ceil((pointer.y - (r.bottom - edge)) / 3)
        if (dy) {
          el.scrollTop += dy
          apply()
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const onUp = (): void => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setMarquee(null)
      if (!moved && !additive) selection.getState().clear()
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const rowEls: React.ReactElement[] = []
  for (let r = first; r <= last; r++) {
    const start = r * cols
    const rowKeys = keys.slice(start, start + cols)
    rowEls.push(
      <div
        key={r}
        role="row"
        aria-rowindex={r + 1}
        className="absolute left-0 flex"
        style={{ top: PAD + r * rowH, left: PAD, gap: GAP, height: cellH }}
      >
        {rowKeys.map((k) => items.renderCell(k, { width: cellW, height: cellH, cursor: keyboardNav && k === cursor, onSelect, onContext }))}
      </div>
    )
  }
  // Screen readers follow the cursor cell while it is rendered.
  const cursorShown = cursorIndex >= 0 && Math.floor(cursorIndex / cols) >= first && Math.floor(cursorIndex / cols) <= last

  return (
    <div
      ref={scrollRef}
      tabIndex={0}
      role="grid"
      aria-label={items.label()}
      // Where focus goes when an action removes the control that had it.
      data-focus-fallback
      aria-rowcount={rows}
      aria-multiselectable="true"
      aria-activedescendant={cursorShown && cursor ? items.cellId(cursor) : undefined}
      className="group/grid relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden outline-none focus-visible:shadow-[inset_0_0_0_2px_rgb(var(--c-accent)/0.6)]"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => {
        setKeyboardNav(false)
        startMarquee(e)
      }}
      onFocus={(e) => {
        // Tab into the grid: the cursor shows.
        if (e.target === e.currentTarget && e.currentTarget.matches(':focus-visible')) setKeyboardNav(true)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKeyboardNav(false)
      }}
      onContextMenu={onKeyboardContextMenu}
    >
      <div style={{ height: totalH }} className="relative" onMouseDown={startMarquee}>
        {rowEls}
        {marquee && (
          <div
            className="pointer-events-none absolute z-20 rounded-sm border border-accent bg-accent/10"
            style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
          />
        )}
      </div>
    </div>
  )
}
