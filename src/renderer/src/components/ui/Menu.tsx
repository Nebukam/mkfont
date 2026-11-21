// ============================================================
// Menus: dropdowns (anchored to a trigger) and context menus.
// ============================================================

import { cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { create } from 'zustand'
import { Check, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import { errorMessage } from '../../lib/errors'
import { t } from '../../i18n'
import { restoreFocus } from './focus'
import { Boundary } from './Boundary'
import { toast } from './Overlays'

export type MenuItem =
  | {
      label: string
      icon?: LucideIcon
      shortcut?: string
      onSelect?: () => void
      disabled?: boolean
      danger?: boolean
      checked?: boolean
      hint?: string
      submenu?: MenuItem[]
    }
  | 'separator'
  | { header: string }

// ---- Context menu store ----

interface MenuState {
  menu: { x: number; y: number; items: MenuItem[] } | null
  open: (x: number, y: number, items: MenuItem[]) => void
  close: () => void
}

export const useContextMenu = create<MenuState>()((set) => ({
  menu: null,
  open: (x, y, items) => set({ menu: { x, y, items } }),
  close: () => set({ menu: null })
}))

/** Close callback of the open dropdown: only one menu (dropdown or context) is open at a time. */
let closeOpenDropdown: (() => void) | null = null

export function openContextMenu(e: { clientX: number; clientY: number; preventDefault: () => void }, items: MenuItem[]): void {
  e.preventDefault()
  closeOpenDropdown?.()
  useContextMenu.getState().open(e.clientX, e.clientY, items)
}

// ---- Menu list ----

function MenuList({
  items,
  x,
  y,
  flipX,
  onClose,
  onBack,
  minWidth = 200,
  level = 0
}: {
  items: MenuItem[]
  x: number
  y: number
  /** Submenus: right edge to use when there is no room on the right (the parent's left side). */
  flipX?: number
  onClose: () => void
  /** Submenus: close this level only (ArrowLeft). */
  onBack?: () => void
  minWidth?: number
  level?: number
}): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })
  const [sub, setSub] = useState<{ index: number; x: number; y: number; flipX: number } | null>(null)
  const [hover, setHover] = useState(-1)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    let nx = x
    let ny = y
    if (nx + r.width > window.innerWidth - 4) nx = flipX !== undefined ? flipX - r.width : window.innerWidth - r.width - 4
    if (ny + r.height > window.innerHeight - 4) ny = Math.max(4, window.innerHeight - r.height - 4)
    setPos({ x: Math.max(4, nx), y: ny })
  }, [x, y, flipX])

  // Keyboard: the menu takes focus while open, and gives it back when it closes
  // (to the glyph grid when the chosen item removed the button that opened it).
  useLayoutEffect(() => {
    const menu = ref.current
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    menu?.focus({ preventScroll: true })
    return () => restoreFocus(previous, menu)
  }, [])

  // The highlighted item holds focus, so screen readers follow the arrow keys.
  useEffect(() => {
    if (hover >= 0) ref.current?.querySelector<HTMLElement>(`:scope > [data-index="${hover}"]`)?.focus({ preventScroll: true })
  }, [hover])

  const openSubmenu = (i: number, el: HTMLElement): void => {
    const r = el.getBoundingClientRect()
    setSub({ index: i, x: r.right - 2, y: r.top - 4, flipX: r.left + 2 })
  }

  const actionable = items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => typeof it === 'object' && 'label' in it && !it.disabled)

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[60] animate-fade-in rounded-md border border-line bg-panel py-1 shadow-pop"
      style={{ left: pos.x, top: pos.y, minWidth }}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        // Keys stay in the menu: the grid behind it must not react.
        if (e.key !== 'Escape') e.stopPropagation()
        if (e.key === 'Tab') {
          // Like native menus: Tab closes the menu (focus returns to where it was).
          e.preventDefault()
          onClose()
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          if (!actionable.length) return
          const idx = actionable.findIndex((a) => a.i === hover)
          const down = e.key === 'ArrowDown'
          const next = idx === -1 ? (down ? 0 : actionable.length - 1) : (idx + (down ? 1 : actionable.length - 1)) % actionable.length
          setHover(actionable[next].i)
          setSub(null)
        } else if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') && hover >= 0) {
          e.preventDefault()
          const it = items[hover]
          if (typeof it !== 'object' || !('label' in it) || it.disabled) return
          if (it.submenu) {
            const el = ref.current?.querySelector<HTMLElement>(`[data-index="${hover}"]`)
            if (el) openSubmenu(hover, el)
          } else if (e.key !== 'ArrowRight' && it.onSelect) {
            onClose()
            it.onSelect()
          }
        } else if (e.key === 'ArrowLeft' && onBack) {
          e.preventDefault()
          onBack()
        }
      }}
      tabIndex={-1}
    >
      {items.map((it, i) => {
        if (it === 'separator') return <div key={i} role="separator" className="my-1 h-px bg-line" />
        if ('header' in it)
          return (
            <div key={i} role="presentation" className="label-xs px-3 pb-0.5 pt-1.5">
              {it.header}
            </div>
          )
        const Icon = it.icon
        return (
          <button
            key={i}
            type="button"
            role="menuitem"
            tabIndex={-1}
            data-index={i}
            disabled={it.disabled}
            data-tip={it.hint}
            aria-haspopup={it.submenu ? 'menu' : undefined}
            aria-expanded={it.submenu ? sub?.index === i : undefined}
            onMouseEnter={(e) => {
              setHover(i)
              if (it.submenu) openSubmenu(i, e.currentTarget)
              else setSub(null)
            }}
            onClick={() => {
              if (it.submenu) return
              onClose()
              it.onSelect?.()
            }}
            className={cn(
              // The highlight shows focus: no outline on top of it.
              'flex h-7 w-full items-center gap-2 px-3 text-left text-xs outline-none disabled:opacity-40',
              hover === i ? (it.danger ? 'bg-danger-solid text-white' : 'bg-accent-solid text-accent-fg') : it.danger ? 'text-danger' : 'text-fg'
            )}
          >
            <span className="flex w-3.5 shrink-0 justify-center">
              {it.checked ? <Check size={13} /> : Icon ? <Icon size={13} /> : null}
            </span>
            <span className="flex-1 truncate">{it.label}</span>
            {it.shortcut && <span className={cn('pl-4 text-2xs', hover !== i && 'text-subtle')}>{it.shortcut}</span>}
            {it.submenu && <ChevronRight size={12} className="opacity-70" />}
          </button>
        )
      })}
      {sub && (() => {
        const it = items[sub.index]
        return typeof it === 'object' && 'submenu' in it && it.submenu ? (
          <MenuList items={it.submenu} x={sub.x} y={sub.y} flipX={sub.flipX} onClose={onClose} onBack={() => setSub(null)} level={level + 1} />
        ) : null
      })()}
    </div>
  )
}

/** Renders the active context menu (mount once). */
export function ContextMenuHost(): React.ReactElement | null {
  const menu = useContextMenu((s) => s.menu)
  const close = useContextMenu((s) => s.close)
  useEffect(() => {
    if (!menu) return
    const onDown = (): void => close()
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('blur', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('blur', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu, close])
  if (!menu) return null
  return createPortal(
    // A menu that fails while showing closes; the window stays.
    <Boundary name="context-menu" onError={(e) => menuFailed(close, e)}>
      <MenuList items={menu.items} x={menu.x} y={menu.y} onClose={close} />
    </Boundary>,
    document.body
  )
}

function menuFailed(close: () => void, error: Error): void {
  close()
  toast.error(t('shell.crash.menuClosed'), errorMessage(error))
}

/** A button that opens a dropdown menu below it. */
export function DropdownMenu({
  trigger,
  items,
  align = 'start',
  minWidth
}: {
  trigger: (props: { open: boolean; toggle: (e: React.MouseEvent<HTMLElement>) => void }) => ReactNode
  items: MenuItem[] | (() => MenuItem[])
  align?: 'start' | 'end'
  minWidth?: number
}): React.ReactElement {
  const [state, setState] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => {
    if (!state) return
    const close = (): void => setState(null)
    closeOpenDropdown = close
    const onDown = (): void => setState(null)
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setState(null)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    window.addEventListener('blur', onDown)
    return () => {
      if (closeOpenDropdown === close) closeOpenDropdown = null
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', onDown)
    }
  }, [state])
  const toggle = (e: React.MouseEvent<HTMLElement>): void => {
    e.stopPropagation()
    if (state) {
      setState(null)
      return
    }
    // Opening this menu closes any other one.
    closeOpenDropdown?.()
    useContextMenu.getState().close()
    const r = e.currentTarget.getBoundingClientRect()
    setState({ x: align === 'end' ? r.right - (minWidth ?? 200) : r.left, y: r.bottom + 2 })
  }
  const list = typeof items === 'function' ? (state ? items() : []) : items
  const button = trigger({ open: !!state, toggle })
  return (
    <>
      <span
        onMouseDown={(e) => {
          e.stopPropagation()
          // Like native menus, a menu opened with the mouse leaves focus where it was:
          // the glyph grid keeps its single-key shortcuts after a menu command.
          e.preventDefault()
        }}
        className="contents"
      >
        {/* The trigger tells assistive tech that it opens a menu, and whether it is open. */}
        {isValidElement(button) ? cloneElement(button as React.ReactElement<Record<string, unknown>>, { 'aria-haspopup': 'menu', 'aria-expanded': !!state }) : button}
      </span>
      {state && createPortal(<MenuList items={list} x={state.x} y={state.y} onClose={() => setState(null)} minWidth={minWidth} />, document.body)}
    </>
  )
}
