// ============================================================
// Open fonts, one small tab each in the header (v1). Copy glyphs in one
// tab and paste them in another to reuse glyphs or component setups.
// ============================================================

import { useLayoutEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { X } from 'lucide-react'
import { selectDirty } from '../../stores/doc-store'
import { activateSession, useWorkspace, type Session } from '../../stores/workspace'
import { closeFont } from '../../app/document'
import { shortcutLabel } from '../../app/commands'
import { stripExtension } from '../../platform'
import { cn } from '../../lib/cn'
import { focusFallback } from '../ui/focus'
import { useTranslation } from '../../i18n'

/** Width of the edge fades: a tab kept in view stays clear of them. */
const FADE = 24

/**
 * A tab that held focus is closing: once it is gone, the tab shown takes focus (left on
 * the page or the grid, Delete would act on that font's glyphs).
 */
let focusAfterClose = false

/** Scroll the strip the least that shows the active tab clear of the fades. */
function showActiveTab(strip: HTMLElement): void {
  const tab = strip.querySelector<HTMLElement>('[data-active]')
  if (!tab) return
  const s = strip.getBoundingClientRect()
  const t = tab.getBoundingClientRect()
  if (t.left < s.left + FADE) strip.scrollLeft -= s.left + FADE - t.left
  else if (t.right > s.right - FADE) strip.scrollLeft += t.right - (s.right - FADE)
}

/** Fades the strip's edges where more tabs are scrolled out of sight. */
function edgeMask(left: boolean, right: boolean): string | undefined {
  if (!left && !right) return undefined
  return `linear-gradient(to right, ${left ? 'transparent, #000 24px' : '#000'}, ${right ? '#000 calc(100% - 24px), transparent' : '#000'})`
}

export function DocTabs(): React.ReactElement | null {
  const { t } = useTranslation()
  const sessions = useWorkspace((s) => s.sessions)
  const activeId = useWorkspace((s) => s.activeId)
  const strip = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  // Tabs shrink first; past their minimum the strip scrolls (wheel or Ctrl+Tab).
  useLayoutEffect(() => {
    const el = strip.current
    if (!el) return
    let width = el.clientWidth
    const update = (): void => {
      const left = el.scrollLeft > 1
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
      setEdges((e) => (e.left === left && e.right === right ? e : { left, right }))
    }
    update()
    const ro = new ResizeObserver(() => {
      // A narrower strip (a smaller window) could hide the active tab.
      if (el.clientWidth !== width) {
        width = el.clientWidth
        showActiveTab(el)
      }
      update()
    })
    ro.observe(el)
    for (const tab of el.children) ro.observe(tab)
    el.addEventListener('scroll', update, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', update)
    }
  }, [sessions])

  // Keep the active tab in sight (a new font opens at the end of the strip).
  useLayoutEffect(() => {
    if (strip.current) showActiveTab(strip.current)
  }, [activeId, sessions])

  // Right after the closed tab is gone (also after its save prompt): no frame or timer
  // between, so no key can reach the page first.
  const mounted = useRef(false)
  useLayoutEffect(() => {
    const wanted = focusAfterClose
    focusAfterClose = false
    // A strip that mounts (a font opened after the last one closed) takes nothing.
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (!wanted) return
    const shown = strip.current?.querySelector<HTMLElement>('[data-active] button')
    if (shown) shown.focus({ preventScroll: true })
    else focusFallback()
  }, [sessions])

  if (!sessions.length) return null
  const mask = edgeMask(edges.left, edges.right)
  return (
    <div
      ref={strip}
      role="group"
      aria-label={t('shell.tabs.openFonts')}
      // A vertical wheel scrolls the strip sideways.
      onWheel={(e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY
      }}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      className="flex min-w-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]"
    >
      {sessions.map((s) => (
        <DocTab key={s.id} session={s} active={s.id === activeId} />
      ))}
    </div>
  )
}

function DocTab({ session, active }: { session: Session; active: boolean }): React.ReactElement {
  const fileName = useStore(session.store, (s) => s.fileName)
  const filePath = useStore(session.store, (s) => s.filePath)
  const dirty = useStore(session.store, selectDirty)
  const { t } = useTranslation()
  const tabRef = useRef<HTMLDivElement>(null)
  // However the tab closes (×, middle click, Ctrl+W, the palette), focus in it goes to the
  // tab shown next. A removed component's layout cleanup runs while its DOM is still there.
  useLayoutEffect(
    () => () => {
      if (tabRef.current?.contains(document.activeElement)) focusAfterClose = true
    },
    []
  )
  const close = (): void => void closeFont(session.store)
  const name = stripExtension(fileName)
  const closeShortcut = shortcutLabel('file.close')
  return (
    <div
      ref={tabRef}
      data-active={active || undefined}
      className={cn(
        'group flex h-7 min-w-[5.5rem] max-w-[220px] items-center rounded transition-colors',
        // Square bottom corners when active: the accent underline reads as a straight line.
        active
          ? 'rounded-b-none bg-raised text-fg shadow-[inset_0_-2px_0_rgb(var(--c-accent))]'
          : 'text-muted hover:bg-hover hover:text-fg'
      )}
    >
      <button
        type="button"
        aria-current={active ? 'page' : undefined}
        aria-label={dirty ? t('shell.tabs.unsaved', { name }) : name}
        data-tip={filePath ?? t('shell.tabs.notSaved', { fileName })}
        onClick={() => activateSession(session.id)}
        // Middle click closes, like browser tabs (and does not start autoscroll).
        onMouseDown={(e) => {
          if (e.button === 1) e.preventDefault()
        }}
        onAuxClick={(e) => {
          if (e.button === 1) close()
        }}
        className="flex h-full min-w-0 items-center gap-1.5 rounded pl-2.5 pr-1 text-sm"
      >
        <span className="truncate">{name}</span>
        {dirty && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warn" aria-hidden />}
      </button>
      <button
        type="button"
        aria-label={t('shell.tabs.closeFont', { name })}
        data-tip={closeShortcut ? t('shell.tabs.close', { shortcut: closeShortcut }) : t('shell.tabs.closePlain')}
        onClick={() => close()}
        className={cn(
          'mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-subtle hover:bg-hover hover:text-fg focus-visible:opacity-100',
          !active && 'opacity-0 group-hover:opacity-100'
        )}
      >
        <X size={12} />
      </button>
    </div>
  )
}
