// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDocStore } from '../doc-store'
import { useSelectionStore } from '../selection-store'
import { canGoBack, canGoForward, freshView, useUIStore, type RangeRef } from '../ui-store'
import { installKeyboard, runCommand } from '../../app/commands'
import { openDialog, useDialogs } from '../../app/dialogs'
import { goToGlyph } from '../../components/inspector/DetailsSection'
import { commitFieldForSwitch, settleFieldFocus, trackFieldEdit, untrackFieldEdit } from '../../components/ui/focus'
import { createFamily, createGlyph } from '../../core/model'

const GREEK: RangeRef = { kind: 'block', name: 'Greek and Coptic' }

const select = (...keys: string[]): void => useSelectionStore.getState().setSelection(keys, keys[keys.length - 1])
const settle = (): void => void vi.advanceTimersByTime(300)
const shown = (): { range: string; keys: string } => ({ range: useUIStore.getState().range.kind, keys: useSelectionStore.getState().keys.join(',') })
/** The recorded steps, as "range:keys". */
const steps = (): string[] => useUIStore.getState().navEntries.map((e) => `${e.range.kind}:${e.keys.join(',')}`)
const search = (): string => useUIStore.getState().searchText

beforeEach(() => {
  vi.useFakeTimers()
  // "A" is in the font: a jump to it shows "My glyphs".
  const family = createFamily()
  useDocStore.getState().load({ family, glyphs: new Map([['0041', createGlyph('0041', family.transforms as never)]]) }, { fileName: 't.mkfont' })
  useSelectionStore.getState().clear()
  vi.runAllTimers()
  useUIStore.setState(freshView())
})
afterEach(() => {
  // A step still settling must not leak into the next test.
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

describe('Back / Forward (navigation undo)', () => {
  it('steps back and forward through selections and ranges', () => {
    select('0041')
    settle()
    select('0042')
    settle()
    useUIStore.getState().setRange({ kind: 'ligatures' })
    runCommand('view.back')
    expect(shown()).toEqual({ range: 'glyphs', keys: '0042' })
    runCommand('view.back')
    expect(shown()).toEqual({ range: 'glyphs', keys: '0041' })
    runCommand('view.back')
    expect(shown()).toEqual({ range: 'glyphs', keys: '' })
    expect(canGoBack()).toBe(false)
    runCommand('view.forward')
    runCommand('view.forward')
    runCommand('view.forward')
    expect(shown()).toEqual({ range: 'ligatures', keys: '0042' })
    // A new step after going back drops the steps that were ahead.
    runCommand('view.back')
    select('0043')
    settle()
    expect(canGoForward()).toBe(false)
  })

  it('records a selection once it settles, and never an empty one', () => {
    select('0041')
    vi.advanceTimersByTime(100)
    select('0042')
    vi.advanceTimersByTime(100)
    select('0043')
    settle()
    useSelectionStore.getState().clear()
    settle()
    expect(useUIStore.getState().navEntries.map((e) => e.keys.join(','))).toEqual(['', '0043'])
  })

  it('keeps a selection made just before switching range as its own step', () => {
    select('0041')
    useUIStore.getState().setRange({ kind: 'all' })
    runCommand('view.back')
    expect(shown()).toEqual({ range: 'glyphs', keys: '0041' })
  })

  it('records a jump to a glyph in another range as one step', () => {
    useUIStore.getState().setRange(GREEK)
    select('03b1')
    settle()
    goToGlyph('0041')
    settle()
    expect(steps()).toEqual(['glyphs:', 'block:03b1', 'glyphs:0041'])
    runCommand('view.back')
    expect(shown()).toEqual({ range: 'block', keys: '03b1' })
  })

  it('records a range change once it settles, also with nothing selected', () => {
    useUIStore.getState().setRange({ kind: 'ligatures' })
    expect(canGoBack()).toBe(true)
    settle()
    expect(steps()).toEqual(['glyphs:', 'ligatures:'])
    select('0041')
    settle()
    // Deselected right after the range change: still a step of that range.
    useUIStore.getState().setRange({ kind: 'all' })
    useSelectionStore.getState().clear()
    settle()
    expect(steps()).toEqual(['glyphs:', 'ligatures:', 'ligatures:0041', 'all:'])
    runCommand('view.back')
    expect(shown()).toEqual({ range: 'ligatures', keys: '0041' })
  })

  it('keeps the search with each step, and restores it on Back and Forward', () => {
    // Typing alone is not a step.
    useUIStore.getState().setSearchText('alpha')
    settle()
    expect(steps()).toEqual(['glyphs:'])
    useUIStore.getState().setRange(GREEK)
    select('03b1')
    settle()
    goToGlyph('0041')
    settle()
    expect(search()).toBe('')
    runCommand('view.back')
    expect(shown()).toEqual({ range: 'block', keys: '03b1' })
    expect(search()).toBe('alpha')
    // Typed right after going back, a search is no step either: Forward still leads to the jump.
    useUIStore.getState().setSearchText('alp')
    settle()
    runCommand('view.forward')
    expect(shown()).toEqual({ range: 'glyphs', keys: '0041' })
    expect(search()).toBe('')
  })

  it('makes a selection under another search a step of its own', () => {
    select('0041')
    settle()
    useUIStore.getState().setSearchText('a')
    select('0041')
    settle()
    expect(steps()).toEqual(['glyphs:', 'glyphs:0041', 'glyphs:0041'])
    runCommand('view.back')
    expect(search()).toBe('')
  })
})

describe('Back / Forward and the search', () => {
  it('keeps the search a step began with, not one typed while it settled', () => {
    useUIStore.getState().setRange({ kind: 'all' })
    useUIStore.getState().setSearchText('alp')
    settle()
    useUIStore.getState().setSearchText('alpha')
    select('03b1')
    settle()
    expect(useUIStore.getState().navEntries.map((e) => e.searchText)).toEqual(['', '', 'alpha'])
    runCommand('view.back')
    expect(search()).toBe('')
    expect(useUIStore.getState().range.kind).toBe('all')
  })

  it('turns "Existing only" off to show a step whose glyph is not in the font', () => {
    useUIStore.getState().setRange({ kind: 'block', name: 'Basic Latin' })
    select('0051')
    settle()
    useUIStore.getState().toggleSearchExists()
    select('0041')
    settle()
    runCommand('view.back')
    expect(shown().keys).toBe('0051')
    expect(useUIStore.getState().searchExists).toBe(false)
  })

  it('leaves "Existing only" alone where it could not show the glyph anyway', () => {
    select('0051')
    settle()
    useUIStore.getState().toggleSearchExists()
    select('0041')
    settle()
    runCommand('view.back')
    expect(shown()).toEqual({ range: 'glyphs', keys: '0051' })
    expect(useUIStore.getState().searchExists).toBe(true)
    useUIStore.getState().toggleSearchExists()
  })
})

describe('Back / Forward from the mouse’s side buttons', () => {
  let uninstall: () => void
  beforeEach(() => {
    document.body.innerHTML = '<input id="field" type="text"><button id="btn">b</button>'
    uninstall = installKeyboard()
    select('0041')
    settle()
    select('0042')
    settle()
  })
  const offs: (() => void)[] = []
  afterEach(() => {
    for (const off of offs.splice(0)) off()
    uninstall()
    for (const d of [...useDialogs.getState().stack]) useDialogs.getState().close(d.id, null as never)
  })

  const PRESS = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'auxclick'] as const
  /** A press and release of a mouse button, with every event a browser sends for it. */
  function click(button: number, target: EventTarget = document.getElementById('btn')!): Event[] {
    return PRESS.map((type) => {
      const Init = type.startsWith('pointer') ? PointerEvent : MouseEvent
      const e = new Init(type, { button, bubbles: true, cancelable: true })
      target.dispatchEvent(e)
      return e
    })
  }
  /** What a listener added now hears of the presses. */
  function listen(target: EventTarget, capture = false): string[] {
    const heard: string[] = []
    const on = (e: Event): void => void heard.push(e.type)
    for (const type of PRESS) target.addEventListener(type, on, capture)
    offs.push(() => PRESS.forEach((type) => target.removeEventListener(type, on, capture)))
    return heard
  }
  /** Listeners on the window (capture), the page and the element under the pointer. */
  const listenEverywhere = (): string[][] => [listen(window, true), listen(document.body), listen(document.getElementById('btn')!)]
  const pressKey = (key: string): void => void document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

  it('go back (3) and forward (4) one step per press, and nothing else hears the press', () => {
    const heard = listenEverywhere()
    const events = click(3)
    // One step: 0041, not the empty start.
    expect(shown().keys).toBe('0041')
    expect(events.every((e) => e.defaultPrevented)).toBe(true)
    expect(heard).toEqual([[], [], []])
    click(3)
    expect(shown().keys).toBe('')
    // Nowhere further back: Back is off.
    click(3)
    expect(shown().keys).toBe('')
    click(4)
    expect(shown().keys).toBe('0041')
  })

  it('leave the other buttons alone', () => {
    const heard = listenEverywhere()
    for (const button of [0, 1, 2]) expect(click(button).some((e) => e.defaultPrevented)).toBe(false)
    for (const h of heard) expect(h).toHaveLength(3 * PRESS.length)
    expect(shown().keys).toBe('0042')
  })

  it('leave the keyboard’s pointer tracking alone: focus parked on the page stays parked', () => {
    // The field being typed in went away with a font switch: single keys wait for the user's next move.
    const field = document.getElementById('field')!
    field.focus()
    trackFieldEdit(field, () => undefined)
    commitFieldForSwitch()
    field.remove()
    settleFieldFocus()
    click(3, document.body)
    expect(shown().keys).toBe('0041')
    pressKey('Delete')
    expect(useDocStore.getState().data!.glyphs.has('0041')).toBe(true)
    // A click is such a move: Delete acts again.
    click(0, document.body)
    pressKey('Delete')
    expect(useDocStore.getState().data!.glyphs.has('0041')).toBe(false)
    untrackFieldEdit(field)
  })

  it('do nothing while a dialog or a menu is open, and still keep the press from the page', () => {
    void openDialog('about', {})
    expect(click(3).every((e) => e.defaultPrevented)).toBe(true)
    expect(shown().keys).toBe('0042')
    useDialogs.getState().close(useDialogs.getState().stack[0].id, null as never)
    document.body.insertAdjacentHTML('beforeend', '<div role="menu"></div>')
    click(3)
    expect(shown().keys).toBe('0042')
    document.querySelector('[role="menu"]')!.remove()
    click(3)
    expect(shown().keys).toBe('0041')
  })

  it('put the text typed in a field into the glyph it was typed for, then step', () => {
    const field = document.getElementById('field')!
    // A field that commits its text once, into whatever is selected when it commits.
    let typed: string | null = '600'
    const landed: string[] = []
    field.focus()
    trackFieldEdit(field, () => {
      if (typed === null) return
      landed.push(`${typed} in ${useSelectionStore.getState().keys.join(',')}`)
      typed = null
    })
    click(3, field)
    expect(landed).toEqual(['600 in 0042'])
    expect(shown().keys).toBe('0041')
    untrackFieldEdit(field)
  })
})
