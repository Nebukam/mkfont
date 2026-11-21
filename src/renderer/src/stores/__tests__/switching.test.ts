// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { selectDirty, transact, useDocStore } from '../doc-store'
import { useSelectionStore } from '../selection-store'
import { canGoForward, useUIStore } from '../ui-store'
import { activateSession, closeSession, sessionForPath, useWorkspace } from '../workspace'
import { guardAllUnsaved, loadDocument, openNewFont } from '../../app/document'
import {
  commitFieldEdit,
  focusFallback,
  focusedField,
  restoreFieldFocus,
  unparkFocus,
  isFocusParked,
  isTypingUncommitted,
  reportFieldDirty,
  settleFieldFocus,
  trackFieldEdit,
  untrackFieldEdit
} from '../../components/ui/focus'
import { afterDialogs, dialogFlow, openDialog, useDialogs, type ConfirmResult } from '../../app/dialogs'
import { deleteKeys } from '../../app/actions'
import { useToasts } from '../../components/ui/Overlays'
import { createFamily, createGlyph } from '../../core/model'

function openFont(name: string, keys: string[] = []): number {
  const family = createFamily()
  const glyphs = new Map(keys.map((k) => [k, createGlyph(k, family.transforms as never)]))
  loadDocument(family, glyphs, { fileName: `${name}.mkfont`, filePath: `C:/fonts/${name}.mkfont` })
  return useWorkspace.getState().activeId!
}

const addGlyph = (key: string): void => void transact('Add', (d) => void d.glyphs.set(key, createGlyph(key, d.family.transforms as never)))
const shownName = (): string => useDocStore.getState().fileName
const closeDialogs = (): void => {
  for (const d of [...useDialogs.getState().stack]) useDialogs.getState().close(d.id, null as never)
}

/** Answers every save prompt with `result`, noting the font shown when it was asked. */
function answerPrompts(result: ConfirmResult, shown: string[]): () => void {
  return useDialogs.subscribe((s) => {
    const top = s.stack.at(-1)
    if (top?.kind !== 'confirm') return
    shown.push(shownName())
    queueMicrotask(() => useDialogs.getState().close(top.id, result as never))
  })
}

/** A focused field that commits on blur, like the inspector's number and text fields. */
function typingIn(commit: () => void, parent: HTMLElement = document.body, label?: string): HTMLInputElement {
  const field = document.createElement('input')
  if (label) field.setAttribute('aria-label', label)
  parent.appendChild(field)
  let typed = true
  const commitOnce = (): void => {
    if (typed) commit()
    typed = false
  }
  field.addEventListener('focus', () => trackFieldEdit(field, commitOnce))
  field.addEventListener('blur', () => {
    untrackFieldEdit(field)
    commitOnce()
  })
  field.focus()
  return field
}
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

let stop: (() => void) | null = null
beforeEach(() => {
  closeDialogs()
  for (const s of [...useWorkspace.getState().sessions]) closeSession(s.id)
})
afterEach(() => {
  unparkFocus()
  vi.useRealTimers()
  stop?.()
  stop = null
  closeDialogs()
  document.body.innerHTML = ''
})

describe('switching fonts', () => {
  it('commits text typed in a field into the font it was typed for, and keeps the field focused', () => {
    const a = openFont('a')
    openFont('b')
    const field = typingIn(() => addGlyph('0041'))
    activateSession(a)
    expect(useDocStore.getState().data!.glyphs.has('0041')).toBe(false)
    expect(selectDirty(useWorkspace.getState().sessions[1].store.getState())).toBe(true)
    // Never blurred: the keys typed next keep editing the field, not the glyphs.
    settleFieldFocus()
    expect(document.activeElement).toBe(field)
  })

  it('commits a field before the selection changes (a click in the grid)', () => {
    openFont('a', ['0041', '0042'])
    useSelectionStore.getState().setSelection(['0041'], '0041')
    // A field writes into the glyphs it showed at its last render, like React props.
    let rendered = ['0041']
    const written: string[] = []
    const field = typingIn(() => void written.push(...rendered))
    // The click selects on mouse down; the inspector then shows B before the field blurs.
    useSelectionStore.getState().setSelection(['0042'], '0042')
    rendered = ['0042']
    field.blur()
    expect(written).toEqual(['0041'])
  })

  it('gives focus back to the field after a cancelled close that showed another font', async () => {
    const a = openFont('a')
    openFont('b')
    addGlyph('0042')
    activateSession(a)
    const aside = document.createElement('aside')
    document.body.appendChild(aside)
    const field = typingIn(() => undefined, aside, 'Name')
    stop = useDialogs.subscribe((s) => {
      const top = s.stack.at(-1)
      if (top?.kind !== 'confirm') return
      // B's view has no Name field, and the prompt leaves focus on the page when it closes.
      field.remove()
      queueMicrotask(() => useDialogs.getState().close(top.id, null as never))
    })
    expect(await guardAllUnsaved()).toBe(false)
    // A is shown again, with its own Name field.
    const twin = document.createElement('input')
    twin.setAttribute('aria-label', 'Name')
    aside.appendChild(twin)
    settleFieldFocus()
    expect(document.activeElement).toBe(twin)
  })

  it('gives the field back after a cancel at the shown font’s own prompt, over the grid', async () => {
    openFont('b')
    addGlyph('0042')
    openFont('a')
    addGlyph('0041')
    const aside = document.createElement('aside')
    document.body.appendChild(aside)
    const field = typingIn(() => undefined, aside, 'Width')
    const grid = document.createElement('div')
    grid.tabIndex = 0
    grid.setAttribute('data-focus-fallback', '')
    document.body.appendChild(grid)
    let prompts = 0
    stop = useDialogs.subscribe((s) => {
      const top = s.stack.at(-1)
      if (top?.kind !== 'confirm') return
      if (++prompts === 1) {
        // B's prompt: B's view has no Width field. "Don't save".
        field.remove()
        queueMicrotask(() => useDialogs.getState().close(top.id, 'alt' as never))
      } else {
        // A's own prompt: A's view is back with its Width field, and focus fell to the grid.
        const twin = document.createElement('input')
        twin.setAttribute('aria-label', 'Width')
        twin.id = 'twin'
        aside.appendChild(twin)
        grid.focus()
        queueMicrotask(() => useDialogs.getState().close(top.id, null as never))
      }
    })
    expect(await guardAllUnsaved()).toBe(false)
    expect(document.activeElement?.id).toBe('twin')
  })

  it('gives the field back after a cancel that switches fonts, over the grid', async () => {
    const a = openFont('a')
    openFont('b')
    addGlyph('0042')
    activateSession(a)
    const aside = document.createElement('aside')
    document.body.appendChild(aside)
    const field = typingIn(() => undefined, aside, 'Name')
    const grid = document.createElement('div')
    grid.tabIndex = 0
    grid.setAttribute('data-focus-fallback', '')
    document.body.appendChild(grid)
    stop = useDialogs.subscribe((s) => {
      const top = s.stack.at(-1)
      if (top?.kind !== 'confirm') return
      field.remove()
      // A slow answer (a Save dialog) let focus fall to the grid before the cancel.
      grid.focus()
      queueMicrotask(() => useDialogs.getState().close(top.id, null as never))
    })
    expect(await guardAllUnsaved()).toBe(false)
    const twin = document.createElement('input')
    twin.setAttribute('aria-label', 'Name')
    aside.appendChild(twin)
    settleFieldFocus()
    expect(document.activeElement).toBe(twin)
  })

  it('keeps single keys held back when a closing prompt’s fallback runs a frame later', async () => {
    const grid = document.createElement('div')
    grid.tabIndex = 0
    grid.setAttribute('data-focus-fallback', '')
    document.body.appendChild(grid)
    openFont('a')
    const aside = document.createElement('aside')
    document.body.appendChild(aside)
    const field = typingIn(() => undefined, aside, 'Rotation')
    const memo = focusedField()!
    // The view comes back without that field (a closed disclosure).
    field.remove()
    restoreFieldFocus(memo)
    expect(isFocusParked()).toBe(true)
    // What a prompt schedules as it closes.
    focusFallback()
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
    expect(document.activeElement).toBe(document.body)
    expect(isFocusParked()).toBe(true)
  })

  it('gives focus back to the same one of several fields with one label', () => {
    openFont('a')
    const aside = document.createElement('aside')
    document.body.appendChild(aside)
    const named = (): HTMLInputElement => {
      const el = document.createElement('input')
      el.setAttribute('aria-label', 'X')
      aside.appendChild(el)
      return el
    }
    // Two components, each with an X field; the user is in the second one.
    const first = named()
    const second = typingIn(() => undefined, aside, 'X')
    const memo = focusedField()!
    first.remove()
    second.remove()
    named()
    const again = named()
    restoreFieldFocus(memo)
    expect(document.activeElement).toBe(again)
  })

  it('hands focus to the same field of the new view, or holds single keys back', () => {
    const a = openFont('a')
    openFont('b')
    const aside = document.createElement('aside')
    document.body.appendChild(aside)
    const field = typingIn(() => addGlyph('0041'), aside, 'Width')
    activateSession(a)
    // The view of the new font has its own Width field (another element).
    field.remove()
    const twin = document.createElement('input')
    twin.setAttribute('aria-label', 'Width')
    aside.appendChild(twin)
    settleFieldFocus()
    expect(document.activeElement).toBe(twin)
    // No counterpart at all: focus is on the page, and single keys wait.
    const other = typingIn(() => undefined, aside, 'Height')
    activateSession(useWorkspace.getState().sessions[1].id)
    other.remove()
    twin.remove()
    settleFieldFocus()
    expect(document.activeElement).toBe(document.body)
    expect(isFocusParked()).toBe(true)
  })

  it('reports text typed but not committed (the window asks before closing)', () => {
    openFont('a')
    const field = typingIn(() => addGlyph('0041'))
    expect(isTypingUncommitted()).toBe(false)
    reportFieldDirty(field, true)
    expect(isTypingUncommitted()).toBe(true)
    field.blur()
    expect(isTypingUncommitted()).toBe(false)
  })

  it('commits a field for Save without taking focus from it', () => {
    openFont('a')
    const field = typingIn(() => addGlyph('0041'))
    commitFieldEdit()
    expect(useDocStore.getState().data!.glyphs.has('0041')).toBe(true)
    expect(document.activeElement).toBe(field)
  })

  it('keeps a new font that a field was typed in when another opens', () => {
    openNewFont()
    typingIn(() => addGlyph('0041'))
    openNewFont()
    expect(useWorkspace.getState().sessions.map((s) => s.store.getState().data!.glyphs.size)).toEqual([1, 0])
  })

  it('asks about each unsaved font, and goes back to the font shown when cancelled', async () => {
    openFont('a')
    addGlyph('0041')
    openFont('b')
    addGlyph('0042')
    openFont('c')
    const shown: string[] = []
    stop = answerPrompts(null, shown)
    expect(await guardAllUnsaved()).toBe(false)
    expect(shown).toEqual(['a.mkfont'])
    expect(shownName()).toBe('c.mkfont')
  })

  it('does not switch fonts under an open dialog', async () => {
    openFont('a')
    addGlyph('0041')
    openFont('b')
    void openDialog('glyph-picker', {})
    const shown: string[] = []
    stop = answerPrompts('alt', shown)
    expect(await guardAllUnsaved()).toBe(true)
    expect(shown).toEqual(['b.mkfont'])
  })

  it('opens files from the system only once a flow of prompts and saves is over', async () => {
    const runs: string[] = []
    let answer: () => void = () => undefined
    const flow = dialogFlow(async () => {
      void openDialog('confirm', { title: 'Save a?' })
      afterDialogs(() => runs.push('file'))
      closeDialogs()
      // The answer was "Save": the write takes a while before the next prompt.
      await new Promise<void>((resolve) => (answer = resolve))
      void openDialog('confirm', { title: 'Save b?' })
      closeDialogs()
    })
    await tick()
    expect(runs).toEqual([])
    answer()
    await flow
    await tick()
    expect(runs).toEqual(['file'])
  })

  it('opens files from the system once no dialog is open, also between two prompts', async () => {
    const runs: string[] = []
    afterDialogs(() => runs.push('now'))
    void openDialog('glyph-picker', {})
    afterDialogs(() => runs.push('later'))
    expect(runs).toEqual(['now'])
    // The next prompt opens as soon as one closes (one per unsaved font): still waiting.
    closeDialogs()
    void openDialog('confirm', { title: 'Next font?' })
    await tick()
    expect(runs).toEqual(['now'])
    closeDialogs()
    await tick()
    expect(runs).toEqual(['now', 'later'])
  })

  it('undoes a delete in its own font from the toast, after switching', () => {
    const a = openFont('a', ['0041'])
    deleteKeys(['0041'])
    openFont('b')
    useToasts.getState().toasts.at(-1)!.action!.run()
    activateSession(a)
    expect(useDocStore.getState().data!.glyphs.has('0041')).toBe(true)
  })

  it('records no Back step when a tab is shown again', () => {
    vi.useFakeTimers()
    const a = openFont('a', ['0041', '0042'])
    useSelectionStore.getState().setSelection(['0041'], '0041')
    vi.advanceTimersByTime(300)
    useSelectionStore.getState().setSelection(['0042'], '0042')
    vi.advanceTimersByTime(300)
    useUIStore.getState().goBack()
    // Typed after the last step: showing the tab again must not make it a new step.
    useUIStore.getState().setSearchText('x')
    openFont('b')
    activateSession(a)
    vi.advanceTimersByTime(300)
    expect(canGoForward()).toBe(true)
  })

  it('finds an open file whatever its separators', () => {
    const a = openFont('a')
    const backslash = String.fromCharCode(92)
    expect(sessionForPath(['C:', 'fonts', 'a.mkfont'].join(backslash))?.id).toBe(a)
    expect(sessionForPath('C://fonts//a.mkfont')?.id).toBe(a)
    expect(sessionForPath('C:/fonts/b.mkfont')).toBeNull()
  })
})
