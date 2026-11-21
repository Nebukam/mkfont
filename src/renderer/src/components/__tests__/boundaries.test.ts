// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Boundary } from '../ui/Boundary'
import { useToasts } from '../ui/Overlays'
import { DialogHost } from '../dialogs/DialogHost'
import { confirmDialog, pickGlyphs, useDialogs } from '../../app/dialogs'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
let container: HTMLElement

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  // React reports the errors these tests cause on purpose.
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  useDialogs.setState({ stack: [], busy: 0 })
  for (const item of useToasts.getState().toasts) useToasts.getState().dismiss(item.id)
  vi.restoreAllMocks()
})

function Boom({ fail }: { fail: boolean }): ReactNode {
  if (fail) throw new Error('boom')
  return 'fine'
}

describe('error boundaries', () => {
  it('show their fallback in place of what failed, and leave the rest alone', () => {
    const errors: string[] = []
    act(() =>
      root.render(
        h(
          'div',
          null,
          h('span', null, 'sibling '),
          h(Boundary, {
            name: 'test',
            onError: (e: Error) => void errors.push(e.message),
            fallback: (e: Error) => e.message,
            children: h(Boom, { fail: true })
          })
        )
      )
    )
    expect(container.textContent).toBe('sibling boom')
    expect(errors).toEqual(['boom'])
  })

  it('try again when one of their reset keys changes', () => {
    const show = (key: number, fail: boolean): void =>
      act(() => root.render(h(Boundary, { name: 'test', resetKeys: [key], fallback: () => 'failed', children: h(Boom, { fail }) })))
    show(1, true)
    expect(container.textContent).toBe('failed')
    // Same key: the content does not try again by itself.
    show(1, false)
    expect(container.textContent).toBe('failed')
    show(2, false)
    expect(container.textContent).toBe('fine')
  })
})

describe('a dialog that fails while showing', () => {
  it('closes as if cancelled, says so, and the next dialogs show', async () => {
    act(() => root.render(h(DialogHost)))
    let answer: unknown = 'waiting'
    act(() => {
      // An object where text belongs: React throws while rendering it.
      void confirmDialog({ title: 'Broken', message: {} as unknown as string }).then((r) => (answer = r))
    })
    await act(async () => {})
    expect(answer).toBeNull()
    expect(useDialogs.getState().stack).toEqual([])
    expect(useToasts.getState().toasts.map((x) => x.kind)).toContain('error')

    // Another kind answers what its Cancel button answers.
    let picked: unknown = 'waiting'
    act(() => {
      void pickGlyphs({ title: {} as unknown as string }).then((r) => (picked = r))
    })
    await act(async () => {})
    expect(picked).toBeNull()

    act(() => void confirmDialog({ title: 'Works' }))
    expect(document.body.textContent).toContain('Works')
    expect(useDialogs.getState().stack).toHaveLength(1)
  })
})
