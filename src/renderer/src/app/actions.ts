// ============================================================
// Glyph-level actions (v1 commands) used by menus, inspector and shortcuts.
// ============================================================

import { create } from 'zustand'
import { activeDocStore, useDocStore, transact } from '../stores/doc-store'
import { useSelectionStore, selectedKeys } from '../stores/selection-store'
import { isPairRange, useUIStore } from '../stores/ui-store'
import {
  addLayersForChars,
  bootstrapComposition,
  createEmptyGlyphs,
  createLigatureFromKeys,
  deleteGlyphs,
  resetGlyphs,
  setAllLayers
} from '../core/ops'
import { getComposition } from '../core/unicode'
import { advanceWidth } from '../core/compute'
import { outlineToSvg } from '../core/import-svg'
import { pathBBox } from '../core/geometry'
import { charsToKey, glyphLabel, glyphsValues, keyToChars, keyToDisplayChars, keyToUUni, isLigatureKey } from '../core/unicode-keys'
import { FILTERS, saveFile, writeClipboardText } from '../platform'
import { confirmDialog, pickGlyphs } from './dialogs'
import { unbindMany } from './bindings'
import { storeForDoc } from '../stores/workspace'
import { projectDir } from './document'
import { toast } from '../components/ui/Overlays'
import { t } from '../i18n'

// ---- View content (keys currently listed in the grid) ----

export const useViewStore = create<{ keys: string[] }>()(() => ({ keys: [] }))

export function viewKeys(): string[] {
  return useViewStore.getState().keys
}

const selection = selectedKeys

function existing(keys: string[]): string[] {
  const g = useDocStore.getState().data?.glyphs
  return g ? keys.filter((k) => g.has(k)) : []
}

// ---- Create / delete ----

/** v1 CmdImportListMissingGlyphs: create empty glyphs where none exist. */
export async function createMissing(keys: string[] = selection()): Promise<void> {
  const g = useDocStore.getState().data?.glyphs
  if (!g) return
  const missing = keys.filter((k) => !g.has(k))
  if (!missing.length) {
    toast.info(t('edit.allSlotsHaveGlyphs'))
    return
  }
  if (missing.length > 300) {
    const ok = await confirmDialog({
      title: t('edit.createMany.title', { count: missing.length }),
      message: t('edit.createMany.message'),
      confirmLabel: t('edit.createMany.confirm')
    })
    if (ok !== 'confirm') return
  }
  transact(t(missing.length === 1 ? 'edit.history.createGlyph' : 'edit.history.createGlyphs', glyphsValues(missing)), (d) => {
    createEmptyGlyphs(d, missing)
  }, { icon: 'create' })
}

export function deleteKeys(keys: string[] = selection()): void {
  const ex = existing(keys)
  if (!ex.length) return
  const done = transact(t(ex.length === 1 ? 'edit.history.deleteGlyph' : 'edit.history.deleteGlyphs', glyphsValues(ex)), (d) => {
    deleteGlyphs(d, ex)
  }, { icon: 'delete' })
  if (!done) return
  unbindMany(ex)
  offerUndo(t(ex.length === 1 ? 'edit.deletedGlyph' : 'edit.deletedGlyphs', glyphsValues(ex)), 'delete')
}

/**
 * A notice with an Undo button for the edit just made. Undo only takes back that edit,
 * in the font it was made in, also when another tab is shown by the time it is clicked.
 */
export type UndoableEdit = 'delete' | 'change' | 'removal'

export function offerUndo(message: string, edit: UndoableEdit): void {
  const store = activeDocStore()
  const entryId = store.getState().history.at(-1)?.id
  toast.action(message, {
    label: t('edit.undo.action'),
    run: () => {
      // Never a change made after it.
      if (!storeForDoc(store.getState().docId)) return void toast.info(t('edit.undo.fontClosed'))
      const s = store.getState()
      const index = s.history.findIndex((h) => h.id === entryId)
      if (index !== -1 && index === s.cursor - 1) s.undo()
      else if (index !== -1 && index >= s.cursor) toast.info(t(`edit.undo.alreadyUndone.${edit}`))
      else toast.info(t(`edit.undo.notUndone.${edit}`), t('edit.undo.notUndoneDetail'))
    }
  })
}

// ---- Reset (v1 CmdGlyphClear) ----

export interface ResetOptions {
  keepLayers?: boolean
  bootstrap?: boolean
}

export function resetKeys(keys: string[] = selection(), opts: ResetOptions = {}): void {
  if (!keys.length) return
  const one = keys.length === 1
  const name = opts.bootstrap
    ? t(one ? 'edit.history.rebuildGlyph' : 'edit.history.rebuildGlyphs', glyphsValues(keys))
    : t(one ? 'edit.history.resetGlyph' : 'edit.history.resetGlyphs', glyphsValues(keys))
  transact(name, (d) => {
    resetGlyphs(d, keys, useDocStore.getState().computed, opts)
  }, { icon: 'reset' })
  unbindMany(keys)
}

// ---- Components ----

/** v1 CmdLayerAddComp: components from the Unicode decomposition. */
export function bootstrapKeys(keys: string[] = selection(), createMissingGlyphs = true): void {
  const candidates = keys.filter((k) => getComposition(k))
  if (!candidates.length) {
    toast.info(t('edit.noDecomposition'), t('edit.noDecompositionDetail'))
    return
  }
  let created = 0
  transact(t(candidates.length === 1 ? 'edit.history.composeGlyph' : 'edit.history.composeGlyphs', glyphsValues(candidates)), (d) => {
    for (const k of candidates) {
      if (!d.glyphs.has(k)) createEmptyGlyphs(d, [k])
      created += bootstrapComposition(d, k, useDocStore.getState().computed, createMissingGlyphs)
    }
  }, { icon: 'component' })
  if (created) toast.info(t('edit.alsoCreatedComponents', { count: created }), t('edit.alsoCreatedComponentsDetail'))
}

export async function addComponentsFromPicker(keys: string[] = selection()): Promise<void> {
  const ex = existing(keys)
  if (!ex.length) return
  const picked = await pickGlyphs({ title: t('edit.addComponents'), multi: true, exclude: ex.length === 1 ? ex : [], confirmLabel: t('edit.addComponents') })
  if (!picked?.length) return
  transact(picked.length === 1 ? t('edit.history.addComponent', { glyph: keyToDisplayChars(picked[0]) }) : t('edit.history.addComponents', { count: picked.length }), (d) => {
    addLayersForChars(d, ex, picked.map(keyToChars))
  }, { icon: 'component' })
}

export function setComponentsVisible(keys: string[], visible: boolean): void {
  const ex = existing(keys)
  if (!ex.length) return
  transact(visible ? t('edit.history.showAllComponents') : t('edit.history.hideAllComponents'), (d) => {
    setAllLayers(d, ex, { doExport: visible })
  }, { icon: 'component' })
}

// ---- Ligatures ----

/** v1 CmdLigatureFromSelection (keys in selection order, or a text string). */
export function createLigature(source: string[] | string = selection(), withComponents = false): void {
  const keys = typeof source === 'string' ? charsToKey(source).split('+') : source
  const parts = keys.flatMap((k) => k.split('+'))
  if (parts.length < 2) {
    toast.info(t('edit.ligatureNeedsTwo'))
    return
  }
  let result: string | null = null
  const exists = useDocStore.getState().data?.glyphs.has(parts.join('+'))
  transact(t('edit.history.createLigature', { chars: keyToChars(parts.join('+')) }), (d) => {
    result = createLigatureFromKeys(d, keys, withComponents)
  }, { icon: 'ligature' })
  if (result) {
    // The pair views do not list glyphs (the text preview's button works from any view).
    if (isPairRange(useUIStore.getState().range)) useUIStore.getState().setRange({ kind: 'ligatures' })
    useSelectionStore.getState().setSelection([result])
    useUIStore.getState().reveal(result)
    if (exists) toast.info(t('edit.ligatureExists'))
  }
}

// ---- Lists to clipboard (v1 cmdListExportUni / UniHex) ----

export async function copyCharacters(keys: string[]): Promise<void> {
  if (!keys.length) return
  await writeClipboardText(keys.map(keyToChars).join('\n'))
  toast.info(t('edit.copiedCharacters', { count: keys.length }))
}

export async function copyHex(keys: string[]): Promise<void> {
  if (!keys.length) return
  await writeClipboardText(keys.map(keyToUUni).join('\n'))
  toast.info(t('edit.copiedUnicodeValues', { count: keys.length }))
}

/** Final (composited) outline as a standalone SVG, for other tools. */
export async function copyOutlineSvg(key: string): Promise<void> {
  const s = useDocStore.getState()
  const c = s.computed.get(key)?.[0]
  if (!s.data || !c) return
  const f = s.data.family.values
  const bb = pathBBox(c.path)
  // Frame the font's vertical metrics, extended to whatever the outline covers (accents above the EM…).
  const top = Math.min(0, f.baseline - f.ascent, c.empty ? 0 : bb.top)
  const bottom = Math.max(f.em, f.baseline - f.descent, c.empty ? 0 : bb.bottom)
  await writeClipboardText(outlineToSvg(c.path, advanceWidth(c, s.data.family), top, bottom))
  toast.info(t('edit.copiedOutline', { glyph: glyphLabel(key) }))
}

// ---- Selection presets (v1: 0-9, Ctrl+N store, Shift+N append) ----

export function storePreset(i: number): void {
  const keys = selection()
  useDocStore.getState().setPreset(i, keys)
  toast.info(
    keys.length ? t('edit.presets.stored', { slot: i }) : t('edit.presets.cleared', { slot: i }),
    keys.length ? t('edit.presets.glyphs', { count: keys.length }) : undefined
  )
}

export function restorePreset(i: number, append: boolean): void {
  const preset = useDocStore.getState().presets[i]
  if (!preset?.length) {
    toast.info(t('edit.presets.empty', { slot: i }), t('edit.presets.emptyDetail', { slot: i }))
    return
  }
  const sel = useSelectionStore.getState()
  if (append) sel.add(preset)
  else sel.setSelection(preset)
  useUIStore.getState().reveal(preset[preset.length - 1])
}

// ---- Illustrator artboard template (v1 cmdListExportArtboardTemplate) ----

/** Illustrator's limit. */
const MAX_ARTBOARDS = 1000

export async function exportArtboardTemplate(keys: string[]): Promise<void> {
  const s = useDocStore.getState()
  if (!s.data || !keys.length) return
  let list = keys
  if (list.length > MAX_ARTBOARDS) {
    toast.warning(t('edit.artboards.tooMany', { max: MAX_ARTBOARDS }), t('edit.artboards.tooManyDetail', { max: MAX_ARTBOARDS, count: list.length }))
    list = list.slice(0, MAX_ARTBOARDS)
  }
  const f = s.data.family.values
  const names = list.map((k) => `char_${keyToUUni(k)}`)
  const widths = list.map((k) => {
    const c = s.computed.get(k)?.[0]
    return Math.round(c && !isLigatureKey(k) ? Math.max(c.exportedWidth, 1) : f.width)
  })
  const script = artboardScript(names, widths, f.em, f.baseline, f.ascent, f.descent, f['x-height'], f['cap-height'])
  const target = await saveFile({
    data: script,
    suggestedName: `${f['font-family'] || 'mkfont'}-artboards.jsx`,
    filters: FILTERS.jsx,
    mime: 'text/javascript',
    title: t('edit.artboards.saveTitle'),
    defaultDir: projectDir()
  })
  if (target) toast.success(t('edit.artboards.saved'), t('edit.artboards.savedDetail'))
}

function artboardScript(names: string[], widths: number[], em: number, bsl: number, asc: number, desc: number, xh: number, ch: number): string {
  return `// MkFont artboard template — run in Adobe Illustrator (File > Scripts > Other Script...)
// One artboard per glyph, named for MkFont's batch SVG import (prefix "char", separator "_").
#target illustrator
(function () {
  var names = ${JSON.stringify(names)};
  var widths = ${JSON.stringify(widths)};
  var em = ${em}, baseline = ${bsl}, ascent = ${asc}, descent = ${desc}, xHeight = ${xh}, capHeight = ${ch};
  var gap = Math.round(em * 0.25);
  var cols = Math.max(1, Math.ceil(Math.sqrt(names.length)));
  var maxW = 0;
  for (var i = 0; i < widths.length; i++) { if (widths[i] > maxW) { maxW = widths[i]; } }
  var doc = app.documents.add(DocumentColorSpace.RGB, widths[0], em);
  var guides = doc.layers[0];
  guides.name = "MkFont guides";
  var art = doc.layers.add();
  art.name = "Glyphs";
  function line(y, x0, x1, color) {
    var p = guides.pathItems.add();
    p.setEntirePath([[x0, y], [x1, y]]);
    p.filled = false; p.stroked = true; p.strokeWidth = 0.5;
    p.strokeColor = color;
  }
  function rgb(r, g, b) { var c = new RGBColor(); c.red = r; c.green = g; c.blue = b; return c; }
  for (var n = 0; n < names.length; n++) {
    var col = n % cols, row = Math.floor(n / cols);
    var x = col * (maxW + gap), top = -row * (em + gap);
    var rect = [x, top, x + widths[n], top - em];
    var ab = n === 0 ? doc.artboards[0] : doc.artboards.add(rect);
    ab.artboardRect = rect;
    ab.name = names[n];
    line(top - baseline, x, x + widths[n], rgb(56, 189, 108));
    line(top - (baseline - ascent), x, x + widths[n], rgb(150, 150, 150));
    line(top - (baseline - descent), x, x + widths[n], rgb(150, 150, 150));
    line(top - (baseline - xHeight), x, x + widths[n], rgb(210, 210, 210));
    line(top - (baseline - capHeight), x, x + widths[n], rgb(210, 210, 210));
  }
  guides.locked = true;
  doc.activeLayer = art;
})();
`
}
