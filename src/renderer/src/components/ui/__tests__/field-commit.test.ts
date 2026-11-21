// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { TextField } from '../fields'
import { commitFieldEdit, isTypingUncommitted } from '../focus'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
})

function mount(value: string, onChange: (v: string) => void): HTMLInputElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(h(TextField, { value, onChange, ariaLabel: 'Name' })))
  return container.querySelector('input')!
}

/** Type into a controlled input the way React sees it. */
function type(input: HTMLInputElement, text: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setter.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('text field commits', () => {
  it('commits once on Save, keeps focus, and then follows the value (another font)', () => {
    const onChange = vi.fn()
    const input = mount('Alpha', onChange)
    act(() => input.focus())
    type(input, 'Beta')
    expect(isTypingUncommitted()).toBe(true)
    act(() => commitFieldEdit())
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith('Beta')
    expect(document.activeElement).toBe(input)
    expect(isTypingUncommitted()).toBe(false)
    // Another font is shown: the focused field takes its value.
    act(() => root!.render(h(TextField, { value: 'Gamma', onChange, ariaLabel: 'Name' })))
    expect(input.value).toBe('Gamma')
    // Leaving the field commits nothing more.
    act(() => input.blur())
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('drops the typed text on Escape', () => {
    const onChange = vi.fn()
    const input = mount('Alpha', onChange)
    act(() => input.focus())
    type(input, 'Beta')
    act(() => void input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    expect(onChange).not.toHaveBeenCalled()
    expect(input.value).toBe('Alpha')
  })
})
