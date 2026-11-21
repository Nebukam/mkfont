// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

/** Files the app watches, as the desktop app would. */
const watched = new Set<string>()

vi.mock('../../platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../platform')>()
  return {
    ...actual,
    isElectron: true,
    native: {
      watchFile: vi.fn(async (p: string) => void watched.add(p)),
      unwatchFile: vi.fn(async (p: string) => void watched.delete(p)),
      onFileChanged: vi.fn()
    }
  }
})

import { useDocStore } from '../../stores/doc-store'
import { closeSession, openSession, activateSession } from '../../stores/workspace'
import { componentKeys, resolveTarget, useOutlineEditorStore } from '../../stores/outline-editor-store'
import { useSelectionStore } from '../../stores/selection-store'
import { useUIStore } from '../../stores/ui-store'
import { createFamily, createGlyph, createLayer } from '../../core/model'
import { pathBBox } from '../../core/geometry'
import { deleteGlyphs, setTransforms } from '../../core/ops'
import { useToasts } from '../../components/ui/Overlays'
import { ScaleMode, type Glyph, type PathData } from '../../types/font'
import { bind, boundFile } from '../bindings'
import { isEnabled, runCommand } from '../commands'
import { commitOutline, openOutlineEditor } from '../outline'

const outline = (path: string): PathData => ({ exists: true, markedBBox: false, path, width: 100, height: 100, bbox: pathBBox(path) })

function font(): { family: ReturnType<typeof createFamily>; glyphs: Map<string, Glyph> } {
  const family = createFamily()
  const glyphs = new Map<string, Glyph>()
  glyphs.set('0041', createGlyph('0041', family.transforms, { pathData: outline('M0 0L50 0L50 50L0 50Z') }))
  glyphs.set('0042', createGlyph('0042', family.transforms))
  glyphs.set('0043', createGlyph('0043', family.transforms, { layers: [createLayer('A')] }))
  return { family, glyphs }
}

const doc = () => useDocStore.getState()
const path = (key = '0041'): string => doc().data!.glyphs.get(key)!.variants[0].pathData.path
const toasts = (): string[] => useToasts.getState().toasts.map((t) => t.message)

beforeEach(() => {
  doc().load(font(), { fileName: 't.mkfont' })
  useSelectionStore.getState().clear()
  useUIStore.getState().setRange({ kind: 'glyphs' })
  useOutlineEditorStore.setState({ open: false, locks: new Map() })
  for (const item of useToasts.getState().toasts) useToasts.getState().dismiss(item.id)
  watched.clear()
})

describe('outline edits', () => {
  it('are one named history step each, with the outline measured again', () => {
    expect(commitOutline(doc().docId, '0041', 'M-10 0L50 0L50 60L0 50Z', 'move')).toBe(true)
    expect(doc().history.map((h) => h.label)).toEqual(['Move points of A'])
    const pd = doc().data!.glyphs.get('0041')!.variants[0].pathData
    expect([pd.bbox.x, pd.bbox.width, pd.bbox.height, pd.width, pd.height]).toEqual([-10, 60, 60, 100, 100])
    // The font follows: the outline is fitted again from its new bounds.
    expect(doc().computed.get('0041')![0].ownMatrix).not.toBeNull()
    commitOutline(doc().docId, '0041', 'M-10 0L50 0L50 60Z', 'delete')
    expect(doc().history.map((h) => h.label)).toEqual(['Move points of A', 'Delete points of A'])
    doc().undo()
    doc().undo()
    expect(path()).toBe('M0 0L50 0L50 50L0 50Z')
  })

  it('merge while they share a run, and only then', () => {
    const id = doc().docId
    commitOutline(id, '0041', 'M1 0L50 0L50 50L0 50Z', 'move', 'nudge:1')
    commitOutline(id, '0041', 'M2 0L50 0L50 50L0 50Z', 'move', 'nudge:1')
    commitOutline(id, '0041', 'M3 0L50 0L50 50L0 50Z', 'move', 'nudge:2')
    commitOutline(id, '0041', 'M4 0L50 0L50 50L0 50Z', 'move')
    commitOutline(id, '0041', 'M5 0L50 0L50 50L0 50Z', 'move')
    expect(doc().history.length).toBe(4)
  })

  it('leave the font alone when nothing changed or the glyph is gone', () => {
    expect(commitOutline(doc().docId, '0041', path(), 'move')).toBe(false)
    expect(commitOutline(doc().docId, '0e01', 'M0 0L1 1Z', 'move')).toBe(false)
    expect(commitOutline(-1, '0041', 'M0 0L1 1Z', 'move')).toBe(false)
    expect(doc().history).toEqual([])
  })

  it('unlink a glyph from its SVG file, and say so once', () => {
    bind('0041', 'D:/art/a.svg')
    expect(boundFile('0041')).toBe('D:/art/a.svg')
    commitOutline(doc().docId, '0041', 'M1 0L50 0L50 50L0 50Z', 'move')
    expect(boundFile('0041')).toBeUndefined()
    expect(watched.has('D:/art/a.svg')).toBe(false)
    expect(toasts()).toEqual(['Unlinked A from a.svg'])
    commitOutline(doc().docId, '0041', 'M2 0L50 0L50 50L0 50Z', 'move')
    expect(toasts().length).toBe(1)
  })

  it('go to the font they were made in, also from another tab', () => {
    const first = openSession((store) => store.getState().load(font(), { fileName: 'a.mkfont' }))
    const idA = first.store.getState().docId
    const second = openSession((store) => store.getState().load(font(), { fileName: 'b.mkfont' }))
    activateSession(second.id)
    commitOutline(idA, '0041', 'M9 0L50 0L50 50L0 50Z', 'move')
    expect(first.store.getState().data!.glyphs.get('0041')!.variants[0].pathData.path).toBe('M9 0L50 0L50 50L0 50Z')
    expect(path()).toBe('M0 0L50 0L50 50L0 50Z')
    closeSession(second.id)
    closeSession(first.id)
  })
})

describe('what the editor shows', () => {
  const target = (lock: string | undefined, active: string | null) => resolveTarget(lock, active, doc().data?.glyphs, doc().computed)

  it('follows the active glyph, and says what it can do with it', () => {
    expect(target(undefined, null)).toEqual({ key: null, locked: false, state: 'none' })
    expect(target(undefined, '0041')).toEqual({ key: '0041', locked: false, state: 'ok' })
    expect(target(undefined, '0042').state).toBe('empty')
    expect(target(undefined, '0043').state).toBe('components')
    expect(target(undefined, '0e01').state).toBe('missing')
    doc().transact('Scale to nothing', (d) => setTransforms(d, ['0041'], { scale: ScaleMode.Manual, 'scale-factor': 0 }))
    expect(target(undefined, '0041').state).toBe('unfit')
  })

  it('offers the glyphs a composite is drawn with, each once and never itself', () => {
    const refs = (...chars: string[]) => chars.map((c) => createLayer(c))
    expect(componentKeys('0043', doc().data!.glyphs.get('0043')!.variants[0].layers)).toEqual(['0041'])
    // Component order; a glyph used twice, an empty component and the glyph itself count once or not at all.
    expect(componentKeys('00e9', refs('e', '´', 'e', '', 'é', 'U+0301', 'fi'))).toEqual(['0065', '00b4', '0301', '0066+0069'])
    expect(componentKeys('0043', undefined)).toEqual([])
  })

  it('stays on a locked glyph whatever is selected', () => {
    expect(target('0041', '0042')).toEqual({ key: '0041', locked: true, state: 'ok' })
    expect(target('0041', null).key).toBe('0041')
  })

  it('opens on the active glyph; asked for another glyph, the lock moves to it', () => {
    const id = doc().docId
    useSelectionStore.getState().setSelection(['0042', '0041'], '0041')
    openOutlineEditor()
    expect(useOutlineEditorStore.getState().open).toBe(true)
    expect(useSelectionStore.getState().keys).toEqual(['0042', '0041'])
    useOutlineEditorStore.getState().setLock(id, '0041')
    openOutlineEditor('0042')
    expect(useOutlineEditorStore.getState().locks.get(id)).toBe('0042')
    expect(useSelectionStore.getState().active).toBe('0042')
  })

  it('releases the lock of a glyph that is deleted', () => {
    const id = doc().docId
    useOutlineEditorStore.getState().setLock(id, '0041')
    doc().transact('Delete B', (d) => void deleteGlyphs(d, ['0042']))
    expect(useOutlineEditorStore.getState().locks.get(id)).toBe('0041')
    doc().transact('Delete A', (d) => void deleteGlyphs(d, ['0041']))
    expect(useOutlineEditorStore.getState().locks.has(id)).toBe(false)
  })
})

describe('the Edit outline command', () => {
  it('needs an active glyph that is in the font, in a glyph view', () => {
    expect(isEnabled('glyph.editOutline')).toBe(false)
    useSelectionStore.getState().setSelection(['0e01'], '0e01')
    expect(isEnabled('glyph.editOutline')).toBe(false)
    useSelectionStore.getState().setSelection(['0041'], '0041')
    expect(isEnabled('glyph.editOutline')).toBe(true)
    useUIStore.getState().setRange({ kind: 'kerning' })
    expect(isEnabled('glyph.editOutline')).toBe(false)
    useUIStore.getState().setRange({ kind: 'glyphs' })
    runCommand('glyph.editOutline')
    expect(useOutlineEditorStore.getState().open).toBe(true)
  })
})
