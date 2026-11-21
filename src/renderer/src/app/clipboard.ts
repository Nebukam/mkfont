// ============================================================
// Copy / paste (v1 SHARED_OPS clipboard + paste commands).
//
// Copy keeps deep clones of the selected glyphs (so they survive
// switching documents) and puts the first glyph's SVG — with mkf-*
// attributes — on the system clipboard for external editors.
// ============================================================

import type { Glyph, Layer, Variant } from '../types/font'
import { useDocStore, transact } from '../stores/doc-store'
import { useSelectionStore } from '../stores/selection-store'
import { usePrefsStore } from '../stores/prefs-store'
import { cloneGlyph, cloneVariant, createGlyph, createLayer, LAYER_LIMIT, resampleLayerInPlace, resampleVariantInPlace } from '../core/model'
import { parseSvg, readMkfValues, variantToSvg } from '../core/import-svg'
import { applySvgImport, type DocDraft } from '../core/ops'
import { refToKey, glyphLabel, glyphsValues } from '../core/unicode-keys'
import { readClipboardText, writeClipboardText } from '../platform'
import { toast } from '../components/ui/Overlays'
import { t, tm } from '../i18n'

interface ClipBuffer {
  docId: number
  sourceEm: number
  items: Glyph[]
  /** Component glyphs referenced by the copied glyphs (for paste in place). */
  deps: Glyph[]
  svg: string
}

let buffer: ClipBuffer | null = null

export function hasClipboardGlyphs(): boolean {
  return !!buffer && buffer.items.length > 0
}

function collectDeps(glyphs: Map<string, Glyph>, roots: Glyph[]): Glyph[] {
  const seen = new Set(roots.map((g) => g.unicode))
  const out: Glyph[] = []
  const stack = [...roots]
  while (stack.length) {
    const g = stack.pop()!
    for (const l of g.variants[0]?.layers ?? []) {
      const k = refToKey(l.characterRef)
      if (!k || seen.has(k)) continue
      seen.add(k)
      const dep = glyphs.get(k)
      if (dep) {
        out.push(cloneGlyph(dep))
        stack.push(dep)
      }
    }
  }
  return out
}

export async function copySelection(): Promise<void> {
  const s = useDocStore.getState()
  if (!s.data) return
  const keys = useSelectionStore.getState().keys
  const items = keys.map((k) => s.data!.glyphs.get(k)).filter((g): g is Glyph => !!g)
  if (!items.length) {
    toast.info(t('edit.clipboard.nothingToCopy'), t('edit.clipboard.nothingToCopyDetail'))
    return
  }
  const svg = variantToSvg(items[0].variants[0], s.data.family.values.em, true, usePrefsStore.getState().markColor)
  buffer = {
    docId: s.docId,
    sourceEm: s.data.family.values.em,
    items: items.map(cloneGlyph),
    deps: collectDeps(s.data.glyphs, items),
    svg
  }
  await writeClipboardText(svg)
  const copied = items.map((g) => g.unicode)
  toast.info(t(copied.length === 1 ? 'edit.clipboard.copiedGlyph' : 'edit.clipboard.copiedGlyphs', glyphsValues(copied)))
}

// ---- Resampling between fonts with different EMs (v1 GLYPH/TR/LYR_RESAMPLE_IDS) ----

function resampleVariant(v: Variant, f: number): Variant {
  const out = cloneVariant(v)
  resampleVariantInPlace(out, f)
  return out
}

function resampleLayer(l: Layer, f: number): Layer {
  const out = { ...l }
  resampleLayerInPlace(out, f)
  return out
}

function scaleFactor(): number {
  const em = useDocStore.getState().data?.family.values.em ?? 1000
  return buffer ? em / buffer.sourceEm : 1
}

/** v1 SHARED_OPS._Paste */
function pasteGlyph(d: DocDraft, source: Glyph, targetKey: string, f: number): void {
  const src = resampleVariant(source.variants[0], f)
  const target = d.glyphs.get(targetKey)
  if (!target) {
    const g = createGlyph(targetKey, d.family.transforms)
    g.variants[0] = { ...src, layers: src.layers.map((l) => ({ ...l })), transforms: { ...src.transforms } }
    g.name = targetKey === source.unicode ? source.name : ''
    d.glyphs.set(targetKey, g)
    return
  }
  const v = target.variants[0]
  v.pathData = src.pathData
  Object.assign(v.transforms, src.transforms)
  v.width = src.width
  v.height = src.height
  v.doExport = src.doExport
  v.flattenLayers = src.flattenLayers
  v.flattenMode = src.flattenMode
  v.layers.splice(0, v.layers.length, ...src.layers.slice(0, LAYER_LIMIT).map((l) => ({ ...l })))
}

function cycleTargets(targets: string[], fn: (source: Glyph, target: string) => void): void {
  if (!buffer) return
  targets.forEach((target, i) => fn(buffer!.items[i % buffer!.items.length], target))
}

/** Ctrl+V — internal paste, or an SVG from another app into the active glyph. */
export async function paste(): Promise<void> {
  const s = useDocStore.getState()
  if (!s.data) return
  const text = await readClipboardText()
  const sel = useSelectionStore.getState()

  if (buffer && (text === buffer.svg || (!text && buffer.items.length))) {
    if (!sel.keys.length) {
      toast.info(t('edit.clipboard.selectWhere'), t('edit.clipboard.selectWhereDetail'))
      return
    }
    const f = scaleFactor()
    transact(t(sel.keys.length === 1 ? 'edit.history.pasteOntoGlyph' : 'edit.history.pasteOntoGlyphs', glyphsValues(sel.keys)), (d) => {
      cycleTargets(sel.keys, (src, target) => pasteGlyph(d, src, target, f))
    }, { icon: 'paste' })
    return
  }

  if (text && text.includes('<svg')) {
    const target = sel.active ?? sel.keys[sel.keys.length - 1]
    if (!target) {
      toast.info(t('edit.clipboard.selectSvgTarget'))
      return
    }
    pasteSvgInto(target, text)
    return
  }
  toast.info(t('edit.clipboard.nothingToPaste'), t('edit.clipboard.nothingToPasteDetail'))
}

/** Paste raw SVG markup into one glyph (creating it when needed). */
export function pasteSvgInto(key: string, svgText: string): boolean {
  const s = useDocStore.getState()
  if (!s.data) return false
  const parsed = parseSvg(svgText, usePrefsStore.getState().markColor)
  if (!parsed.exists) {
    toast.warning(t('edit.clipboard.couldNotPasteSvg'), parsed.error ? tm(parsed.error) : t('edit.clipboard.svgNoPaths'))
    return false
  }
  const mkf = readMkfValues(svgText, s.data.family.values.em)
  return transact(t('edit.history.pasteSvgInto', { glyph: glyphLabel(key) }), (d) => {
    applySvgImport(d, key, parsed)
    const v = d.glyphs.get(key)!.variants[0]
    if (mkf.hasTransforms) Object.assign(v.transforms, mkf.transforms)
    if (mkf.hasVariantValues) Object.assign(v, mkf.variant)
  }, { icon: 'paste' })
}

/** Ctrl+Shift+V — paste each copied glyph into its own slot (v1 MODE_MATCH_SLOT). */
export function pasteInPlace(): void {
  const s = useDocStore.getState()
  if (!s.data || !buffer) {
    toast.info(t('edit.clipboard.nothingToPaste'), t('edit.clipboard.nothingToPasteInPlaceDetail'))
    return
  }
  if (buffer.docId === s.docId) {
    toast.info(t('edit.clipboard.inPlaceSameFont'), t('edit.clipboard.inPlaceSameFontDetail'))
    return
  }
  const f = scaleFactor()
  const b = buffer
  transact(t('edit.history.pasteInPlace', { count: b.items.length }), (d) => {
    for (const dep of b.deps) if (!d.glyphs.has(dep.unicode)) pasteGlyph(d, dep, dep.unicode, f)
    for (const g of b.items) pasteGlyph(d, g, g.unicode, f)
  }, { icon: 'paste' })
  useSelectionStore.getState().setSelection(b.items.map((g) => g.unicode))
}

/** Ctrl+Alt+V — paste transforms & metrics onto existing selected glyphs (v1 MODE_TRANSFORMS_ONLY). */
export function pasteTransforms(): void {
  const s = useDocStore.getState()
  const keys = useSelectionStore.getState().keys.filter((k) => s.data?.glyphs.has(k))
  if (!buffer || !keys.length) {
    toast.info(buffer ? t('edit.clipboard.selectTransformsTarget') : t('edit.clipboard.copyGlyphFirst'))
    return
  }
  const f = scaleFactor()
  transact(t('edit.history.pasteTransforms', { count: keys.length }), (d) => {
    cycleTargets(keys, (src, target) => {
      const v = d.glyphs.get(target)?.variants[0]
      if (!v) return
      const sv = resampleVariant(src.variants[0], f)
      Object.assign(v.transforms, sv.transforms)
      v.width = sv.width
      v.height = sv.height
      v.flattenLayers = sv.flattenLayers
      v.flattenMode = sv.flattenMode
    })
  }, { icon: 'paste' })
}

export type ComponentPasteMode = 'replace' | 'add' | 'transforms'

/** v1 CmdLayersPaste: replace / add components, or copy component transforms by character. */
export function pasteComponents(mode: ComponentPasteMode): void {
  const s = useDocStore.getState()
  const keys = useSelectionStore.getState().keys.filter((k) => s.data?.glyphs.has(k))
  if (!buffer || !keys.length) {
    toast.info(buffer ? t('edit.clipboard.selectExisting') : t('edit.clipboard.copyComponentsFirst'))
    return
  }
  const f = scaleFactor()
  const label =
    mode === 'replace' ? t('edit.history.replaceComponents') : mode === 'add' ? t('edit.history.pasteComponents') : t('edit.history.pasteComponentTransforms')
  transact(label, (d) => {
    cycleTargets(keys, (src, target) => {
      const v = d.glyphs.get(target)?.variants[0]
      if (!v) return
      const layers = src.variants[0].layers.map((l) => resampleLayer(l, f))
      if (mode === 'transforms') {
        for (const sl of layers) {
          for (const tl of v.layers) {
            if (tl.characterRef !== sl.characterRef) continue
            const { characterRef: _c, expanded: _e, path: _p, ...values } = sl
            Object.assign(tl, values)
          }
        }
        return
      }
      if (mode === 'replace') v.layers.splice(0, v.layers.length)
      for (const l of layers) {
        if (v.layers.length >= LAYER_LIMIT) break
        v.layers.push(createLayer(l.characterRef, { ...l }))
      }
    })
  }, { icon: 'paste' })
}
