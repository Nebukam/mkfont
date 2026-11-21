// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The fonts of these tests sit at Windows paths (C:/fonts/a.mkfont), and one test finds a
// font under another spelling of its path. Paths are compared the way the system does
// (src/renderer/src/platform, read once when it loads), so the tests name the system
// before anything is imported: they then run the same on Linux and macOS.
vi.hoisted(() => {
  Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })
})

import { createDocStore, selectDirty, transact, useDocStore } from '../doc-store'
import { useSelectionStore } from '../selection-store'
import { useUIStore } from '../ui-store'
import { activateSession, anyDirty, closeSession, cycleSession, sessionForPath, useWorkspace } from '../workspace'
import { loadDocument, openNewFont } from '../../app/document'
import { copySelection, pasteInPlace } from '../../app/clipboard'
import { exportDirFor, rememberExportDir } from '../../app/export-dirs'
import { createFamily, createGlyph } from '../../core/model'

function openFont(name: string, keys: string[], em = 1000): number {
  const family = createFamily({ em })
  const glyphs = new Map(keys.map((k) => [k, createGlyph(k, family.transforms as never)]))
  loadDocument(family, glyphs, { fileName: `${name}.mkfont`, filePath: `C:/fonts/${name}.mkfont` })
  return useWorkspace.getState().activeId!
}

const tabs = (): string[] => useWorkspace.getState().sessions.map((s) => s.store.getState().fileName)

beforeEach(() => {
  for (const s of [...useWorkspace.getState().sessions]) closeSession(s.id)
})

describe('workspace tabs', () => {
  it('opens each font in a tab, and every reader sees the active one', () => {
    const a = openFont('a', ['0041', '0042'])
    openFont('b', ['0043'])
    expect(tabs()).toEqual(['a.mkfont', 'b.mkfont'])
    expect(useDocStore.getState().fileName).toBe('b.mkfont')
    activateSession(a)
    expect(useDocStore.getState().data!.glyphs.has('0041')).toBe(true)
    expect(sessionForPath('c:/FONTS/A.mkfont')?.id).toBe(a)
    cycleSession(1)
    expect(useDocStore.getState().fileName).toBe('b.mkfont')
  })

  it('keeps the selection, view and search of each tab', () => {
    const a = openFont('a', ['0041'])
    useSelectionStore.getState().setSelection(['0041'], '0041')
    useUIStore.getState().setRange({ kind: 'ligatures' })
    useUIStore.getState().setSearchText('x')
    const b = openFont('b', ['0043'])
    expect(useSelectionStore.getState().keys).toEqual([])
    expect(useUIStore.getState().range).toEqual({ kind: 'glyphs' })
    expect(useUIStore.getState().searchText).toBe('')
    useSelectionStore.getState().setSelection(['0043'], '0043')
    activateSession(a)
    expect(useSelectionStore.getState().keys).toEqual(['0041'])
    expect(useUIStore.getState().range).toEqual({ kind: 'ligatures' })
    expect(useUIStore.getState().searchText).toBe('x')
    activateSession(b)
    expect(useSelectionStore.getState().active).toBe('0043')
  })

  it('keeps edits, undo and unsaved changes with their own font', () => {
    const a = openFont('a', ['0041'])
    const b = openFont('b', [])
    activateSession(a)
    transact('Add B', (d) => void d.glyphs.set('0042', createGlyph('0042', d.family.transforms as never)))
    activateSession(b)
    expect(selectDirty(useDocStore.getState())).toBe(false)
    expect(anyDirty()).toBe(true)
    useDocStore.getState().undo()
    activateSession(a)
    expect(useDocStore.getState().data!.glyphs.has('0042')).toBe(true)
  })

  it('shows the neighbour when a tab closes, and the welcome screen after the last', () => {
    openFont('a', [])
    const b = openFont('b', [])
    openFont('c', [])
    activateSession(b)
    closeSession(b)
    expect(useDocStore.getState().fileName).toBe('c.mkfont')
    for (const s of [...useWorkspace.getState().sessions]) closeSession(s.id)
    expect(useDocStore.getState().data).toBeNull()
  })

  it('replaces an untouched new font, and numbers the new fonts it keeps', () => {
    openNewFont()
    openFont('a', [])
    expect(tabs()).toEqual(['a.mkfont'])
    openNewFont()
    transact('Add A', (d) => void d.glyphs.set('0041', createGlyph('0041', d.family.transforms as never)))
    openNewFont()
    expect(tabs()).toEqual(['a.mkfont', 'Untitled.mkfont', 'Untitled 2.mkfont'])
  })

  it('pastes glyphs copied in one font into another, at that font’s scale', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(async () => undefined) }, configurable: true })
    const a = openFont('a', ['0041'], 1000)
    useDocStore.setState((s) => {
      const g = s.data!.glyphs.get('0041')!
      g.variants[0].width = 500
      return {}
    })
    useSelectionStore.getState().setSelection(['0041'], '0041')
    await copySelection()
    openFont('b', [], 2000)
    pasteInPlace()
    expect(useDocStore.getState().data!.glyphs.get('0041')?.variants[0].width).toBe(1000)
    activateSession(a)
    expect(useDocStore.getState().data!.glyphs.size).toBe(1)
  })
})

describe('export folders', () => {
  it('remember the last export folder of each project, also when it is opened again', () => {
    const store = createDocStore()
    store.getState().load({ family: createFamily(), glyphs: new Map() }, { fileName: 'x.mkfont', filePath: 'C:/work/x.mkfont' })
    rememberExportDir(store, 'C:/out')
    const reopened = createDocStore()
    reopened.getState().load({ family: createFamily(), glyphs: new Map() }, { fileName: 'x.mkfont', filePath: 'C:/work/x.mkfont' })
    expect(exportDirFor(reopened)).toBe('C:/out')
    const untitled = createDocStore()
    untitled.getState().load({ family: createFamily(), glyphs: new Map() }, { fileName: 'Untitled.mkfont' })
    expect(exportDirFor(untitled)).toBeNull()
    rememberExportDir(untitled, 'C:/tmp')
    expect(exportDirFor(untitled)).toBe('C:/tmp')
  })
})

afterEach(() => vi.useRealTimers())
