// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { FloatingWindow, clampFloatingRect, type FloatingRect } from '../FloatingWindow'
import { Dialog } from '../Dialog'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const MIN = { width: 300, height: 200 }
const LABELS = { close: 'Close', move: 'Move the window', resize: 'Resize the window' }

let root: Root
let container: HTMLElement
let changes: (FloatingRect | null)[]
let closed: number

function show(rect: FloatingRect | null, extra?: React.ReactNode): void {
  act(() =>
    root.render(
      h(
        'div',
        null,
        h(
          FloatingWindow,
          {
            title: 'Outline: A',
            rect,
            defaultRect: () => ({ x: 40, y: 50, width: 400, height: 300 }),
            min: MIN,
            onRectChange: (r: FloatingRect | null) => void changes.push(r),
            onClose: () => void closed++,
            labels: LABELS,
            children: h('button', { id: 'inside' }, 'Inside')
          }
        ),
        extra
      )
    )
  )
}

const win = (): HTMLElement => document.querySelector<HTMLElement>('[role="dialog"][data-own-keys]')!
const byLabel = (label: string): HTMLElement => win().querySelector<HTMLElement>(`[aria-label="${label}"]`)!
const press = (el: HTMLElement, key: string, init: KeyboardEventInit = {}): void =>
  act(() => void el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })))

beforeEach(() => {
  // The app renders in #root, which dialogs make inert.
  container = document.createElement('div')
  container.id = 'root'
  document.body.appendChild(container)
  root = createRoot(container)
  changes = []
  closed = 0
  Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: 700, configurable: true })
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('clampFloatingRect', () => {
  it('keeps the size within the window and its limits, and the title bar in reach', () => {
    expect(clampFloatingRect({ x: 10, y: 20, width: 400, height: 300 }, MIN, 1000, 700)).toEqual({ x: 10, y: 20, width: 400, height: 300 })
    expect(clampFloatingRect({ x: 10, y: 20, width: 50, height: 5000 }, MIN, 1000, 700)).toEqual({ x: 10, y: 20, width: 300, height: 700 })
    // Off to the right and below: back so that the title bar can be grabbed.
    expect(clampFloatingRect({ x: 5000, y: 5000, width: 400, height: 300 }, MIN, 1000, 700)).toEqual({ x: 904, y: 668, width: 400, height: 300 })
    // Off to the left and above.
    expect(clampFloatingRect({ x: -5000, y: -50, width: 400, height: 300 }, MIN, 1000, 700)).toEqual({ x: -304, y: 0, width: 400, height: 300 })
    // A window smaller than the least size.
    expect(clampFloatingRect({ x: 0, y: 0, width: 400, height: 300 }, MIN, 250, 150)).toMatchObject({ width: 250, height: 150 })
  })
})

describe('floating window', () => {
  it('is a named, non-modal dialog at its stored place, or its default one', () => {
    show(null)
    const w = win()
    expect(w.getAttribute('aria-modal')).toBe('false')
    expect(document.getElementById(w.getAttribute('aria-labelledby')!)!.textContent).toBe('Outline: A')
    expect([w.style.left, w.style.top, w.style.width, w.style.height]).toEqual(['40px', '50px', '400px', '300px'])
    show({ x: 5000, y: 60, width: 500, height: 320 })
    // Shown within the window; the stored place is not rewritten.
    expect([win().style.left, win().style.width]).toEqual(['904px', '500px'])
    expect(changes).toEqual([])
  })

  it('moves and resizes from the keyboard, in steps, within the window', () => {
    show({ x: 100, y: 100, width: 400, height: 300 })
    press(byLabel(LABELS.move), 'ArrowRight')
    press(byLabel(LABELS.move), 'ArrowUp', { shiftKey: true })
    press(byLabel(LABELS.resize), 'ArrowDown')
    press(byLabel(LABELS.resize), 'ArrowLeft', { shiftKey: true })
    expect(changes).toEqual([
      { x: 116, y: 100, width: 400, height: 300 },
      { x: 100, y: 36, width: 400, height: 300 },
      { x: 100, y: 100, width: 400, height: 316 },
      { x: 100, y: 100, width: 336, height: 300 }
    ])
    // Chords stay with the app; other keys are not the handle's.
    press(byLabel(LABELS.move), 'ArrowRight', { ctrlKey: true })
    press(byLabel(LABELS.move), 'a')
    expect(changes.length).toBe(4)
  })

  it('goes back to its default place on a double-click of its title bar, and closes from its button', () => {
    show({ x: 100, y: 100, width: 400, height: 300 })
    const title = document.getElementById(win().getAttribute('aria-labelledby')!)!
    act(() => void title.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
    expect(changes).toEqual([null])
    act(() => byLabel(LABELS.close).click())
    expect(closed).toBe(1)
    // A double-click on a title bar button is two presses of the button, not a reset.
    act(() => void byLabel(LABELS.close).dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
    expect(changes).toEqual([null])
  })

  it('is covered by an open dialog like the rest of the app', () => {
    show({ x: 100, y: 100, width: 400, height: 300 })
    expect(container.contains(win())).toBe(true)
    expect(container.inert).toBeFalsy()
    const holder = document.createElement('div')
    document.body.appendChild(holder)
    const dialogRoot = createRoot(holder)
    act(() => dialogRoot.render(h(Dialog, { title: 'Confirm', onClose: () => undefined, children: 'Sure?' })))
    expect(container.inert).toBe(true)
    act(() => dialogRoot.unmount())
    expect(container.inert).toBeFalsy()
    holder.remove()
  })
})
