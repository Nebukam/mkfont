// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Paths written by saves. */
const writes: string[] = []

vi.mock('../../platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../platform')>()
  return {
    ...actual,
    isElectron: true,
    addRecentFile: vi.fn(async () => undefined),
    saveFile: vi.fn(async (opts: { path?: string | null }) => {
      writes.push(String(opts.path))
      return opts.path ?? null
    })
  }
})

import { activeDocStore, transact } from '../../stores/doc-store'
import { closeSession, useWorkspace } from '../../stores/workspace'
import { usePrefsStore } from '../../stores/prefs-store'
import { createFamily, createGlyph } from '../../core/model'
import { AUTOSAVE_TICK, closeFont, loadDocument, save, startAutosave } from '../document'
import { useDialogs } from '../dialogs'

let stop: () => void = () => undefined

/** A saved font with one unsaved edit, autosaved every minute. */
function editedFont(): void {
  loadDocument(createFamily(), new Map(), { fileName: 'b.mkfont', filePath: 'C:/fonts/b.mkfont' })
  transact('Add', (d) => void d.glyphs.set('0041', createGlyph('0041', d.family.transforms)))
}

beforeEach(() => {
  vi.useFakeTimers()
  for (const s of [...useWorkspace.getState().sessions]) closeSession(s.id)
  useDialogs.setState({ stack: [], busy: 0 })
  usePrefsStore.getState().set('autosave', true)
  usePrefsStore.getState().set('autosaveMinutes', 1)
  writes.length = 0
})

afterEach(() => {
  stop()
  usePrefsStore.getState().set('autosave', false)
  vi.useRealTimers()
})

describe('autosave', () => {
  it('saves once the changes are as old as the chosen interval, not at the next check', async () => {
    editedFont()
    stop = startAutosave()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(writes).toEqual([])
    await vi.advanceTimersByTimeAsync(AUTOSAVE_TICK)
    expect(writes).toEqual(['C:/fonts/b.mkfont'])
  })

  it('never saves under the "Save changes?" prompt, so "Don\'t save" leaves the file alone', async () => {
    editedFont()
    stop = startAutosave()
    const closing = closeFont()
    await vi.advanceTimersByTimeAsync(0)
    expect(useDialogs.getState().stack.map((d) => d.kind)).toEqual(['confirm'])
    // The prompt stays open well past the interval.
    await vi.advanceTimersByTimeAsync(5 * 60_000)
    expect(writes).toEqual([])
    const prompt = useDialogs.getState().stack[0]
    useDialogs.getState().close(prompt.id, 'alt')
    await closing
    expect(useWorkspace.getState().sessions).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(5 * 60_000)
    expect(writes).toEqual([])
  })

  it('a save that runs after its tab was closed writes nothing', async () => {
    editedFont()
    const store = activeDocStore()
    const session = useWorkspace.getState().sessions.find((s) => s.store === store)!
    closeSession(session.id)
    expect(await save(store)).toBe(false)
    expect(writes).toEqual([])
  })
})
