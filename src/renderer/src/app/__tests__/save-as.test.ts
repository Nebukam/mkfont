// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The desktop app, with a save dialog that answers `dialog.path`.
const dialog = { path: '' }
vi.mock('../../platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../platform')>()
  return {
    ...actual,
    isElectron: true,
    addRecentFile: vi.fn(async () => undefined),
    saveFile: vi.fn(async (opts: { path?: string | null; beforeWrite?: (path: string) => boolean }) => {
      const target = opts.path ?? dialog.path
      return opts.beforeWrite && !opts.beforeWrite(target) ? null : target
    })
  }
})

import { transact, useDocStore } from '../../stores/doc-store'
import { closeSession, useWorkspace } from '../../stores/workspace'
import { loadDocument, saveAs } from '../document'
import { createFamily, createGlyph } from '../../core/model'

const openFont = (name: string, filePath: string | null): void =>
  loadDocument(createFamily(), new Map(), { fileName: `${name}.mkfont`, filePath })
const addGlyph = (key: string): void => void transact('Add', (d) => void d.glyphs.set(key, createGlyph(key, d.family.transforms as never)))
const paths = (): (string | null)[] => useWorkspace.getState().sessions.map((s) => s.store.getState().filePath)
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  for (const s of [...useWorkspace.getState().sessions]) closeSession(s.id)
})

describe('save as over a file open in another tab', () => {
  it('closes the tab that showed the replaced file', async () => {
    openFont('a', 'C:/f/a.mkfont')
    openFont('new', null)
    addGlyph('0041')
    dialog.path = 'C:/f/a.mkfont'
    expect(await saveAs()).toBe(true)
    await settle()
    expect(paths()).toEqual(['C:/f/a.mkfont'])
    expect(useDocStore.getState().data!.glyphs.has('0041')).toBe(true)
  })

  it('stops when that tab has unsaved changes', async () => {
    openFont('a', 'C:/f/a.mkfont')
    addGlyph('0042')
    openFont('new', null)
    addGlyph('0041')
    dialog.path = 'C:/f/a.mkfont'
    expect(await saveAs()).toBe(false)
    await settle()
    expect(paths()).toEqual(['C:/f/a.mkfont', null])
  })
})
