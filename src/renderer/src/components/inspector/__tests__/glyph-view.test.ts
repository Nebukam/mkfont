// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useDocStore } from '../../../stores/doc-store'
import { usePrefsStore } from '../../../stores/prefs-store'
import { createFamily, createGlyph } from '../../../core/model'
import type { Glyph } from '../../../types/font'
import { GlyphPreview } from '../GlyphHeader'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
let container: HTMLElement
let scrolled: Element[] = []
let writes = 0
let unsub: () => void

beforeEach(() => {
  const family = createFamily()
  const glyphs = new Map<string, Glyph>()
  glyphs.set('0041', createGlyph('0041', family.transforms as never))
  useDocStore.getState().load({ family, glyphs } as never, { fileName: 't.mkfont' })
  usePrefsStore.getState().set('glyphViewHeight', null)
  usePrefsStore.getState().set('rightWidth', 330)
  // No real pointer capture or scrolling in happy-dom.
  ;(HTMLElement.prototype as unknown as Record<string, unknown>).setPointerCapture = () => undefined
  scrolled = []
  ;(HTMLElement.prototype as unknown as Record<string, unknown>).scrollIntoView = function (this: Element) {
    scrolled.push(this)
  }
  writes = 0
  unsub = usePrefsStore.subscribe((s, prev) => {
    if (s.glyphViewHeight !== prev.glyphViewHeight) writes++
  })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(h(GlyphPreview, { unicode: '0041' })))
})
afterEach(() => {
  unsub()
  act(() => root.unmount())
  container.remove()
})

const canvasH = (): number => parseFloat(container.querySelector('canvas')!.style.height)
const sep = (): HTMLElement => container.querySelector<HTMLElement>('[role="separator"]')!
const line = (): string => sep().firstElementChild!.className
const stored = (): number | null => usePrefsStore.getState().glyphViewHeight
const key = (k: string, init: KeyboardEventInit = {}): boolean => {
  let ev!: KeyboardEvent
  act(() => {
    ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
    sep().dispatchEvent(ev)
  })
  return ev.defaultPrevented
}
const ptr = (type: string, y: number, init: PointerEventInit = {}): void =>
  act(() => void sep().dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientY: y, pointerId: 1, button: 0, ...init })))

describe('glyph view height', () => {
  it('is as tall as the inspector is wide by default, within the limits', () => {
    expect(canvasH()).toBe(330)
    act(() => usePrefsStore.getState().set('rightWidth', 200))
    expect(canvasH()).toBe(240)
    act(() => usePrefsStore.getState().set('rightWidth', 520))
    expect(canvasH()).toBe(520)
  })

  it('uses the stored height, clamped', () => {
    act(() => usePrefsStore.getState().set('glyphViewHeight', 500))
    expect(canvasH()).toBe(500)
    act(() => usePrefsStore.getState().set('rightWidth', 260))
    expect(canvasH()).toBe(500)
    act(() => usePrefsStore.getState().set('glyphViewHeight', 100))
    expect(canvasH()).toBe(240)
    act(() => usePrefsStore.getState().set('glyphViewHeight', 5000))
    expect(canvasH()).toBe(720)
  })

  it('exposes a focusable separator that controls the view', () => {
    const s = sep()
    expect(s.getAttribute('aria-orientation')).toBe('horizontal')
    expect(s.getAttribute('aria-label')).toBe('Resize glyph view')
    expect(s.tabIndex).toBe(0)
    expect(s.getAttribute('aria-valuenow')).toBe('330')
    expect(s.getAttribute('aria-valuemin')).toBe('240')
    expect(s.getAttribute('aria-valuemax')).toBe('720')
    expect(s.getAttribute('aria-valuetext')).toBe('330 pixels')
    expect(document.getElementById(s.getAttribute('aria-controls')!)?.querySelector('canvas')).toBeTruthy()
    // The zoom buttons are still there and work.
    const zoomIn = container.querySelector<HTMLButtonElement>('button[aria-label="Zoom in"]')!
    const zoomOut = container.querySelector<HTMLButtonElement>('button[aria-label="Zoom out"]')!
    act(() => zoomIn.click())
    expect(zoomOut.disabled).toBe(false)
  })

  it('steps with the keyboard; chords are ignored', async () => {
    expect(key('ArrowDown')).toBe(true)
    expect(stored()).toBe(346)
    key('ArrowDown', { shiftKey: true })
    expect(stored()).toBe(410)
    key('ArrowUp')
    expect(stored()).toBe(394)
    key('ArrowUp', { shiftKey: true })
    expect(stored()).toBe(330)
    key('Home')
    expect(stored()).toBe(240)
    key('End')
    expect(stored()).toBe(720)
    expect(key('ArrowUp', { ctrlKey: true })).toBe(false)
    expect(key('ArrowUp', { altKey: true })).toBe(false)
    expect(key('ArrowUp', { metaKey: true })).toBe(false)
    expect(key('PageUp')).toBe(false)
    expect(stored()).toBe(720)
    expect(canvasH()).toBe(720)
    expect(sep().getAttribute('aria-valuetext')).toBe('720 pixels')
    await act(() => new Promise<void>((r) => requestAnimationFrame(() => r())))
    expect(scrolled).toContain(sep())
  })

  it('keeps a square view square on a step against a limit', () => {
    act(() => usePrefsStore.getState().set('rightWidth', 200))
    expect(key('ArrowUp')).toBe(true)
    key('Home')
    expect(stored()).toBeNull()
    expect(writes).toBe(0)
  })

  it('drags with a local height and stores it once, on release', () => {
    ptr('pointerdown', 100)
    expect(line()).toContain('bg-transparent')
    ptr('pointermove', 150)
    expect(canvasH()).toBe(380)
    expect(sep().getAttribute('aria-valuenow')).toBe('380')
    expect(line()).toContain('bg-accent')
    expect(line()).not.toContain('bg-transparent')
    expect(stored()).toBeNull()
    ptr('pointermove', 1000)
    expect(canvasH()).toBe(720)
    ptr('pointermove', -500)
    expect(canvasH()).toBe(240)
    ptr('pointermove', 60)
    expect(canvasH()).toBe(290)
    expect(writes).toBe(0)
    ptr('pointerup', 60)
    expect(stored()).toBe(290)
    expect(writes).toBe(1)
    expect(canvasH()).toBe(290)
    expect(line()).toContain('bg-transparent')
    // A later move without a press does nothing.
    ptr('pointermove', 400)
    expect(canvasH()).toBe(290)
  })

  it('ignores clicks, small slips, other buttons and drags back to the start', () => {
    ptr('pointerdown', 100)
    ptr('pointerup', 100)
    ptr('pointerdown', 100)
    ptr('pointermove', 102)
    ptr('pointerup', 102)
    expect(canvasH()).toBe(330)
    ptr('pointerdown', 100)
    ptr('pointermove', 150)
    ptr('pointermove', 100)
    ptr('pointerup', 100)
    ptr('pointerdown', 100, { button: 2 })
    ptr('pointermove', 150)
    ptr('pointerup', 150)
    expect(stored()).toBeNull()
    expect(writes).toBe(0)
    expect(canvasH()).toBe(330)
  })

  it('drops a drag that loses its pointer capture before the release', () => {
    ptr('pointerdown', 100)
    ptr('pointermove', 200)
    expect(canvasH()).toBe(430)
    ptr('lostpointercapture', 200)
    expect(canvasH()).toBe(330)
    ptr('pointerup', 300)
    expect(stored()).toBeNull()
  })

  it('goes back to square on double-click', () => {
    act(() => usePrefsStore.getState().set('glyphViewHeight', 600))
    expect(canvasH()).toBe(600)
    act(() => void sep().dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
    expect(stored()).toBeNull()
    expect(canvasH()).toBe(330)
  })

  it('is square when the stored height is not a finite number', () => {
    for (const damaged of ['tall', NaN, Infinity, {}]) {
      act(() => usePrefsStore.getState().set('glyphViewHeight', damaged as never))
      expect(canvasH()).toBe(330)
      expect(sep().getAttribute('aria-valuenow')).toBe('330')
    }
    key('ArrowDown')
    expect(stored()).toBe(346)
  })
})

/** ResizeObserver that reports when the test says (happy-dom's never reports). */
class FakeResizeObserver {
  static all: FakeResizeObserver[] = []
  readonly targets = new Set<Element>()
  constructor(readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.all.push(this)
  }
  observe(el: Element): void {
    this.targets.add(el)
  }
  unobserve(el: Element): void {
    this.targets.delete(el)
  }
  disconnect(): void {
    this.targets.clear()
  }
}

describe('glyph view in a short inspector', () => {
  let visible = 400

  beforeEach(() => {
    // Mounted again, in a scrolling inspector showing `visible` pixels.
    act(() => root.unmount())
    FakeResizeObserver.all = []
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    visible = 400
    container.style.overflowY = 'auto'
    Object.defineProperty(container, 'clientHeight', { configurable: true, get: () => visible })
    root = createRoot(container)
    act(() => root.render(h(GlyphPreview, { unicode: '0041' })))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const resize = (height: number): void => {
    visible = height
    act(() => {
      for (const o of FakeResizeObserver.all) if (o.targets.has(container)) o.callback([], o as unknown as ResizeObserver)
    })
  }

  it('is never taller than the inspector shows, less some room, nor below the minimum', () => {
    expect(canvasH()).toBe(330)
    act(() => usePrefsStore.getState().set('rightWidth', 520))
    expect(canvasH()).toBe(352)
    expect(sep().getAttribute('aria-valuemax')).toBe('352')
    act(() => usePrefsStore.getState().set('glyphViewHeight', 600))
    expect(canvasH()).toBe(352)
    resize(2000)
    expect(canvasH()).toBe(600)
    expect(sep().getAttribute('aria-valuemax')).toBe('720')
    resize(200)
    expect(canvasH()).toBe(240)
    expect(sep().getAttribute('aria-valuemax')).toBe('240')
    // Only the view is limited: the stored height comes back with the room.
    expect(stored()).toBe(600)
    expect(writes).toBe(1)
    resize(1000)
    expect(canvasH()).toBe(600)
  })

  it('stops the keyboard and the drag at that height', () => {
    key('End')
    expect(stored()).toBe(352)
    expect(canvasH()).toBe(352)
    expect(key('ArrowDown')).toBe(true)
    expect(writes).toBe(1)
    act(() => usePrefsStore.getState().set('glyphViewHeight', null))
    ptr('pointerdown', 100)
    ptr('pointermove', 1000)
    expect(canvasH()).toBe(352)
    ptr('pointerup', 1000)
    expect(stored()).toBe(352)
  })
})
