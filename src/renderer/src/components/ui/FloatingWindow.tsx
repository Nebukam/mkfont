// ============================================================
// A floating window: a panel over the app that is moved by its title bar and resized by
// its corner, and that does not take the app away (no backdrop, nothing behind it goes
// inert). It renders in place, inside the app's root, so an open dialog still covers it
// and makes it inert like the rest.
//
// The window has its own keys (`data-own-keys`): the app's single-key shortcuts (Delete,
// Escape, digits) never act from inside it.
// ============================================================

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './Button'
import { cn } from '../../lib/cn'

export interface FloatingRect {
  x: number
  y: number
  width: number
  height: number
}

/** Of the title bar, this much stays inside the app window: enough to grab it back. */
const KEEP_IN_VIEW = 96
const TITLE_BAR = 32
const KEY_STEP = 16
const KEY_STEP_BIG = 64

/** A rect that fits the viewport: no larger than it, no smaller than `min`, title bar in reach. */
export function clampFloatingRect(r: FloatingRect, min: { width: number; height: number }, vw: number, vh: number): FloatingRect {
  const width = Math.round(Math.max(Math.min(min.width, vw), Math.min(vw, r.width)))
  const height = Math.round(Math.max(Math.min(min.height, vh), Math.min(vh, r.height)))
  const x = Math.round(Math.max(KEEP_IN_VIEW - width, Math.min(vw - KEEP_IN_VIEW, r.x)))
  const y = Math.round(Math.max(0, Math.min(vh - TITLE_BAR, r.y)))
  return { x, y, width, height }
}

export interface FloatingWindowProps {
  title: ReactNode
  /** Where the window was left, or null for `defaultRect`. */
  rect: FloatingRect | null
  /** Where it opens the first time (and after a double-click on its title bar). */
  defaultRect: (viewportWidth: number, viewportHeight: number) => FloatingRect
  min: { width: number; height: number }
  /** A move or resize is done (null: back to the default place). Not called while dragging. */
  onRectChange: (rect: FloatingRect | null) => void
  onClose: () => void
  /** Names of its controls, in the app's language. */
  labels: { close: string; move: string; resize: string }
  /** Buttons at the right of the title bar, before Close. */
  headerActions?: ReactNode
  className?: string
  children: ReactNode
}

type Drag = { kind: 'move' | 'resize'; px: number; py: number; from: FloatingRect; moved: boolean }

export function FloatingWindow({ title, rect, defaultRect, min, onRectChange, onClose, labels, headerActions, className, children }: FloatingWindowProps): React.ReactElement {
  const titleId = useId()
  const drag = useRef<Drag | null>(null)
  // The rect while it is dragged: the stored one is written once, on release.
  const [dragged, setDragged] = useState<FloatingRect | null>(null)
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = (): void => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Kept in the window when shown; the stored place is left as it is (it is back when there is room).
  const shown = clampFloatingRect(dragged ?? rect ?? defaultRect(viewport.w, viewport.h), min, viewport.w, viewport.h)

  const stop = (): void => {
    drag.current = null
    setDragged(null)
  }
  const pointer = (kind: Drag['kind']) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      // Buttons in the title bar keep their clicks.
      if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return
      e.currentTarget.setPointerCapture(e.pointerId)
      drag.current = { kind, px: e.clientX, py: e.clientY, from: shown, moved: false }
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const d = drag.current
      if (!d || d.kind !== kind) return
      const dx = e.clientX - d.px
      const dy = e.clientY - d.py
      // A click that slips a pixel (a double-click too) is not a move.
      if (!d.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return
      d.moved = true
      setDragged(kind === 'move' ? { ...d.from, x: d.from.x + dx, y: d.from.y + dy } : { ...d.from, width: d.from.width + dx, height: d.from.height + dy })
    },
    onPointerUp: () => {
      const d = drag.current
      if (!d || d.kind !== kind) return
      if (d.moved && dragged) onRectChange(clampFloatingRect(dragged, min, viewport.w, viewport.h))
      stop()
    },
    // Taken away before the release: back to where it was.
    onLostPointerCapture: () => {
      if (drag.current?.kind === kind) stop()
    }
  })
  const keys = (kind: Drag['kind']) => (e: React.KeyboardEvent<HTMLElement>) => {
    // Chords stay with the app's shortcuts.
    if (e.altKey || e.ctrlKey || e.metaKey || e.target !== e.currentTarget) return
    const step = e.shiftKey ? KEY_STEP_BIG : KEY_STEP
    const [dx, dy] = e.key === 'ArrowLeft' ? [-step, 0] : e.key === 'ArrowRight' ? [step, 0] : e.key === 'ArrowUp' ? [0, -step] : e.key === 'ArrowDown' ? [0, step] : [0, 0]
    if (!dx && !dy) return
    e.preventDefault()
    const next = kind === 'move' ? { ...shown, x: shown.x + dx, y: shown.y + dy } : { ...shown, width: shown.width + dx, height: shown.height + dy }
    onRectChange(clampFloatingRect(next, min, viewport.w, viewport.h))
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-own-keys
      tabIndex={-1}
      className={cn(
        'fixed z-30 flex animate-fade-in flex-col overflow-hidden rounded-lg border border-line-strong bg-panel shadow-pop outline-none',
        className
      )}
      style={{ left: shown.x, top: shown.y, width: shown.width, height: shown.height }}
    >
      <div
        className="flex h-8 shrink-0 cursor-move touch-none select-none items-center gap-1 border-b border-line bg-raised pl-1 pr-1.5"
        {...pointer('move')}
        onDoubleClick={(e) => {
          if (!(e.target as HTMLElement).closest('button')) onRectChange(null)
        }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={labels.move}
          data-tip={labels.move}
          onKeyDown={keys('move')}
          className="flex h-6 w-4 shrink-0 cursor-move items-center justify-center rounded text-subtle hover:text-fg"
        >
          <span aria-hidden className="grid grid-cols-2 gap-0.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="h-0.5 w-0.5 rounded-full bg-current" />
            ))}
          </span>
        </div>
        <div id={titleId} className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
          {title}
        </div>
        {headerActions}
        <IconButton icon={X} tip={labels.close} onClick={onClose} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <div
        role="button"
        tabIndex={0}
        aria-label={labels.resize}
        onKeyDown={keys('resize')}
        className="group absolute bottom-0 right-0 z-10 h-4 w-4 cursor-nwse-resize touch-none outline-none"
        {...pointer('resize')}
      >
        {/* The corner mark doubles as the focus indicator (the handle opts out of the outline ring). */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0.5 right-0.5 h-2 w-2 border-b-2 border-r-2 border-line-strong transition-colors group-hover:border-accent group-focus-visible:border-accent"
        />
      </div>
    </div>
  )
}
