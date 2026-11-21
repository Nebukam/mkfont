// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { DocTabs } from '../DocTabs'
import { closeSession, useWorkspace } from '../../../stores/workspace'
import { closeFont, loadDocument } from '../../../app/document'
import { createFamily } from '../../../core/model'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
let container: HTMLElement
const openFont = (name: string): void =>
  act(() => loadDocument(createFamily(), new Map(), { fileName: `${name}.mkfont`, filePath: `C:/f/${name}.mkfont` }))
const tabButton = (name: string): HTMLButtonElement =>
  [...container.querySelectorAll<HTMLButtonElement>('button[aria-current], button[data-tip]')].find((b) => b.getAttribute('aria-label') === name)!

beforeEach(() => {
  for (const s of [...useWorkspace.getState().sessions]) closeSession(s.id)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(h(DocTabs)))
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  for (const s of [...useWorkspace.getState().sessions]) closeSession(s.id)
})

describe('closing a tab', () => {
  it('gives the focus it held to the tab shown next, however it closes (Ctrl+W)', async () => {
    openFont('a')
    openFont('b')
    tabButton('b').focus()
    await act(async () => closeFont())
    expect(document.activeElement).toBe(tabButton('a'))
  })

  it('leaves focus alone when the closed tab did not hold it', async () => {
    openFont('a')
    openFont('b')
    const elsewhere = document.createElement('input')
    document.body.appendChild(elsewhere)
    elsewhere.focus()
    await act(async () => closeFont())
    expect(document.activeElement).toBe(elsewhere)
    elsewhere.remove()
  })
})
