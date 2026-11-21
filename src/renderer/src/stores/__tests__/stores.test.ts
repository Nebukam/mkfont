import { readFileSync } from 'fs'
import { resolve } from 'path'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDocStore, selectDirty } from '../doc-store'
import { useSelectionStore } from '../selection-store'
import { deserializeMkFont } from '../../core/deserialize'
import { createFamily, createGlyph } from '../../core/model'
import {
  addLayer,
  applySvgImport,
  createEmptyGlyphs,
  createLigatureFromKeys,
  deleteGlyphs,
  resetGlyphs,
  setFamilyValues,
  setLayerValues,
  setTransforms
} from '../../core/ops'
import { findLigatures } from '../../components/dialogs/LigatureFinderDialog'

const SAMPLE = resolve(__dirname, '../../../public/MkFontExample.mkfont')

function loadSample(): void {
  const { family, glyphs } = deserializeMkFont(readFileSync(SAMPLE, 'utf-8'))
  useDocStore.getState().load({ family, glyphs }, { fileName: 'sample.mkfont' })
}

const doc = () => useDocStore.getState()
const xshift = (key: string) => doc().data!.glyphs.get(key)!.variants[0].transforms.xshift as number

// "À" is made of two components in the example font: "A" (its control) and the grave accent.
const COMPOSED = '00c0'

describe('document history', () => {
  beforeEach(loadSample)

  it('records labeled entries and undoes / redoes them', () => {
    const [a, b] = [xshift('0041'), xshift('0042')]
    doc().transact('Shift A', (d) => setTransforms(d, ['0041'], { xshift: a + 50 }))
    doc().transact('Shift B', (d) => setTransforms(d, ['0042'], { xshift: b + 60 }))
    expect(doc().history.map((h) => h.label)).toEqual(['Shift A', 'Shift B'])
    doc().undo()
    expect(xshift('0042')).toBe(b)
    expect(xshift('0041')).toBe(a + 50)
    doc().redo()
    expect(xshift('0042')).toBe(b + 60)
    doc().jumpTo(0)
    expect(xshift('0041')).toBe(a)
  })

  it('merges interactive edits that share a merge key', () => {
    const a = xshift('0041')
    for (let i = 1; i <= 5; i++) doc().transact('Scrub', (d) => setTransforms(d, ['0041'], { xshift: a + i }), { mergeKey: 'k' })
    expect(doc().history.length).toBe(1)
    doc().undo()
    expect(xshift('0041')).toBe(a)
  })

  it('drops the redo branch on a new edit', () => {
    doc().transact('a', (d) => setTransforms(d, ['0041'], { xshift: 1 }))
    doc().transact('b', (d) => setTransforms(d, ['0041'], { xshift: 2 }))
    doc().undo()
    doc().transact('c', (d) => setTransforms(d, ['0041'], { xshift: 3 }))
    expect(doc().history.map((h) => h.label)).toEqual(['a', 'c'])
  })

  it('tracks dirty state by snapshot, including undo back to saved', () => {
    expect(selectDirty(doc())).toBe(false)
    doc().transact('edit', (d) => setTransforms(d, ['0041'], { xshift: 9 }))
    expect(selectDirty(doc())).toBe(true)
    doc().undo()
    expect(selectDirty(doc())).toBe(false)
    doc().setPreset(1, ['0041'])
    expect(selectDirty(doc())).toBe(true)
    doc().markSaved(null)
    expect(selectDirty(doc())).toBe(false)
  })

  it('marks only the written snapshot as saved when edits continue during a save', () => {
    doc().transact('a', (d) => setTransforms(d, ['0041'], { xshift: 1 }))
    const s = doc()
    const snapshot = { data: s.data!, presets: s.presets, docId: s.docId }
    // An edit lands while the write is still in flight...
    doc().transact('b', (d) => setTransforms(d, ['0041'], { xshift: 2 }))
    doc().markSaved('/fonts/a.mkfont', 'a.mkfont', snapshot)
    // ...so the document stays dirty, and undoing back to the written state is clean.
    expect(selectDirty(doc())).toBe(true)
    doc().undo()
    expect(selectDirty(doc())).toBe(false)
    expect(doc().filePath).toBe('/fonts/a.mkfont')
  })

  it('ignores a save that completes after another document was loaded', () => {
    doc().transact('a', (d) => setTransforms(d, ['0041'], { xshift: 1 }))
    const s = doc()
    const snapshot = { data: s.data!, presets: s.presets, docId: s.docId }
    loadSample()
    doc().markSaved('/fonts/old.mkfont', 'old.mkfont', snapshot)
    expect(doc().filePath).toBe(null)
    expect(doc().fileName).toBe('sample.mkfont')
  })

  it('keeps a clean document clean when only component folding changes', () => {
    const fold = (): void => {
      doc().transact('Toggle component', (d) => {
        const l = d.glyphs.get(COMPOSED)!.variants[0].layers[0]
        l.expanded = !l.expanded
      }, { history: false })
    }
    fold()
    expect(selectDirty(doc())).toBe(false)
    expect(doc().history.length).toBe(0)
    doc().transact('Shift A', (d) => setTransforms(d, ['0041'], { xshift: 5 }))
    fold()
    expect(selectDirty(doc())).toBe(true)
    doc().undo()
    expect(selectDirty(doc())).toBe(false)
  })

  it('treats folding during an in-flight save as saved', () => {
    doc().transact('Shift A', (d) => setTransforms(d, ['0041'], { xshift: 5 }))
    const s = doc()
    const snapshot = { data: s.data!, presets: s.presets, docId: s.docId }
    useDocStore.getState().trackSave(snapshot)
    // The write is still running when a component is folded.
    doc().transact('Toggle component', (d) => {
      const l = d.glyphs.get(COMPOSED)!.variants[0].layers[0]
      l.expanded = !l.expanded
    }, { history: false })
    doc().markSaved('/fonts/a.mkfont', 'a.mkfont', snapshot)
    expect(selectDirty(doc())).toBe(false)
  })

  it('ignores no-op transactions', () => {
    expect(doc().transact('nothing', () => {})).toBe(false)
    expect(doc().history.length).toBe(0)
  })

  it('recomputes dependents when a component changes', () => {
    // "À" uses "A" as a component in the example font (with glyph bounds, so size matters, not position)
    const before = doc().computed.get(COMPOSED)![0].layers[0].fit!.bbox.width
    doc().transact('shrink A', (d) => setTransforms(d, ['0041'], { scale: 7, 'scale-factor': 0.25 }))
    const after = doc().computed.get(COMPOSED)![0].layers[0].fit!.bbox.width
    expect(after).toBeLessThan(before * 0.9)
  })

  it('reuses dependency info for transform edits and refreshes it when components change', () => {
    const dep0 = doc().dep
    doc().transact('shift dot', (d) => setTransforms(d, ['002e'], { xshift: 40 }))
    expect(doc().dep).toBe(dep0)

    // A new component reference: "A" now uses "o".
    doc().transact('add o to A', (d) => {
      addLayer(d, '0041', { characterRef: 'o' })
    })
    expect(doc().dep).not.toBe(dep0)
    expect(doc().dep.users.get('006f')?.has('0041')).toBe(true)
    expect(doc().computed.get('0041')![0].layers.at(-1)!.fit).not.toBeNull()

    // Retargeting it updates the graph: "A" uses "x" instead, and editing "o" no longer touches "A".
    const last = doc().data!.glyphs.get('0041')!.variants[0].layers.length - 1
    doc().transact('o → x', (d) => setLayerValues(d, '0041', last, { characterRef: 'x' }))
    expect(doc().dep.users.get('0078')?.has('0041')).toBe(true)
    expect(doc().dep.users.get('006f')?.has('0041') ?? false).toBe(false)
    const a = doc().computed.get('0041')
    doc().transact('shift o', (d) => setTransforms(d, ['006f'], { xshift: 25 }))
    expect(doc().computed.get('0041')).toBe(a)

    // Undo back to the start restores the original graph.
    doc().jumpTo(0)
    expect(doc().dep.users.get('006f')?.has('0041') ?? false).toBe(false)
    expect(doc().data!.glyphs.get('0041')!.variants[0].layers.length).toBe(last)
  })

  it('removes computed data of deleted glyphs and restores it on undo', () => {
    doc().transact('del', (d) => {
      deleteGlyphs(d, ['0041'])
    })
    expect(doc().computed.has('0041')).toBe(false)
    doc().undo()
    expect(doc().computed.has('0041')).toBe(true)
  })
})

describe('editing operations', () => {
  beforeEach(loadSample)

  it('creates empty glyphs with the font width and no auto width (v1)', () => {
    doc().transact('create', (d) => {
      createEmptyGlyphs(d, ['4e00'])
    })
    const v = doc().data!.glyphs.get('4e00')!.variants[0]
    expect(v.width).toBe(doc().data!.family.values.width)
    expect(v.transforms['auto-w']).toBe(false)
    expect(doc().computed.get('4e00')![0].empty).toBe(true)
  })

  it('builds chained ligatures from keys', () => {
    let key: string | null = null
    doc().transact('lig', (d) => {
      key = createLigatureFromKeys(d, ['0066', '0069'], true)
    })
    expect(key).toBe('0066+0069')
    const v = doc().data!.glyphs.get('0066+0069')!.variants[0]
    expect(v.layers.map((l) => l.characterRef)).toEqual(['f', 'i'])
    expect(v.layers[1].inheritPreviousBounds).toBe(true)
    expect(doc().computed.get('0066+0069')![0].empty).toBe(false)
  })

  it('resets glyphs, optionally keeping components', () => {
    // An outline with a component: "i" using ".".
    const variant = () => doc().data!.glyphs.get('0069')!.variants[0]
    doc().transact('component', (d) => {
      addLayer(d, '0069', { characterRef: '.' })
    })
    expect(variant().pathData.emptyPath).toBeFalsy()
    doc().transact('reset', (d) => resetGlyphs(d, ['0069'], doc().computed, { keepLayers: true }))
    expect(variant().layers.length).toBe(1)
    expect(variant().pathData.emptyPath).toBe(true)
    doc().transact('reset all', (d) => resetGlyphs(d, ['0069'], doc().computed))
    expect(variant().layers.length).toBe(0)
  })

  it('rescales everything when EM changes with resampling on', () => {
    const w = doc().computed.get('0041')![0].exportedWidth
    doc().transact('em', (d) => setFamilyValues(d, { em: 2000 }))
    expect(doc().data!.family.values.ascent).toBe(1600)
    expect(doc().computed.get('0041')![0].exportedWidth).toBeCloseTo(w * 2, 3)
  })

  it('applies an imported SVG with its label components, once each', () => {
    const svg = {
      exists: true,
      path: 'M0 0H100V100H0Z',
      width: 100,
      height: 100,
      bbox: { x: 0, y: 0, width: 100, height: 100, top: 0, bottom: 100, left: 0, right: 100 },
      markedBBox: false,
      layers: ['e', 'U+0301', 'e']
    }
    doc().transact('import', (d) => {
      applySvgImport(d, 'e000', svg)
      applySvgImport(d, 'e000', svg)
    })
    const g = doc().data!.glyphs.get('e000')!
    expect(g.variants[0].pathData.path).toBe('M0 0H100V100H0Z')
    expect(g.variants[0].layers.map((l) => l.characterRef)).toEqual(['e', 'U+0301'])
    // Live reload never creates glyphs.
    let created = true
    doc().transact('reload', (d) => {
      created = applySvgImport(d, 'e001', svg, { create: false })
    })
    expect(created).toBe(false)
    expect(doc().data!.glyphs.has('e001')).toBe(false)
  })

  it('keeps a single control component per glyph', () => {
    doc().transact('ctl', (d) => {
      const g = createGlyph('4e01', d.family.transforms)
      d.glyphs.set('4e01', g)
      const v = d.glyphs.get('4e01')!.variants[0]
      v.layers.push({ ...v.layers[0] } as never)
    })
    // two layers via the public helper
    doc().transact('layers', (d) => {
      const v = d.glyphs.get(COMPOSED)!.variants[0]
      v.layers.push({ ...v.layers[0], characterRef: 'l' })
      setLayerValues(d, COMPOSED, 0, { isControlLayer: true })
      setLayerValues(d, COMPOSED, 1, { isControlLayer: true })
    })
    const flags = doc().data!.glyphs.get(COMPOSED)!.variants[0].layers.map((l) => l.isControlLayer)
    expect(flags).toEqual([false, true, false])
  })
})

describe('selection', () => {
  const ordered = ['a', 'b', 'c', 'd', 'e']
  beforeEach(() => useSelectionStore.getState().clear())

  it('supports click, ctrl-toggle and shift-range in click order', () => {
    const s = () => useSelectionStore.getState()
    s().click('b', {}, ordered)
    s().click('d', { shift: true }, ordered)
    expect(s().keys).toEqual(['b', 'c', 'd'])
    s().click('a', { ctrl: true }, ordered)
    expect(s().keys).toEqual(['b', 'c', 'd', 'a'])
    s().click('c', { ctrl: true }, ordered)
    expect(s().keys).toEqual(['b', 'd', 'a'])
    expect(s().active).toBe('a')
  })
})

describe('ligature finder (v1 algorithm)', () => {
  it('counts frequent sequences', () => {
    const r = findLigatures('the theory of the thing', 2, 3, 2)
    expect(r[0]).toEqual({ ligature: 'th', count: 4 })
    expect(r.find((x) => x.ligature === 'the')?.count).toBe(3)
  })

  it('creates nothing for an empty family', () => {
    useDocStore.getState().load({ family: createFamily(), glyphs: new Map() })
    expect(doc().data!.glyphs.size).toBe(0)
  })
})
