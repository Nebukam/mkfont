// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useDocStore, transact } from '../../stores/doc-store'
import { useInspectorStore } from '../../stores/inspector-store'
import { useUIStore } from '../../stores/ui-store'
import { createFamily, createGlyph } from '../../core/model'
import { addLayer } from '../../core/ops'
import type { Glyph } from '../../types/font'
import { ComponentsSection } from '../inspector/ComponentsSection'
import { BrowsePanel } from '../sidebar/BrowsePanel'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
let container: HTMLElement

beforeEach(() => {
  const family = createFamily()
  const glyphs = new Map<string, Glyph>()
  for (const k of ['0041', '0042', '0043', '0044']) glyphs.set(k, createGlyph(k, family.transforms as never))
  useDocStore.getState().load({ family, glyphs } as never, { fileName: 't.mkfont' })
  transact('setup', (d) => {
    for (const c of ['B', 'C', 'D']) addLayer(d, '0041', { characterRef: c })
  })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const refs = (): string[] => useDocStore.getState().data!.glyphs.get('0041')!.variants[0].layers.map((l) => l.characterRef)
const rowControl = (i: number, c: string): HTMLButtonElement =>
  container.querySelectorAll('[role="listitem"]')[i]!.querySelector<HTMLButtonElement>(`[data-row-control="${c}"]`)!
const clickActive = (): void => act(() => (document.activeElement as HTMLElement).click())
const pressOnActive = (key: string): void =>
  act(() => void (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })))

describe('components list keyboard focus', () => {
  it('keeps focus on the moved component', () => {
    act(() => root.render(h(ComponentsSection, { unicode: '0041' })))
    expect(container.querySelector('[role="list"]')?.getAttribute('aria-label')).toBe('Components')
    expect(refs()).toEqual(['B', 'C', 'D'])
    // The grip moves its component with the arrow keys.
    act(() => rowControl(0, 'grip').focus())
    pressOnActive('ArrowDown')
    expect(refs()).toEqual(['C', 'B', 'D'])
    expect(document.activeElement).toBe(rowControl(1, 'grip'))
    expect(useInspectorStore.getState().layerFocus).toEqual({ key: '0041', index: 1 })
    pressOnActive('ArrowDown')
    expect(refs()).toEqual(['C', 'D', 'B'])
    expect(document.activeElement).toBe(rowControl(2, 'grip'))
    // Past the end: nothing moves.
    pressOnActive('ArrowDown')
    expect(refs()).toEqual(['C', 'D', 'B'])
    pressOnActive('ArrowUp')
    expect(refs()).toEqual(['C', 'B', 'D'])
    expect(document.activeElement).toBe(rowControl(1, 'grip'))
    // The Move up / down buttons are hidden.
    expect(rowControl(1, 'up')).toBeNull()
  })

  it('moves focus to a neighbour, then the section header, on removal', () => {
    act(() => root.render(h(ComponentsSection, { unicode: '0041' })))
    act(() => rowControl(2, 'remove').focus())
    clickActive()
    expect(refs()).toEqual(['B', 'C'])
    expect(document.activeElement).toBe(rowControl(1, 'remove'))
    act(() => rowControl(0, 'remove').focus())
    clickActive()
    expect(refs()).toEqual(['C'])
    expect(document.activeElement).toBe(rowControl(0, 'remove'))
    clickActive()
    expect(refs()).toEqual([])
    expect(document.activeElement?.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement?.textContent).toContain('Components')
    expect(useInspectorStore.getState().layerFocus).toBeNull()
  })
})

describe('unicode block list', () => {
  it('is one tab stop moved by arrow keys, and comes back to the current block', () => {
    act(() => root.render(h(BrowsePanel)))
    const group = container.querySelector('[aria-label="Unicode blocks"]')!
    const buttons = (): HTMLButtonElement[] => Array.from(group.querySelectorAll<HTMLButtonElement>(':scope > button'))
    const stops = (): number[] => buttons().flatMap((b, i) => (b.tabIndex === 0 ? [i] : []))
    expect(buttons().length).toBeGreaterThan(100)
    expect(stops()).toEqual([0])
    act(() => buttons()[0].focus())
    act(() => void buttons()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))
    expect(document.activeElement).toBe(buttons()[1])
    expect(stops()).toEqual([1])
    act(() => void buttons()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })))
    expect(document.activeElement).toBe(buttons()[buttons().length - 1])
    act(() => void buttons()[buttons().length - 1].dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true })))
    expect(document.activeElement).toBe(buttons()[buttons().length - 11])
    act(() => buttons()[3].click())
    expect(useUIStore.getState().range).toMatchObject({ kind: 'block' })
    expect(buttons()[3].getAttribute('aria-current')).toBe('true')
    act(() => (document.activeElement as HTMLElement).blur())
    expect(stops()).toEqual([3])
  })
})
