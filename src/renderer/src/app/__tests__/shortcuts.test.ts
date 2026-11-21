// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { eventSpec, installKeyboard } from '../commands'
import { useDocStore } from '../../stores/doc-store'
import { useSelectionStore } from '../../stores/selection-store'
import { createFamily, createGlyph } from '../../core/model'
import type { Glyph } from '../../types/font'
import { commitFieldForSwitch, keepTypingKeys, settleFieldFocus, trackFieldEdit } from '../../components/ui/focus'
import { useDialogs } from '../dialogs'
import { useOutlineEditorStore } from '../../stores/outline-editor-store'

let uninstall: () => void

beforeEach(() => {
  const family = createFamily()
  const glyphs = new Map<string, Glyph>([['0041', createGlyph('0041', family.transforms as never)]])
  useDocStore.getState().load({ family, glyphs } as never, { fileName: 't.mkfont' })
  document.body.innerHTML =
    '<div role="grid" tabindex="0"></div><button id="create">Create</button>' +
    '<div id="preview" role="region" tabindex="0"></div><select id="case"><option>a</option></select>' +
    '<input id="size" type="range">'
  uninstall = installKeyboard()
})
afterEach(() => uninstall())

const selectA = (): void => useSelectionStore.getState().setSelection(['0041'], '0041')
const selected = (): string[] => useSelectionStore.getState().keys
const hasA = (): boolean => useDocStore.getState().data!.glyphs.has('0041')
const press = (el: HTMLElement, key: string): void => void el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
const click = (el: HTMLElement): void => {
  el.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  el.focus()
}

describe('single-key shortcuts', () => {
  it('act from the grid, and from a button the mouse pressed, but not from one reached with the keyboard', () => {
    const grid = document.querySelector<HTMLElement>('[role="grid"]')!
    const button = document.getElementById('create')!

    selectA()
    grid.focus()
    press(grid, 'Escape')
    expect(selected()).toEqual([])

    // Clicked with the mouse: Escape still deselects (as before any focus moved).
    selectA()
    button.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    button.focus()
    press(button, 'Escape')
    expect(selected()).toEqual([])

    // Reached with Tab: the button keeps its keys.
    selectA()
    grid.focus()
    press(grid, 'Tab')
    button.focus()
    press(button, 'Escape')
    expect(selected()).toEqual(['0041'])
  })

  it('act from any region the mouse focused, except a select (its type-ahead)', () => {
    const preview = document.getElementById('preview')!
    const select = document.getElementById('case')!

    selectA()
    click(preview)
    press(preview, 'Escape')
    expect(selected()).toEqual([])

    selectA()
    click(select)
    press(select, 'Escape')
    expect(selected()).toEqual(['0041'])
  })

  it('do not delete glyphs from the text preview or a slider the mouse focused', () => {
    for (const el of [document.getElementById('preview')!, document.getElementById('size')!]) {
      for (const key of ['Delete', 'Backspace']) {
        selectA()
        click(el)
        press(el, key)
        expect(hasA()).toBe(true)
      }
      // Escape still deselects from there.
      click(el)
      press(el, 'Escape')
      expect(selected()).toEqual([])
    }
  })

  it('delete glyphs from a button the mouse pressed, and from the grid', () => {
    const button = document.getElementById('create')!
    selectA()
    click(button)
    press(button, 'Delete')
    expect(hasA()).toBe(false)

    useDocStore.getState().undo()
    expect(hasA()).toBe(true)
    const grid = document.querySelector<HTMLElement>('[role="grid"]')!
    selectA()
    grid.focus()
    press(grid, 'Backspace')
    expect(hasA()).toBe(false)
  })
})

describe('a part of the window with its own keys', () => {
  // The outline editor: Delete removes points there, Escape leaves a tool, digits type.
  const editor = (): { area: HTMLElement; button: HTMLElement } => {
    const win = document.createElement('div')
    win.setAttribute('data-own-keys', '')
    win.innerHTML = '<div id="area" tabindex="0"></div><button id="tool">Tool</button>'
    document.body.appendChild(win)
    return { area: document.getElementById('area')!, button: document.getElementById('tool')! }
  }

  it('keeps single keys from the glyphs, however it got focus', () => {
    const { area, button } = editor()
    for (const el of [area, button]) {
      selectA()
      click(el)
      for (const key of ['Delete', 'Backspace', 'Escape', '1']) press(el, key)
      expect(hasA()).toBe(true)
      expect(selected()).toEqual(['0041'])
    }
  })

  it('still lets the chords through: undo works from the editor', () => {
    const { area } = editor()
    useDocStore.getState().transact('Edit', (d) => void d.glyphs.delete('0041'))
    click(area)
    area.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true }))
    expect(hasA()).toBe(true)
  })
})

describe('Enter', () => {
  const isOpen = (): boolean => useOutlineEditorStore.getState().open

  it('opens the outline editor from the grid, and presses a button that was clicked', () => {
    useOutlineEditorStore.setState({ open: false })
    const grid = document.querySelector<HTMLElement>('[role="grid"]')!
    const button = document.getElementById('create')!
    selectA()

    // On a button the mouse pressed, Enter is the button's own key.
    click(button)
    const onButton = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    button.dispatchEvent(onButton)
    expect(isOpen()).toBe(false)
    expect(onButton.defaultPrevented).toBe(false)

    grid.focus()
    press(grid, 'Enter')
    expect(isOpen()).toBe(true)
    useOutlineEditorStore.setState({ open: false })
  })
})

describe('focus a script moves', () => {
  it('is not taken for a mouse press once the press is over', async () => {
    const button = document.getElementById('create')!
    const other = document.createElement('button')
    document.body.appendChild(other)
    selectA()
    button.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    button.focus()
    button.dispatchEvent(new Event('pointerup', { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 0))
    // Like the tab shown after closing another: focused by the app, not by the press.
    other.focus()
    press(other, 'Delete')
    expect(hasA()).toBe(true)
  })

  it('counts a tap as a press (touch focuses on the mouse events after pointer up)', () => {
    const button = document.getElementById('create')!
    selectA()
    for (const type of ['pointerdown', 'pointerup', 'mousedown']) button.dispatchEvent(new Event(type, { bubbles: true }))
    button.focus()
    button.dispatchEvent(new Event('mouseup', { bubbles: true }))
    press(button, 'Delete')
    expect(hasA()).toBe(false)
  })

  it('holds single keys back while focus is parked on the page', () => {
    const field = document.createElement('input')
    field.setAttribute('aria-label', 'Name')
    document.body.appendChild(field)
    field.addEventListener('focus', () => trackFieldEdit(field, () => undefined))
    field.focus()
    selectA()
    commitFieldForSwitch()
    field.remove()
    settleFieldFocus()
    press(document.body, 'Delete')
    expect(hasA()).toBe(true)
    // The user clicks somewhere: Delete acts again.
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    press(document.body, 'Delete')
    expect(hasA()).toBe(false)
  })
})

describe('text fields', () => {
  it('let the shortcuts that work while typing through, and keep the other keys', () => {
    const field = document.createElement('input')
    field.addEventListener('keydown', (e) => keepTypingKeys(e))
    document.body.appendChild(field)
    selectA()
    field.focus()
    press(field, 'Escape')
    expect(selected()).toEqual(['0041'])
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true, cancelable: true }))
    expect(useDialogs.getState().stack.at(-1)?.kind).toBe('palette')
    for (const d of [...useDialogs.getState().stack]) useDialogs.getState().close(d.id, null as never)
  })
})

describe('macOS keys', () => {
  const key = (k: string, mods: { ctrl?: boolean; meta?: boolean; shift?: boolean } = {}) => ({
    key: k,
    code: '',
    ctrlKey: !!mods.ctrl,
    metaKey: !!mods.meta,
    altKey: false,
    shiftKey: !!mods.shift
  })

  it('use Command for the shortcuts, and leave Control to text editing (but Control+Tab)', () => {
    expect(eventSpec(key('e', { meta: true }), true)).toBe('Ctrl+E')
    expect(eventSpec(key('e', { ctrl: true }), true)).toBe('Control+E')
    expect(eventSpec(key('Tab', { ctrl: true }), true)).toBe('Ctrl+Tab')
    expect(eventSpec(key('Tab', { ctrl: true, shift: true }), true)).toBe('Ctrl+Shift+Tab')
    expect(eventSpec(key('e', { ctrl: true }), false)).toBe('Ctrl+E')
  })

  it('keep Control+letter in a text field', () => {
    let stopped = 0
    const ev = (k: string, mods: { ctrl?: boolean; meta?: boolean }) => ({ ...key(k, mods), stopPropagation: () => void stopped++ })
    keepTypingKeys(ev('e', { ctrl: true }), true)
    expect(stopped).toBe(1)
    keepTypingKeys(ev('s', { meta: true }), true)
    keepTypingKeys(ev('Tab', { ctrl: true }), true)
    expect(stopped).toBe(1)
  })
})
