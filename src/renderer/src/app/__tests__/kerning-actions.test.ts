// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDocStore } from '../../stores/doc-store'
import { usePairSelectionStore, useSelectionStore } from '../../stores/selection-store'
import { freshView, useUIStore } from '../../stores/ui-store'
import { useInspectorStore } from '../../stores/inspector-store'
import { activateSession, openSession, useWorkspace } from '../../stores/workspace'
import { createFamily, createGlyph } from '../../core/model'
import { pairKey } from '../../core/kerning'
import type { Glyph } from '../../types/font'
import { useToasts } from '../../components/ui/Overlays'
import { addPair, addPairFromText, applySuggestions, followBase, nudgePairs, parsePairText, removePairs, setInheritance, setPairValues, showPairs } from '../kerning'
import { useKernSuggestions } from '../kern-suggestions'
import { pairMenu } from '../context-menus'
import type { MenuItem } from '../../components/ui/Menu'
import { installKeyboard, isEnabled, runCommand } from '../commands'
import { useViewStore } from '../actions'

const T = '0054'
const A = '0041'
const V = '0056'
const TA = pairKey(T, A)
const AV = pairKey(A, V)

const doc = () => useDocStore.getState()
const kerning = () => doc().data!.kerning
const pairs = () => usePairSelectionStore.getState().keys
const glyphSel = () => useSelectionStore.getState().keys

beforeEach(() => {
  vi.useFakeTimers()
  const family = createFamily()
  const glyphs = new Map<string, Glyph>([T, A, V].map((k) => [k, createGlyph(k, family.transforms as never)]))
  doc().load({ family, glyphs, kerning: new Map([[AV, -55]]) }, { fileName: 't.mkfont' })
  useSelectionStore.getState().clear()
  usePairSelectionStore.getState().clear()
  vi.runAllTimers()
  useUIStore.setState(freshView())
  useInspectorStore.setState({ pairFocus: null })
})
afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

describe('typing a pair', () => {
  it('reads two characters, U+ codes, or two glyphs separated by a space', () => {
    expect(parsePairText('TA')).toEqual([T, A])
    expect(parsePairText(' U+0054U+0041 ')).toEqual([T, A])
    expect(parsePairText('fi x')).toEqual(['0066+0069', '0078'])
    expect(parsePairText('T')).toBeNull()
    expect(parsePairText('fix')).toBeNull()
    expect(parsePairText('a b c')).toBeNull()
  })
})

describe('adding a pair', () => {
  it('adds it at 0, shows it in the Kerning view, and readies its value field', () => {
    useSelectionStore.getState().setSelection([T, A])
    addPair(T, A)
    expect(kerning().get(TA)).toBe(0)
    expect(doc().history.at(-1)?.label).toBe('Add kerning pair TA')
    expect(useUIStore.getState().range).toEqual({ kind: 'kerning' })
    expect(pairs()).toEqual([TA])
    expect(useUIStore.getState().revealKey).toBe(TA)
    expect(useInspectorStore.getState().pairFocus).toBe(TA)
    // The glyph selection is left as it was.
    expect(glyphSel()).toEqual([T, A])
  })

  it('selects a pair that exists instead of resetting it', () => {
    addPair(A, V)
    expect(kerning().get(AV)).toBe(-55)
    expect(doc().history.length).toBe(0)
    expect(pairs()).toEqual([AV])
  })

  it('from text, and says when the text is not a pair', () => {
    expect(addPairFromText('TA')).toBe(true)
    expect(kerning().has(TA)).toBe(true)
    expect(addPairFromText('TAV')).toBe(false)
    expect(useToasts.getState().toasts.at(-1)?.message).toBe('Type two characters to add a pair')
  })

  it('shows a pair hidden by the search or by "Existing only"', () => {
    useUIStore.setState({ range: { kind: 'kerning' }, searchText: 'zzz', searchExists: true })
    showPairs([pairKey(T, '0042')])
    expect(useUIStore.getState().searchText).toBe('')
    expect(useUIStore.getState().searchExists).toBe(false)
  })
})

describe('editing pairs', () => {
  it('sets values, merging a scrub into one undo step', () => {
    setPairValues([AV], -60, true)
    setPairValues([AV], -70, true)
    expect(kerning().get(AV)).toBe(-70)
    expect(doc().history.map((h) => h.label)).toEqual(['Set kerning of AV'])
    doc().undo()
    expect(kerning().get(AV)).toBe(-55)
  })

  it('nudges every selected pair from its own value', () => {
    setPairValues([TA], -100)
    nudgePairs([AV, TA], -10)
    expect(kerning().get(AV)).toBe(-65)
    expect(kerning().get(TA)).toBe(-110)
  })

  it('removes pairs, with an Undo in the notice', () => {
    removePairs([AV, TA])
    expect(kerning().size).toBe(0)
    expect(doc().history.at(-1)?.label).toBe('Remove kerning pair AV')
    const notice = useToasts.getState().toasts.at(-1)!
    expect(notice.message).toBe('Removed kerning pair AV')
    notice.action!.run()
    expect(kerning().get(AV)).toBe(-55)
  })
})

describe('commands in the Kerning view', () => {
  beforeEach(() => {
    useUIStore.getState().setRange({ kind: 'kerning' })
    useViewStore.setState({ keys: [AV] })
    useSelectionStore.getState().setSelection([T])
  })

  it('Delete removes the selected pairs, not the selected glyphs', () => {
    usePairSelectionStore.getState().setSelection([AV])
    runCommand('edit.delete')
    expect(kerning().has(AV)).toBe(false)
    expect(doc().data!.glyphs.has(T)).toBe(true)
  })

  it('Delete from the keyboard on the grid', () => {
    document.body.innerHTML = '<div role="grid" tabindex="0"></div>'
    const uninstall = installKeyboard()
    const grid = document.querySelector<HTMLElement>('[role="grid"]')!
    usePairSelectionStore.getState().setSelection([AV])
    grid.focus()
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }))
    uninstall()
    expect(kerning().has(AV)).toBe(false)
  })

  it('select all, invert and deselect act on pairs', () => {
    runCommand('select.all')
    expect(pairs()).toEqual([AV])
    runCommand('select.invert')
    expect(pairs()).toEqual([])
    usePairSelectionStore.getState().setSelection([AV])
    runCommand('select.none')
    expect(pairs()).toEqual([])
    expect(glyphSel()).toEqual([T])
  })

  it('glyph commands and selection slots are off', () => {
    for (const id of ['glyph.create', 'glyph.reset', 'glyph.compose', 'glyph.editOutline', 'edit.copy', 'edit.paste', 'preset.restore.1', 'preset.store.1', 'glyph.kern']) {
      expect(isEnabled(id), id).toBe(false)
    }
    useUIStore.getState().setRange({ kind: 'glyphs' })
    expect(isEnabled('glyph.create')).toBe(true)
  })

  it('kern the two selected glyphs from a glyph view', () => {
    useUIStore.getState().setRange({ kind: 'glyphs' })
    useSelectionStore.getState().setSelection([T, A])
    runCommand('glyph.kern')
    expect(kerning().get(TA)).toBe(0)
    expect(useUIStore.getState().range).toEqual({ kind: 'kerning' })
  })
})

describe('common pairs and inheritance', () => {
  const A_ACUTE = '00c1'
  const TA_ACUTE = pairKey(T, A_ACUTE)

  beforeEach(() => {
    const family = createFamily()
    const glyphs = new Map<string, Glyph>([T, A, V, A_ACUTE].map((k) => [k, createGlyph(k, family.transforms as never)]))
    doc().load({ family, glyphs, kerning: new Map([[TA, -110]]) }, { fileName: 'c.mkfont' })
  })

  it('a common list is a pair view: Delete leaves a pair the font does not kern alone', () => {
    useUIStore.getState().setRange({ kind: 'common', group: 'upper' })
    usePairSelectionStore.getState().setSelection([TA_ACUTE])
    expect(isEnabled('edit.delete')).toBe(false)
    usePairSelectionStore.getState().setSelection([TA, TA_ACUTE])
    runCommand('edit.delete')
    expect(kerning().size).toBe(0)
  })

  it('nudges an inherited pair from the value it inherits', () => {
    nudgePairs([TA_ACUTE], -10)
    expect(kerning().get(TA_ACUTE)).toBe(-120)
  })

  it('follows the base letters’ pair again once its own value goes', () => {
    setPairValues([TA_ACUTE], -70)
    followBase([TA_ACUTE])
    expect(kerning().has(TA_ACUTE)).toBe(false)
    expect(doc().history.at(-1)?.label).toBe('Inherit kerning for TÁ')
  })

  it('is a font setting, undoable', () => {
    expect(doc().data!.inheritKerning).toBe(true)
    setInheritance(false)
    expect(doc().data!.inheritKerning).toBe(false)
    doc().undo()
    expect(doc().data!.inheritKerning).toBe(true)
  })
})

describe('suggested kerning', () => {
  const VA = pairKey(V, A)
  const suggest = (entries: [string, number][], docId = doc().docId): void =>
    useKernSuggestions.setState({ docId, ready: true, map: new Map(entries) })
  const labels = (items: MenuItem[]): string[] => items.flatMap((i) => (typeof i === 'object' && 'label' in i ? [i.label] : []))

  it('fills in pairs not kerned yet, never a value set by hand', () => {
    suggest([[TA, -80], [AV, -30]])
    expect(applySuggestions([TA, AV])).toBe(1)
    expect(kerning().get(TA)).toBe(-80)
    expect(kerning().get(AV)).toBe(-55)
    expect(doc().history.at(-1)?.label).toBe('Apply suggested kerning to TA')
  })

  it('applies many in one undo step, with an Undo in the notice', () => {
    suggest([[TA, -80], [VA, -60]])
    expect(applySuggestions([TA, VA, AV])).toBe(2)
    expect(doc().history.map((h) => h.label)).toEqual(['Apply 2 suggested kerning values'])
    const notice = useToasts.getState().toasts.at(-1)!
    expect(notice.message).toBe('Applied 2 suggested kerning values')
    notice.action!.run()
    expect(kerning().has(TA)).toBe(false)
    expect(kerning().has(VA)).toBe(false)
  })

  it('never uses the suggestions of another font', () => {
    suggest([[TA, -80]], doc().docId + 1)
    expect(applySuggestions([TA])).toBe(0)
    expect(kerning().has(TA)).toBe(false)
  })

  it('is offered in the pair menu, where a pair not kerned yet can also be set to no kerning', () => {
    suggest([[TA, -80]])
    const items = pairMenu([TA], TA)
    expect(labels(items)).toContain('Apply suggested value (-80)')
    const none = items.find((i): i is Extract<MenuItem, { label: string }> => typeof i === 'object' && 'label' in i && i.label === 'No kerning (keep at 0)')!
    expect(none.disabled).toBe(false)
    none.onSelect!()
    expect(kerning().get(TA)).toBe(0)
    // Checked now: nothing more to apply.
    expect(labels(pairMenu([TA], TA))).not.toContain('Apply suggested value (-80)')
  })
})

describe('navigation and tabs keep the pair selection', () => {
  it('Back returns to the Kerning view with its pairs selected', () => {
    useUIStore.getState().setRange({ kind: 'kerning' })
    usePairSelectionStore.getState().setSelection([AV], AV)
    vi.advanceTimersByTime(300)
    useUIStore.getState().setRange({ kind: 'glyphs' })
    useSelectionStore.getState().setSelection([T], T)
    vi.advanceTimersByTime(300)
    usePairSelectionStore.getState().clear()
    runCommand('view.back')
    expect(useUIStore.getState().range).toEqual({ kind: 'glyphs' })
    runCommand('view.back')
    expect(useUIStore.getState().range).toEqual({ kind: 'kerning' })
    expect(pairs()).toEqual([AV])
  })

  it('each font tab keeps its own pairs selected', () => {
    const family = createFamily()
    const first = openSession((s) => s.getState().load({ family, glyphs: new Map(), kerning: new Map([[AV, -55]]) }, { fileName: 'a.mkfont' }))
    usePairSelectionStore.getState().setSelection([AV])
    openSession((s) => s.getState().load({ family, glyphs: new Map() }, { fileName: 'b.mkfont' }))
    expect(pairs()).toEqual([])
    activateSession(first.id)
    expect(pairs()).toEqual([AV])
    useWorkspace.setState({ sessions: [], activeId: null })
  })
})
