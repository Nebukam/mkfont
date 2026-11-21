// ============================================================
// Global overlays: tooltips (driven by `data-tip` attributes) and toasts.
// ============================================================

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { create } from 'zustand'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useTranslation } from '../../i18n'
import { Boundary } from './Boundary'

// ---- Tooltips ----

/** Tooltips; a failure there only stops tooltips. */
export function TooltipLayer(): React.ReactElement {
  return (
    <Boundary name="tooltips">
      <Tooltips />
    </Boundary>
  )
}

function Tooltips(): React.ReactElement | null {
  // dx: shift that keeps the tooltip inside the window, measured once per tooltip.
  const [tip, setTip] = useState<{ text: string; x: number; y: number; below: boolean; dx: number } | null>(null)
  const timer = useRef<number | null>(null)
  const current = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const hide = (): void => {
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = null
      current.current = null
      setTip(null)
    }
    const show = (target: EventTarget | null): void => {
      const el = (target as HTMLElement | null)?.closest?.('[data-tip]') as HTMLElement | null
      if (el === current.current) return
      hide()
      if (!el) return
      const text = el.getAttribute('data-tip')
      if (!text) return
      current.current = el
      timer.current = window.setTimeout(() => {
        if (!el.isConnected) return
        const r = el.getBoundingClientRect()
        const below = r.top < 60
        setTip({ text, x: r.left + r.width / 2, y: below ? r.bottom + 6 : r.top - 6, below, dx: 0 })
      }, 450)
    }
    const onOver = (e: PointerEvent): void => show(e.target)
    // Keyboard focus shows the tip too (icon names, shortcuts); mouse focus already had
    // hover. Not on text fields and selects: they match :focus-visible on a click too,
    // and a tip over the field being typed in only gets in the way.
    const onFocus = (e: FocusEvent): void => {
      const el = e.target as HTMLElement | null
      if (el?.matches?.(':focus-visible') && !el.matches('input, textarea, select, [contenteditable="true"]')) show(el)
    }
    // Only the tip of the element losing focus goes (menu items take focus on hover:
    // that must not cancel the tip the pointer just asked for).
    const onBlur = (e: FocusEvent): void => {
      if (current.current?.contains(e.target as Node | null)) hide()
    }
    const onKey = (e: KeyboardEvent): void => {
      // Tab moves to a new tip through focusin; any other key dismisses the current one.
      if (e.key !== 'Tab') hide()
    }
    window.addEventListener('pointerover', onOver)
    window.addEventListener('focusin', onFocus)
    window.addEventListener('focusout', onBlur)
    window.addEventListener('pointerdown', hide, true)
    window.addEventListener('wheel', hide, { passive: true })
    // Capture: fields and dialogs stop their keys from bubbling.
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('focusin', onFocus)
      window.removeEventListener('focusout', onBlur)
      window.removeEventListener('pointerdown', hide, true)
      window.removeEventListener('wheel', hide)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [])

  const ref = useRef<HTMLDivElement>(null)
  // Before paint: measure the unshifted tooltip and keep it inside the window.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !tip || tip.dx !== 0) return
    const r = el.getBoundingClientRect()
    const dx = r.left < 4 ? 4 - r.left : r.right > window.innerWidth - 4 ? window.innerWidth - 4 - r.right : 0
    if (dx !== 0) setTip({ ...tip, dx })
  }, [tip])

  if (!tip) return null
  return createPortal(
    <div
      ref={ref}
      className="pointer-events-none fixed z-[70] max-w-[280px] animate-fade-in whitespace-pre-line rounded border border-line bg-raised px-2 py-1 text-xs text-fg shadow-pop"
      style={{
        left: tip.x + tip.dx,
        top: tip.y,
        transform: `translate(-50%, ${tip.below ? '0' : '-100%'})`
      }}
    >
      {tip.text}
    </div>,
    document.body
  )
}

// ---- Toasts ----

export type ToastKind = 'info' | 'success' | 'warning' | 'error'

interface Toast {
  id: number
  kind: ToastKind
  message: string
  detail?: string
  action?: { label: string; run: () => void }
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>, ms?: number) => number
  dismiss: (id: number) => void
  /**
   * Toasts wait while something holds them: the pointer over one (`hover-<id>`)
   * or focus inside them (`focus`), so there is time to read one or reach its action.
   */
  hold: (holder: string, on: boolean) => void
}

let toastId = 0
/** Time left before each toast closes, and its running timer. */
const timers = new Map<number, { left: number; since: number; handle?: ReturnType<typeof setTimeout> }>()
const holders = new Set<string>()

export const useToasts = create<ToastState>()((set, get) => {
  const run = (id: number): void => {
    const t = timers.get(id)
    if (!t || holders.size) return
    t.since = Date.now()
    t.handle = setTimeout(() => get().dismiss(id), t.left)
  }
  return {
    toasts: [],
    push: (t, ms = 3500) => {
      const id = ++toastId
      const kept = get().toasts.slice(-4)
      for (const old of get().toasts) if (!kept.includes(old)) get().dismiss(old.id)
      set({ toasts: [...kept, { ...t, id }] })
      if (ms > 0) {
        timers.set(id, { left: ms, since: Date.now() })
        run(id)
      }
      return id
    },
    dismiss: (id) => {
      clearTimeout(timers.get(id)?.handle)
      timers.delete(id)
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      // A toast that closes under the pointer gets no pointerleave.
      get().hold(`hover-${id}`, false)
    },
    hold: (holder, on) => {
      const before = holders.size > 0
      if (on) holders.add(holder)
      else holders.delete(holder)
      if (before === holders.size > 0) return
      for (const [id, t] of timers) {
        if (on) {
          clearTimeout(t.handle)
          t.left -= Date.now() - t.since
        } else {
          // A moment to move away before it goes.
          t.left = Math.max(t.left, 1500)
          run(id)
        }
      }
    }
  }
})

export const toast = {
  info: (message: string, detail?: string) => useToasts.getState().push({ kind: 'info', message, detail }),
  success: (message: string, detail?: string, action?: Toast['action']) =>
    useToasts.getState().push({ kind: 'success', message, detail, action }, action ? 6000 : 3500),
  warning: (message: string, detail?: string) => useToasts.getState().push({ kind: 'warning', message, detail }, 6000),
  error: (message: string, detail?: string) => useToasts.getState().push({ kind: 'error', message, detail }, 8000),
  action: (message: string, action: { label: string; run: () => void }) =>
    useToasts.getState().push({ kind: 'info', message, action }, 6000)
}

const ICONS = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle }
const COLORS = { info: 'text-emphasis', success: 'text-ok', warning: 'text-warn', error: 'text-danger' }

/** Toasts; the ones showing when a toast fails to render are dropped, and new ones show again. */
export function ToastHost(): React.ReactElement {
  const toasts = useToasts((s) => s.toasts)
  return (
    <Boundary name="toasts" resetKeys={[toasts]} onError={dropToasts}>
      <Toasts />
    </Boundary>
  )
}

function dropToasts(): void {
  const { toasts, dismiss } = useToasts.getState()
  for (const item of toasts) dismiss(item.id)
}

function Toasts(): React.ReactElement {
  const { t } = useTranslation()
  const toasts = useToasts((s) => s.toasts)
  const dismiss = useToasts((s) => s.dismiss)
  const hold = useToasts((s) => s.hold)
  const ref = useRef<HTMLDivElement>(null)
  // Focus leaves without a blur event when its toast closes.
  useEffect(() => {
    if (!ref.current?.contains(document.activeElement)) hold('focus', false)
  }, [toasts, hold])
  return createPortal(
    // Always mounted, so screen readers announce each toast as it is added.
    <div
      ref={ref}
      aria-live="polite"
      className="pointer-events-none fixed bottom-9 right-3 z-[65] flex w-[340px] flex-col gap-2"
      onFocus={() => hold('focus', true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hold('focus', false)
      }}
    >
      {toasts.map((item) => {
        const Icon = ICONS[item.kind]
        return (
          <div
            key={item.id}
            className="pointer-events-auto flex animate-slide-up items-start gap-2.5 rounded-md border border-line bg-panel px-3 py-2.5 shadow-pop"
            onPointerEnter={() => hold(`hover-${item.id}`, true)}
            onPointerLeave={() => hold(`hover-${item.id}`, false)}
          >
            <Icon size={15} className={cn('mt-px shrink-0', COLORS[item.kind])} />
            <div className="min-w-0 flex-1">
              <div className="text-sm text-fg">{item.message}</div>
              {item.detail && <div className="mt-0.5 break-words text-xs text-muted">{item.detail}</div>}
              {item.action && (
                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-accent hover:underline"
                  onClick={() => {
                    dismiss(item.id)
                    item.action!.run()
                  }}
                >
                  {item.action.label}
                </button>
              )}
            </div>
            <button type="button" className="text-subtle hover:text-fg" onClick={() => dismiss(item.id)} aria-label={t('ui.toast.dismiss')}>
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>,
    document.body
  )
}
