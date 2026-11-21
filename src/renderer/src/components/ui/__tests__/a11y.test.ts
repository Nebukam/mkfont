// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createElement as h, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AnchorPicker, Checkbox, NumberField, Row, Segmented, Toggle } from '../fields'
import { useToasts } from '../Overlays'
import { scaleUi, UI_SCALE, usePrefsStore } from '../../../stores/prefs-store'

const mount = (el: ReactElement): HTMLElement => {
  document.body.innerHTML = renderToStaticMarkup(el)
  return document.body
}
const noop = (): void => undefined

describe('accessible names of fields', () => {
  it('a Row names the fields inside it and describes them with its help text', () => {
    const root = mount(h(Row, { label: 'Width', tip: 'Advance width', children: h(NumberField, { value: 10, onChange: noop }) }))
    const label = root.querySelector('span[id]')!
    const input = root.querySelector('input')!
    expect(label.textContent).toBe('Width')
    expect(input.getAttribute('aria-labelledby')).toBe(label.id)
    expect(input.getAttribute('aria-description')).toBe('Advance width')
  })

  it('adds a scrub label to the Row name; outside a Row a field uses ariaLabel or its tip', () => {
    const root = mount(h(Row, { label: 'Spacing', children: h(NumberField, { value: 0, label: 'Shift', onChange: noop }) }))
    const ids = root.querySelector('input')!.getAttribute('aria-labelledby')!.split(' ')
    expect(ids.map((id) => root.querySelector(`[id="${id}"]`)?.textContent)).toEqual(['Spacing', 'Shift'])
    expect(mount(h(NumberField, { value: 1, tip: 'Size', onChange: noop })).querySelector('input')!.getAttribute('aria-label')).toBe('Size')
    expect(mount(h(Toggle, { checked: true, ariaLabel: 'Monospace', onChange: noop })).querySelector('button')!.getAttribute('aria-label')).toBe('Monospace')
  })

  it('reads mixed switches as mixed, names icon-only options, and keeps one anchor tab stop', () => {
    const mixed = mount(h(Toggle, { checked: undefined, onChange: noop })).querySelector('button')!
    expect(mixed.getAttribute('role')).toBe('checkbox')
    expect(mixed.getAttribute('aria-checked')).toBe('mixed')
    const Icon = (): ReactElement => h('svg')
    const options = [
      { value: 'a', icon: Icon, tip: 'Align left' },
      { value: 'b', label: 'Center' }
    ]
    const [iconOnly, text] = Array.from(mount(h(Segmented, { value: 'a', options, onChange: noop })).querySelectorAll('button'))
    expect(iconOnly.getAttribute('aria-label')).toBe('Align left')
    expect(text.getAttribute('aria-label')).toBeNull()
    const radios = Array.from(mount(h(AnchorPicker, { value: 6, tip: 'Anchor', onChange: noop })).querySelectorAll('[role="radio"]'))
    expect(radios.filter((r) => r.getAttribute('tabindex') === '0')).toEqual([radios[6]])
    expect(radios[6].getAttribute('aria-label')).toBe('Bottom left')
  })

  it('names a checkbox by its visible label, else by ariaLabel', () => {
    expect(mount(h(Checkbox, { checked: true, label: 'Keep files linked', onChange: noop })).querySelector('button')!.getAttribute('aria-label')).toBeNull()
    expect(mount(h(Checkbox, { checked: false, ariaLabel: 'Import A.svg', onChange: noop })).querySelector('button')!.getAttribute('aria-label')).toBe('Import A.svg')
  })
})

describe('toasts', () => {
  afterEach(() => {
    for (const t of useToasts.getState().toasts) useToasts.getState().dismiss(t.id)
    vi.useRealTimers()
  })

  it('wait while the pointer or focus is on them, then close', () => {
    vi.useFakeTimers()
    const t = useToasts.getState()
    const id = t.push({ kind: 'info', message: 'Deleted A' }, 1000)
    const shown = (): boolean => useToasts.getState().toasts.some((x) => x.id === id)
    t.hold(`hover-${id}`, true)
    vi.advanceTimersByTime(5000)
    expect(shown()).toBe(true)
    t.hold(`hover-${id}`, false)
    // A moment to move away (1.5 s at least), then it goes.
    vi.advanceTimersByTime(1400)
    expect(shown()).toBe(true)
    vi.advanceTimersByTime(200)
    expect(shown()).toBe(false)
  })

  it('release the hold of a toast that closes under the pointer', () => {
    vi.useFakeTimers()
    const t = useToasts.getState()
    const a = t.push({ kind: 'info', message: 'A' }, 1000)
    const b = t.push({ kind: 'info', message: 'B' }, 1000)
    t.hold(`hover-${a}`, true)
    t.dismiss(a)
    vi.advanceTimersByTime(1600)
    expect(useToasts.getState().toasts.some((x) => x.id === b)).toBe(false)
  })
})

describe('interface zoom', () => {
  it('steps by 10% within its limits and resets', () => {
    usePrefsStore.getState().set('uiScale', 1)
    scaleUi(1)
    expect(usePrefsStore.getState().uiScale).toBe(1.1)
    for (let i = 0; i < 20; i++) scaleUi(1)
    expect(usePrefsStore.getState().uiScale).toBe(UI_SCALE.max)
    for (let i = 0; i < 20; i++) scaleUi(-1)
    expect(usePrefsStore.getState().uiScale).toBe(UI_SCALE.min)
    scaleUi(0)
    expect(usePrefsStore.getState().uiScale).toBe(1)
  })
})
