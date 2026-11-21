// ============================================================
// Context menu for glyph selections (grid, inspector).
// ============================================================

import {
  ArrowRight,
  CircleCheck,
  ClipboardPaste,
  Component,
  Copy,
  Download,
  ExternalLink,
  FoldHorizontal,
  Hash,
  Ligature,
  PenTool,
  Plus,
  RotateCcw,
  Trash2,
  Type,
  Unlink,
  Wand2
} from 'lucide-react'
import type { MenuItem } from '../components/ui/Menu'
import { useDocStore } from '../stores/doc-store'
import { getComposition } from '../core/unicode'
import { pairSides } from '../core/kerning'
import { glyphLabel } from '../core/unicode-keys'
import { isElectron } from '../platform'
import { goToGlyph } from '../components/inspector/DetailsSection'
import { addPair, applySuggestions, copyPairs, removePairs, setPairValues, suggestable } from './kerning'
import { activeSuggestions } from './kern-suggestions'
import { formatNumber } from '../components/ui/fields'
import { copySelection, hasClipboardGlyphs, paste, pasteComponents, pasteInPlace, pasteTransforms } from './clipboard'
import {
  addComponentsFromPicker,
  bootstrapKeys,
  copyCharacters,
  copyHex,
  copyOutlineSvg,
  createLigature,
  createMissing,
  deleteKeys,
  exportArtboardTemplate,
  resetKeys,
  setComponentsVisible,
  storePreset
} from './actions'
import { editInExternalEditor, unbindMany, useBindings } from './bindings'
import { pickSvgForGlyph } from './imports'
import { openOutlineEditor } from './outline'
import { commandLabel, shortcutLabel } from './commands'
import { t } from '../i18n'

export function glyphMenu(keys: string[], active: string | null): MenuItem[] {
  const glyphs = useDocStore.getState().data?.glyphs
  if (!glyphs || !keys.length) return []
  const existing = keys.filter((k) => glyphs.has(k))
  const missing = keys.filter((k) => !glyphs.has(k))
  const single = keys.length === 1 ? keys[0] : null
  const composable = keys.some((k) => getComposition(k))
  const bound = keys.filter((k) => useBindings.getState().byKey.has(k))
  const target = active ?? keys[keys.length - 1]

  const items: MenuItem[] = []
  if (missing.length) {
    items.push({
      label: t('menus.glyph.createEmpty', { count: missing.length }),
      icon: Plus,
      shortcut: shortcutLabel('glyph.create'),
      onSelect: () => void createMissing(missing)
    })
  }
  if (single) items.push({ label: t('menus.glyph.importSvg'), icon: Download, onSelect: () => void pickSvgForGlyph(single) })
  if (glyphs.has(target)) items.push({ label: commandLabel('glyph.editOutline'), icon: PenTool, shortcut: shortcutLabel('glyph.editOutline'), onSelect: () => openOutlineEditor(target) })
  if (isElectron && glyphs.has(target)) items.push({ label: commandLabel('glyph.editExternal'), icon: ExternalLink, shortcut: shortcutLabel('glyph.editExternal'), onSelect: () => void editInExternalEditor(target) })
  items.push('separator')
  items.push({ label: t('menus.glyph.copy'), icon: Copy, shortcut: shortcutLabel('edit.copy'), disabled: !existing.length, onSelect: () => void copySelection() })
  items.push({ label: commandLabel('edit.paste'), icon: ClipboardPaste, shortcut: shortcutLabel('edit.paste'), onSelect: () => void paste() })
  items.push({
    label: t('menus.glyph.pasteSpecial'),
    submenu: [
      { label: commandLabel('edit.pasteInPlace'), shortcut: shortcutLabel('edit.pasteInPlace'), disabled: !hasClipboardGlyphs(), onSelect: pasteInPlace },
      { label: t('menus.glyph.pasteTransformsOnly'), shortcut: shortcutLabel('edit.pasteTransforms'), disabled: !hasClipboardGlyphs() || !existing.length, onSelect: pasteTransforms },
      'separator',
      { label: t('menus.glyph.replaceComponents'), disabled: !hasClipboardGlyphs() || !existing.length, onSelect: () => pasteComponents('replace') },
      { label: t('menus.glyph.addComponents'), disabled: !hasClipboardGlyphs() || !existing.length, onSelect: () => pasteComponents('add') },
      { label: t('menus.glyph.copyComponentTransforms'), disabled: !hasClipboardGlyphs() || !existing.length, onSelect: () => pasteComponents('transforms') }
    ]
  })
  items.push({
    label: t('menus.copyText.title'),
    submenu: [
      { label: t('menus.copyText.characters'), icon: Type, onSelect: () => void copyCharacters(keys) },
      { label: t('menus.copyText.unicodeValues'), icon: Hash, onSelect: () => void copyHex(keys) },
      { label: t('menus.glyph.outlineSvg'), disabled: !glyphs.has(target), hint: t('menus.glyph.outlineSvgHint'), onSelect: () => void copyOutlineSvg(target) }
    ]
  })
  items.push('separator')
  items.push({
    label: t('menus.glyph.components'),
    icon: Component,
    submenu: [
      {
        label: t('menus.glyph.fromDecomposition'),
        shortcut: shortcutLabel('glyph.compose'),
        disabled: !composable,
        hint: composable ? t('menus.glyph.fromDecompositionHint') : t('menus.glyph.noDecomposition'),
        onSelect: () => bootstrapKeys(keys)
      },
      { label: t('menus.glyph.fromDecompositionExisting'), disabled: !composable, onSelect: () => bootstrapKeys(keys, false) },
      { label: t('menus.glyph.addComponentsPick'), disabled: !existing.length, onSelect: () => void addComponentsFromPicker(keys) },
      'separator',
      { label: t('menus.glyph.showComponents'), disabled: !existing.length, onSelect: () => setComponentsVisible(keys, true) },
      { label: t('menus.glyph.hideComponents'), disabled: !existing.length, onSelect: () => setComponentsVisible(keys, false) }
    ]
  })
  if (keys.length > 1) {
    items.push({ label: t('menus.glyph.createLigature'), icon: Ligature, shortcut: shortcutLabel('glyph.ligature'), onSelect: () => createLigature(keys) })
    items.push({ label: commandLabel('glyph.ligatureComp'), shortcut: shortcutLabel('glyph.ligatureComp'), onSelect: () => createLigature(keys, true) })
  }
  if (keys.length === 2) items.push({ label: t('menus.glyph.kern', { left: glyphLabel(keys[0]), right: glyphLabel(keys[1]) }), icon: FoldHorizontal, onSelect: () => addPair(keys[0], keys[1]) })
  items.push({
    label: t('menus.glyph.reset'),
    icon: RotateCcw,
    submenu: [
      { label: t('menus.glyph.clearAll'), onSelect: () => resetKeys(keys) },
      { label: t('menus.glyph.clearOutline'), onSelect: () => resetKeys(keys, { keepLayers: true }) },
      { label: t('menus.glyph.rebuild'), disabled: !composable, onSelect: () => resetKeys(keys, { bootstrap: true }) }
    ]
  })
  if (bound.length) items.push({ label: t('menus.glyph.unbind', { count: bound.length }), icon: Unlink, onSelect: () => unbindMany(bound) })
  items.push('separator')
  items.push({
    label: t('menus.glyph.storeInSlot'),
    submenu: Array.from({ length: 10 }, (_, i) => ({ label: t('menus.glyph.slot', { slot: i }), shortcut: shortcutLabel(`preset.store.${i}`), onSelect: () => storePreset(i) }))
  })
  items.push({ label: t('menus.glyph.artboardTemplate'), onSelect: () => void exportArtboardTemplate(keys) })
  items.push('separator')
  items.push({
    // Disabled without an existing glyph: it reads as for one.
    label: t('menus.glyph.delete', { count: Math.max(1, existing.length) }),
    icon: Trash2,
    danger: true,
    shortcut: t('help.keys.Del'),
    disabled: !existing.length,
    onSelect: () => deleteKeys(existing)
  })
  return items
}

/** Context menu for kerning pairs (the pair views). */
export function pairMenu(keys: string[], active: string | null): MenuItem[] {
  const kerning = useDocStore.getState().data?.kerning
  if (!kerning || !keys.length) return []
  const existing = keys.filter((k) => kerning.has(k))
  const target = active ?? keys[keys.length - 1]
  const [left, right] = pairSides(target)
  // Pairs not kerned yet that the outlines suggest a value for.
  const suggestions = activeSuggestions()
  const fill = suggestable(keys, suggestions)
  const items: MenuItem[] = [
    { label: t('menus.pair.goTo', { glyph: glyphLabel(left) }), icon: ArrowRight, onSelect: () => goToGlyph(left) },
    { label: t('menus.pair.goTo', { glyph: glyphLabel(right) }), icon: ArrowRight, onSelect: () => goToGlyph(right) },
    'separator',
    ...(fill.length
      ? [
          {
            label: t('menus.pair.applySuggested', { count: fill.length, value: formatNumber(suggestions.get(fill[0])!, 2) }),
            icon: Wand2,
            hint: t('menus.pair.applySuggestedHint'),
            onSelect: () => void applySuggestions(fill)
          }
        ]
      : []),
    {
      label: t('menus.pair.noKerning'),
      icon: CircleCheck,
      hint: t('menus.pair.noKerningHint'),
      // Pairs not kerned yet too (the common lists, Detected): they count as checked.
      disabled: keys.every((k) => kerning.get(k) === 0),
      onSelect: () => setPairValues(keys, 0)
    },
    {
      label: t('menus.copyText.title'),
      icon: Copy,
      submenu: [
        { label: t('menus.copyText.characters'), icon: Type, onSelect: () => void copyPairs(keys) },
        { label: t('menus.copyText.unicodeValues'), icon: Hash, onSelect: () => void copyPairs(keys, true) }
      ]
    },
    'separator',
    {
      // Disabled without a kerned pair: it reads as for one.
      label: t('menus.pair.remove', { count: Math.max(1, existing.length) }),
      icon: Trash2,
      danger: true,
      shortcut: t('help.keys.Del'),
      disabled: !existing.length,
      onSelect: () => removePairs(existing)
    }
  ]
  return items
}
