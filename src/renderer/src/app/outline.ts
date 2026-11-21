// ============================================================
// Outline editor: opening it, and putting its edits in the font.
// ============================================================

import { setGlyphOutline } from '../core/ops'
import { glyphLabel } from '../core/unicode-keys'
import { useDocStore } from '../stores/doc-store'
import { useOutlineEditorStore } from '../stores/outline-editor-store'
import { useSelectionStore } from '../stores/selection-store'
import { storeForDoc, useWorkspace } from '../stores/workspace'
import { restoreFocus } from '../components/ui/focus'
import { toast } from '../components/ui/Overlays'
import { basename } from '../platform'
import { boundFile, unbind } from './bindings'
import { t } from '../i18n'

/** What an edit did (the engine's kinds): names it in the history. */
export type OutlineEditKind = 'move' | 'handle' | 'insert' | 'delete' | 'convert' | 'transform' | 'reverse' | 'deleteContour'

/** What had focus when the editor was opened: it gets focus back when the editor closes. */
let opener: HTMLElement | null = null
/** The editor was asked for: its drawing area takes focus once it shows the glyph. */
let focusWanted = false

/** Whether the editor's drawing area should take focus now (asked once per opening). */
export function takeOutlineFocus(): boolean {
  const wanted = focusWanted
  focusWanted = false
  return wanted
}

/**
 * Show the outline editor on a glyph of the font shown (the active glyph by default). When
 * that font's editor is locked on another glyph, the lock moves to this one: asking for a
 * glyph by name always shows it.
 */
export function openOutlineEditor(key: string | null = useSelectionStore.getState().active): void {
  const doc = useDocStore.getState()
  if (!doc.data) return
  const editor = useOutlineEditorStore.getState()
  if (!editor.open) opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  if (key) {
    if (useSelectionStore.getState().active !== key) useSelectionStore.getState().setSelection([key], key)
    if (editor.locks.has(doc.docId)) editor.setLock(doc.docId, key)
  }
  focusWanted = true
  editor.setOpen(true)
}

/** Close the editor; focus goes back to where it was opened from (or to the grid). */
export function closeOutlineEditor(windowEl: HTMLElement | null = null): void {
  useOutlineEditorStore.getState().setOpen(false)
  const previous = opener
  opener = null
  // Once the window is gone: focus inside it counts as lost.
  requestAnimationFrame(() => restoreFocus(previous, windowEl))
}

const HISTORY = {
  move: 'outline.history.move',
  handle: 'outline.history.handle',
  insert: 'outline.history.insert',
  delete: 'outline.history.delete',
  convert: 'outline.history.convert',
  transform: 'outline.history.transform',
  reverse: 'outline.history.reverse',
  deleteContour: 'outline.history.deleteContour'
} as const satisfies Record<OutlineEditKind, string>

/**
 * Put an edited outline in a glyph of the document it was edited in (also when another tab
 * is shown by now): one history step, or one for a run of small edits sharing `merge`.
 * A glyph linked to an SVG file is unlinked first: the file's next change would replace
 * the edit.
 */
export function commitOutline(docId: number, key: string, path: string, kind: OutlineEditKind, merge?: string): boolean {
  const store = storeForDoc(docId)
  if (!store?.getState().data?.glyphs.has(key)) return false
  const done = store.getState().transact(t(HISTORY[kind], { glyph: glyphLabel(key) }), (d) => void setGlyphOutline(d, key, path), {
    mergeKey: merge ? `outline:${key}:${kind}:${merge}` : undefined,
    icon: 'outline'
  })
  if (!done) return false
  const file = boundFile(key, docId)
  if (file) {
    unbind(key, docId)
    toast.info(t('outline.unlinked', { glyph: glyphLabel(key), fileName: basename(file) }), t('outline.unlinkedDetail'))
  }
  return true
}

// A lock on a glyph that was deleted, or of a font that was closed, is released. Glyphs
// are deleted in the font shown; fonts close with their tab.
function dropStaleLocks(): void {
  if (!useOutlineEditorStore.getState().locks.size) return
  useOutlineEditorStore.getState().dropLocks((docId, key) => !!storeForDoc(docId)?.getState().data?.glyphs.has(key))
}
useDocStore.subscribe((s, prev) => {
  if (s.data?.glyphs !== prev.data?.glyphs) dropStaleLocks()
})
useWorkspace.subscribe(dropStaleLocks)
