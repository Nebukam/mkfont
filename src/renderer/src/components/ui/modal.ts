// ============================================================
// Modal layers (dialogs, the command palette): the app behind them is inert,
// focus moves in and comes back on close, and Escape closes the top one only.
// ============================================================

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { restoreFocus } from './focus'

/** Open modal overlays, bottom to top. */
const stack: HTMLElement[] = []

/** Only the top layer takes input: the app and the layers below it are inert. */
function sync(): void {
  const root = document.getElementById('root')
  if (root) root.inert = stack.length > 0
  stack.forEach((el, i) => {
    el.inert = i < stack.length - 1
  })
}

/**
 * Make `overlay` modal while it is mounted. Focus goes to the first
 * `[data-autofocus]`, input, textarea or select in `panel` (else to the panel
 * itself, which needs tabIndex={-1}), and back to where it was on close.
 */
export function useModal(overlay: RefObject<HTMLElement | null>, panel: RefObject<HTMLElement | null>, onClose: () => void): void {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useLayoutEffect(() => {
    const layer = overlay.current
    const box = panel.current
    if (!layer || !box) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    stack.push(layer)
    sync()
    const first = box.querySelector<HTMLElement>('[data-autofocus], input:not([disabled]), textarea, select')
    ;(first ?? box).focus({ preventScroll: true })
    return () => {
      stack.splice(stack.indexOf(layer), 1)
      sync()
      restoreFocus(previous, layer)
    }
  }, [overlay, panel])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape' || stack[stack.length - 1] !== overlay.current) return
      // A menu opened from the dialog closes first.
      if (document.querySelector('[role="menu"]')) return
      e.stopPropagation()
      e.preventDefault()
      closeRef.current()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [overlay])
}
