// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import { moveGridFocus, restoreFocus } from '../focus'
import { DropdownMenu } from '../Menu'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// Wrapped chips: row 0 = a b c (x 0,40,80), row 1 = d e (x 0,60; e is wide), row 2 = f (disabled) g
const LAYOUT: Record<string, [number, number, number]> = {
  a: [0, 0, 30], b: [0, 40, 30], c: [0, 80, 30],
  d: [30, 0, 50], e: [30, 60, 60],
  f: [60, 0, 30], g: [60, 40, 30]
}

describe('moveGridFocus', () => {
  it('moves by arrows over enabled buttons, to the nearest button of the next row', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() =>
      root.render(
        h('div', { onKeyDown: moveGridFocus, id: 'g' }, ...Object.keys(LAYOUT).map((k) => h('button', { key: k, id: k, disabled: k === 'f' }, k)))
      )
    )
    for (const [k, [top, left, width]] of Object.entries(LAYOUT)) {
      const el = document.getElementById(k)!
      Object.defineProperty(el, 'offsetTop', { value: top })
      Object.defineProperty(el, 'offsetLeft', { value: left })
      Object.defineProperty(el, 'offsetWidth', { value: width })
    }
    const press = (key: string): string => {
      act(() => void document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })))
      return (document.activeElement as HTMLElement).id
    }
    document.getElementById('c')!.focus()
    expect(press('ArrowDown')).toBe('e') // c center 95: d center 25, e center 90
    expect(press('ArrowDown')).toBe('g') // f is disabled and skipped
    expect(press('ArrowDown')).toBe('g') // last row: stays
    expect(press('ArrowUp')).toBe('d') // g center 55: d center 25 is nearer than e center 90
    expect(press('ArrowLeft')).toBe('c') // linear order wraps to the previous row
    expect(press('ArrowUp')).toBe('c') // first row: stays
    expect(press('Home')).toBe('a')
    expect(press('ArrowLeft')).toBe('a') // clamped
    expect(press('End')).toBe('g')
    expect(press('Home')).toBe('a')
    expect(press('ArrowRight')).toBe('b')
    act(() => root.unmount())
    container.remove()
  })

  it('opens menus from the mouse without taking focus, and says the button opens a menu', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() =>
      root.render(
        h(DropdownMenu, {
          items: [{ label: 'Select all', onSelect: () => undefined }],
          trigger: ({ toggle }) => h('button', { id: 'trigger', onClick: toggle }, 'More')
        })
      )
    )
    const trigger = document.getElementById('trigger')!
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    // The grid keeps focus (and its single-key shortcuts) after a menu command.
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    trigger.dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    act(() => root.unmount())
    container.remove()
  })

  it('gives focus back to the opener, or to the grid when the action removed it', async () => {
    document.body.innerHTML = '<div id="grid" tabindex="0" data-focus-fallback></div><button id="opener">o</button><div id="menu"><button id="item">i</button></div><input id="field">'
    const byId = (id: string): HTMLElement => document.getElementById(id)!
    const frame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()))
    byId('item').focus()
    restoreFocus(byId('opener'), byId('menu'))
    expect(document.activeElement?.id).toBe('opener')
    // Focus the closing action moved on purpose stays there.
    byId('field').focus()
    restoreFocus(byId('opener'), byId('menu'))
    await frame()
    expect(document.activeElement?.id).toBe('field')
    // The chosen item deleted the glyph whose inspector held the opener.
    const opener = byId('opener')
    byId('item').focus()
    opener.remove()
    restoreFocus(opener, byId('menu'))
    byId('menu').remove()
    await frame()
    expect(document.activeElement?.id).toBe('grid')
  })
})
