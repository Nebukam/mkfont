// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { NumberField, TextField, type NumberFieldProps } from '../fields'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
  delete (document as unknown as Record<string, unknown>).pointerLockElement
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).requestPointerLock
  delete (document as unknown as Record<string, unknown>).exitPointerLock
})

function mount(props: Partial<NumberFieldProps> & Pick<NumberFieldProps, 'onChange'>, extra?: React.ReactElement): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(h('div', null, h(NumberField, { value: 100, ariaLabel: 'Width', ...props }), extra)))
  return container
}

function pointer(el: Element, type: string, init: PointerEventInit = {}): void {
  act(() => void el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, ...init })))
}

/** Press at x = 100 and drag to each of `xs` in turn (the button stays down). */
function drag(el: Element, xs: number[], init: PointerEventInit = {}): void {
  pointer(el, 'pointerdown', { clientX: 100 })
  for (const x of xs) pointer(el, 'pointermove', { clientX: x, ...init })
}

describe('number field scrubbing', () => {
  it('steps the value while the field is dragged sideways, without focusing it', () => {
    const onChange = vi.fn()
    const input = mount({ onChange }).querySelector('input')!
    // 3 px to become a drag, then 2 px per step.
    drag(input, [103, 109])
    expect(onChange).toHaveBeenLastCalledWith(103, { interactive: true })
    pointer(input, 'pointermove', { clientX: 105 })
    expect(onChange).toHaveBeenLastCalledWith(101, { interactive: true })
    pointer(input, 'pointerup', { clientX: 105 })
    expect(document.activeElement).not.toBe(input)
    // The button is up: moving over the field changes nothing.
    onChange.mockClear()
    pointer(input, 'pointermove', { clientX: 140 })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('steps like the wheel: Shift ×10, Alt ×0.1, within min and max', () => {
    const onChange = vi.fn()
    const input = mount({ onChange, max: 125 }).querySelector('input')!
    drag(input, [103, 105], { shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith(110, { interactive: true })
    pointer(input, 'pointermove', { clientX: 107, altKey: true })
    expect(onChange).toHaveBeenLastCalledWith(110.1, { interactive: true })
    pointer(input, 'pointermove', { clientX: 120, shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith(125, { interactive: true })
  })

  it('focuses the field on a press that does not move', () => {
    const onChange = vi.fn()
    const input = mount({ onChange }).querySelector('input')!
    drag(input, [101])
    pointer(input, 'pointerup', { clientX: 101 })
    expect(document.activeElement).toBe(input)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('leaves the mouse to the text while the field is typed in', () => {
    const onChange = vi.fn()
    const input = mount({ onChange }).querySelector('input')!
    act(() => input.focus())
    drag(input, [104, 130])
    expect(onChange).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(input)
  })

  it('drags from the label too', () => {
    const onChange = vi.fn()
    const label = mount({ onChange, label: 'X' }).querySelector('span')!
    drag(label, [97, 91])
    expect(onChange).toHaveBeenLastCalledWith(97, { interactive: true })
  })

  it('commits the text typed in another field when a drag starts', () => {
    const onChange = vi.fn()
    const onName = vi.fn()
    const container = mount({ onChange }, h(TextField, { value: 'Alpha', onChange: onName, ariaLabel: 'Name' }))
    const [input, name] = container.querySelectorAll('input')
    act(() => name.focus())
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(name, 'Beta')
      name.dispatchEvent(new Event('input', { bubbles: true }))
    })
    drag(input, [103])
    expect(onName).toHaveBeenLastCalledWith('Beta')
    expect(document.activeElement).not.toBe(name)
  })

  it('locks the pointer for the drag and follows its movement, until the lock is lost', async () => {
    let locked: Element | null = null
    const setLock = (el: Element | null): void => {
      locked = el
      act(() => void document.dispatchEvent(new Event('pointerlockchange')))
    }
    Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: () => locked })
    const exit = vi.fn(() => setLock(null))
    ;(document as unknown as Record<string, unknown>).exitPointerLock = exit
    const request = vi.fn(function (this: Element, _options?: PointerLockOptions) {
      setLock(this)
      return Promise.resolve()
    })
    ;(HTMLElement.prototype as unknown as Record<string, unknown>).requestPointerLock = request
    const onChange = vi.fn()
    const input = mount({ onChange }).querySelector('input')!
    drag(input, [103])
    expect(locked).toBe(input)
    // The mouse's own movement: an adjusted lock on Windows jumps as it recenters the pointer.
    expect(request).toHaveBeenLastCalledWith({ unadjustedMovement: true })
    // A locked pointer does not move: only its movement is reported, without limit.
    for (let i = 0; i < 500; i++) pointer(input, 'pointermove', { clientX: 103, movementX: 4 })
    expect(onChange).toHaveBeenLastCalledWith(1100, { interactive: true })
    // The lock takes the capture: that does not end the drag.
    pointer(input, 'lostpointercapture', { clientX: 103 })
    pointer(input, 'pointermove', { clientX: 103, movementX: -2 })
    expect(onChange).toHaveBeenLastCalledWith(1099, { interactive: true })
    // The browser moving the pointer (back to the window's center) is not a drag.
    onChange.mockClear()
    pointer(input, 'pointermove', { clientX: 103, movementX: -600, movementY: 12 })
    pointer(input, 'pointermove', { clientX: 103, movementX: 8, movementY: -400 })
    expect(onChange).not.toHaveBeenCalled()
    pointer(input, 'pointermove', { clientX: 103, movementX: 2 })
    expect(onChange).toHaveBeenLastCalledWith(1100, { interactive: true })
    // Escape releases the pointer: the drag is over.
    setLock(null)
    onChange.mockClear()
    pointer(input, 'pointermove', { clientX: 150, movementX: 46 })
    expect(onChange).not.toHaveBeenCalled()
    // Released by the button instead: the field lets the pointer go.
    drag(input, [103])
    expect(locked).toBe(input)
    pointer(input, 'pointerup', { clientX: 103 })
    expect(exit).toHaveBeenCalledTimes(1)
    expect(locked).toBeNull()
  })

  it('goes on with the captured pointer when the lock is refused, without asking for another one', async () => {
    const request = vi.fn(() => Promise.reject(new DOMException('no unadjusted movement', 'NotSupportedError')))
    ;(HTMLElement.prototype as unknown as Record<string, unknown>).requestPointerLock = request
    const onChange = vi.fn()
    const input = mount({ onChange }).querySelector('input')!
    drag(input, [103])
    await act(async () => undefined)
    // Whatever movement the event claims, only where the pointer is counts.
    pointer(input, 'pointermove', { clientX: 109, movementX: -400 })
    expect(onChange).toHaveBeenLastCalledWith(103, { interactive: true })
    expect(request).toHaveBeenCalledTimes(1)
  })
})
