// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useDocStore } from '../../../stores/doc-store'
import { useSelectionStore } from '../../../stores/selection-store'
import { activateSession, closeSession, openSession, useWorkspace, type Session } from '../../../stores/workspace'
import { installKeyboard } from '../../../app/commands'
import { createFamily, createGlyph } from '../../../core/model'
import type { Glyph } from '../../../types/font'
import { PreviewPanel } from '../PreviewPanel'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

/** How the next font faces load: at once, with an error, or when the test settles them. */
let loading: 'ok' | 'fail' | 'pending' = 'ok'

/** FontFace stand-in: happy-dom has none. */
class FakeFontFace {
  static made: FakeFontFace[] = []
  settle: (error?: Error) => void = () => undefined
  constructor(readonly family: string) {
    FakeFontFace.made.push(this)
  }
  load(): Promise<this> {
    return new Promise((resolve, reject) => {
      this.settle = (error) => (error ? reject(error) : resolve(this))
      if (loading === 'ok') this.settle()
      if (loading === 'fail') this.settle(new Error('Bad font data'))
    })
  }
}

/** document.fonts stand-in: the faces registered now. */
const registered = new Set<unknown>()
Object.defineProperty(document, 'fonts', {
  configurable: true,
  value: { add: (face: unknown) => registered.add(face), delete: (face: unknown) => registered.delete(face) }
})

/** Opens a font in a tab of its own, as the app does, and shows it. */
function openDoc(): Session {
  return openSession((store) => {
    const family = createFamily()
    const glyphs = new Map<string, Glyph>()
    for (const k of ['0041', '0042']) glyphs.set(k, createGlyph(k, family.transforms as never))
    store.getState().load({ family, glyphs } as never, { fileName: 't.mkfont' })
  })
}

let root: Root
let container: HTMLElement
let docA: Session
let docB: Session

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  vi.stubGlobal('FontFace', FakeFontFace)
  loading = 'ok'
  FakeFontFace.made = []
  registered.clear()
  docA = openDoc()
  docB = openDoc()
  activateSession(docA.id)
  useSelectionStore.getState().clear()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(h(PreviewPanel)))
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  for (const s of [...useWorkspace.getState().sessions]) closeSession(s.id)
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

/** Runs the timers due within `ms`, and lets the builds they start load. */
const wait = (ms = 0): Promise<void> =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
const fontFamily = (): string => container.querySelector<HTMLElement>('[aria-label="Rendered preview"] > div')!.style.fontFamily
const notice = (): string => container.querySelector('[aria-live="polite"]')!.textContent ?? ''
const button = (label: string): HTMLButtonElement => container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
const clickOn = (el: HTMLElement, init: MouseEventInit = {}): void =>
  act(() => void el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init })))
const click = (label: string, init: MouseEventInit = {}): void => clickOn(button(label), init)
/** A mouse press: the button takes focus, then gets the click. */
const pressOn = (el: HTMLElement, init: MouseEventInit = {}): void => {
  el.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  el.focus()
  clickOn(el, init)
}
const press = (label: string, init: MouseEventInit = {}): void => pressOn(button(label), init)
const field = (): HTMLTextAreaElement => container.querySelector('textarea')!
const text = (): string => field().value
const show = (doc: Session): void => act(() => activateSession(doc.id))

describe('preview font', () => {
  it('shows only the active document’s font, building at once after a switch', async () => {
    await wait()
    const [a] = FakeFontFace.made
    expect(fontFamily()).toContain(a.family)
    expect([...registered]).toEqual([a])

    loading = 'pending'
    show(docB)
    // B's text is not drawn with A's outlines while B's font builds, and that build does not wait.
    expect(fontFamily()).toBe('sans-serif')
    await wait()
    const b = FakeFontFace.made[1]
    expect(b).toBeDefined()
    await act(async () => b.settle())
    expect(fontFamily()).toContain(b.family)
    // A's font stays registered, for when A is shown again.
    expect(registered).toEqual(new Set([a, b]))
  })

  it('shows a document’s last font at once when switching back, while it rebuilds', async () => {
    await wait()
    const [a] = FakeFontFace.made
    show(docB)
    await wait()
    const b = FakeFontFace.made[1]

    loading = 'pending'
    show(docA)
    // No fallback font in between: A's text keeps A's outlines.
    expect(fontFamily()).toContain(a.family)
    // The rebuild waits like an edit, as A's font is on screen.
    await wait(149)
    expect(FakeFontFace.made).toHaveLength(2)
    await wait(1)
    const a2 = FakeFontFace.made[2]
    expect(a2).toBeDefined()
    expect(fontFamily()).toContain(a.family)
    await act(async () => a2.settle())
    expect(fontFamily()).toContain(a2.family)
    // The newer build replaces A's font; B's stays.
    expect(registered).toEqual(new Set([b, a2]))
  })

  it('never registers a build a switch superseded, and keeps the last good font', async () => {
    await wait()
    const [a] = FakeFontFace.made
    loading = 'pending'
    click('Rebuild preview font')
    await wait(150)
    const late = FakeFontFace.made[1]
    show(docB)
    await wait()
    const b = FakeFontFace.made[2]
    expect(b).toBeDefined()
    await act(async () => late.settle())
    expect(registered.has(late)).toBe(false)
    await act(async () => b.settle())
    expect(registered).toEqual(new Set([a, b]))
    show(docA)
    expect(fontFamily()).toContain(a.family)
  })

  it('keeps a failed build’s error to its document, and never shows another document’s font', async () => {
    await wait()
    const [a] = FakeFontFace.made
    loading = 'fail'
    show(docB)
    await wait()
    expect(fontFamily()).toBe('sans-serif')
    expect(notice()).toContain('The preview is not updating: Bad font data')
    expect([...registered]).toEqual([a])

    loading = 'ok'
    show(docA)
    expect(notice()).toBe('')
    expect(fontFamily()).toContain(a.family)
    await wait(150)

    // Back on B, its error is shown at once, and B tries again after a pause.
    show(docB)
    expect(notice()).toContain('The preview is not updating: Bad font data')
    await wait(149)
    expect(fontFamily()).toBe('sans-serif')
    await wait(1)
    expect(notice()).toBe('')
    expect(fontFamily()).toContain(FakeFontFace.made.at(-1)!.family)
  })

  it('keeps its own last good font when a rebuild fails, after a pause', async () => {
    await wait()
    const [a] = FakeFontFace.made
    loading = 'fail'
    click('Rebuild preview font')
    await wait(149)
    expect(FakeFontFace.made).toHaveLength(1)
    await wait(1)
    expect(FakeFontFace.made).toHaveLength(2)
    expect(fontFamily()).toContain(a.family)
    expect([...registered]).toEqual([a])
    expect(notice()).toContain('The preview is not updating: Bad font data')
  })

  it('drops the font of a closed document, even one still loading', async () => {
    await wait()
    const [a] = FakeFontFace.made
    loading = 'pending'
    show(docB)
    await wait()
    const b = FakeFontFace.made[1]
    // A is shown again with its font; B's build lands after B closed.
    act(() => closeSession(docB.id))
    expect(fontFamily()).toContain(a.family)
    await act(async () => b.settle())
    expect([...registered]).toEqual([a])

    loading = 'ok'
    let c!: Session
    act(() => void (c = openDoc()))
    await wait()
    expect(registered.size).toBe(2)
    act(() => closeSession(c.id))
    // A's rebuild after the switch lets C's font go.
    await wait(150)
    expect([...registered]).toEqual([FakeFontFace.made[3]])
  })

  it('lets go of a background document’s font as soon as its tab closes', async () => {
    await wait()
    show(docB)
    await wait()
    const b = FakeFontFace.made[1]
    show(docA)
    await wait(150)
    expect(registered.has(b)).toBe(true)
    // No build follows: the face goes with the tab.
    act(() => closeSession(docB.id))
    expect(registered.has(b)).toBe(false)
    expect(registered.size).toBe(1)
  })

  it('leaves no font behind when the panel closes, even one still loading', async () => {
    await wait()
    show(docB)
    await wait()
    expect(registered.size).toBe(2)
    loading = 'pending'
    click('Rebuild preview font')
    await wait(150)
    const late = FakeFontFace.made[2]
    act(() => root.render(null))
    expect(registered.size).toBe(0)
    await act(async () => late.settle())
    expect(registered.size).toBe(0)
  })

  it('builds the first font at once in StrictMode too', async () => {
    act(() => root.render(h(StrictMode, null, h(PreviewPanel))))
    await wait()
    expect(FakeFontFace.made).toHaveLength(1)
    expect(fontFamily()).toContain(FakeFontFace.made[0].family)
    expect([...registered]).toEqual(FakeFontFace.made)
  })
})

describe('text from the selected glyphs', () => {
  const USE = 'Use the selected glyphs as the text (Shift: separated by spaces)'
  const APPEND = 'Append the selected glyphs (Shift: separated by spaces)'
  const RESET = 'Reset to the default text'
  const DEFAULT_TEXT = 'By Jove, my quick study of lexicography won a prize!'
  /** The keys typed next go into the text, after its last character. */
  const typingAtEnd = (): boolean =>
    document.activeElement === field() && field().selectionStart === text().length && field().selectionEnd === text().length

  it('leaves control characters out and keeps format characters', () => {
    act(() => useSelectionStore.getState().setSelection(['0000', '0041', '000d', '0042']))
    click(USE)
    expect(text()).toBe('AB')
    click(USE, { shiftKey: true })
    expect(text()).toBe('A B')
    // A ZWJ sequence keeps its joiner; a lone tab adds nothing.
    act(() => useSelectionStore.getState().setSelection(['1f468+200d+1f469', '0009']))
    click(APPEND, { shiftKey: true })
    expect(text()).toBe('A B \u{1f468}‍\u{1f469}')
    act(() => useSelectionStore.getState().setSelection(['000a']))
    click(USE)
    expect(text()).toBe('A B \u{1f468}‍\u{1f469}')
    click(RESET)
    expect(text()).toBe(DEFAULT_TEXT)
  })

  it('hand the keyboard to the text, after its last character', () => {
    act(() => useSelectionStore.getState().setSelection(['0041']))
    press(USE)
    expect(text()).toBe('A')
    expect(typingAtEnd()).toBe(true)
    field().setSelectionRange(0, 0)
    press(APPEND, { shiftKey: true })
    expect(text()).toBe('A A')
    expect(typingAtEnd()).toBe(true)
    // Nothing to add (a control character) still leaves the keys to the text.
    act(() => useSelectionStore.getState().setSelection(['000a']))
    field().setSelectionRange(0, 0)
    press(USE)
    expect(text()).toBe('A A')
    expect(typingAtEnd()).toBe(true)
    // Reset disables itself: focus does not fall to the page, where keys act on glyphs.
    field().setSelectionRange(0, 0)
    press(RESET)
    expect(text()).toBe(DEFAULT_TEXT)
    expect(typingAtEnd()).toBe(true)
  })

  it('let Backspace after a text button edit the text, not delete the selected glyph', () => {
    const uninstall = installKeyboard()
    try {
      act(() => useSelectionStore.getState().setSelection(['0041'], '0041'))
      press(USE)
      const backspace = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true })
      act(() => void document.activeElement!.dispatchEvent(backspace))
      expect(useDocStore.getState().data!.glyphs.has('0041')).toBe(true)
    } finally {
      uninstall()
      click(RESET)
    }
  })

  it('leave the focus on a ligature button, which makes glyphs rather than text', () => {
    act(() => useSelectionStore.getState().setSelection(['0041', '0042']))
    click(USE)
    // "AB" picked in the preview with the mouse.
    const preview = container.querySelector<HTMLElement>('[aria-label="Rendered preview"]')!
    act(() => {
      preview.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
      const range = document.createRange()
      range.selectNodeContents(preview)
      window.getSelection()!.removeAllRanges()
      window.getSelection()!.addRange(range)
      window.dispatchEvent(new MouseEvent('mouseup'))
    })
    const ligature = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Ligature “AB”')!
    pressOn(ligature)
    expect(useDocStore.getState().data!.glyphs.has('0041+0042')).toBe(true)
    expect(document.activeElement).toBe(ligature)
    click(RESET)
  })
})
