// ============================================================
// Resource bindings (v1 BindingManager): glyphs bound to SVG files
// reload when the file changes. Also powers "Edit in external editor".
// ============================================================

import { create } from 'zustand'
import { native, basename } from '../platform'
import { activeDocStore, useDocStore } from '../stores/doc-store'
import { storeForDoc, useWorkspace } from '../stores/workspace'
import { usePrefsStore } from '../stores/prefs-store'
import { parseSvg, variantToSvg } from '../core/import-svg'
import { applySvgImport } from '../core/ops'
import { glyphLabel, glyphsValues, keyToUUni } from '../core/unicode-keys'
import { confirmDialog } from './dialogs'
import { toast } from '../components/ui/Overlays'
import { errorMessage } from '../lib/errors'
import { t, tm } from '../i18n'

interface BindingState {
  /** The active document's bound files: glyph key → file path. */
  byKey: Map<string, string>
}

export const useBindings = create<BindingState>()(() => ({ byKey: new Map() }))

/** Bound files of every open document: document id → (glyph key → file path). */
const byDoc = new Map<number, Map<string, string>>()

const activeDocId = (): number => useDocStore.getState().docId

/** Show the bindings of `docId` when it is the active document. */
function publish(docId: number): void {
  if (docId === activeDocId()) useBindings.setState({ byKey: new Map(byDoc.get(docId) ?? []) })
}

/** Glyphs bound to `path`, per document (a background tab's too). */
function boundTo(path: string): { docId: number; keys: string[] }[] {
  const out: { docId: number; keys: string[] }[] = []
  for (const [docId, map] of byDoc) {
    const keys = [...map].filter(([, p]) => p === path).map(([k]) => k)
    if (keys.length) out.push({ docId, keys })
  }
  return out
}

const isBound = (path: string): boolean => [...byDoc.values()].some((map) => [...map.values()].includes(path))

/** Stop watching a file no glyph of any open document is bound to anymore. */
function release(path: string): void {
  if (isBound(path)) return
  forget(path)
  if (native) void native.unwatchFile(path)
}

/** Forget a document's bindings (closed, or reloaded). */
function dropDoc(docId: number): void {
  const map = byDoc.get(docId)
  if (!map) return
  byDoc.delete(docId)
  for (const path of new Set(map.values())) release(path)
}

// The bindings shown follow the active tab, and closed tabs let go of their files.
useDocStore.subscribe((s, prev) => {
  if (s.docId !== prev.docId) useBindings.setState({ byKey: new Map(byDoc.get(s.docId) ?? []) })
})
useWorkspace.subscribe(() => {
  for (const docId of [...byDoc.keys()]) if (!storeForDoc(docId)) dropDoc(docId)
})

let listening = false

/** A bound file that does not parse is read again after this delay: its editor may still be writing it. */
const RETRY_MS = 500
const retries = new Map<string, ReturnType<typeof setTimeout>>()
/** The latest read of each file, so an earlier read that finishes late is dropped. */
const reads = new Map<string, number>()
let readSeq = 0

/** Drop pending work for a file no glyph is bound to anymore. */
function forget(path: string): void {
  clearTimeout(retries.get(path))
  retries.delete(path)
  reads.delete(path)
}

function ensureListener(): void {
  if (listening || !native) return
  listening = true
  native.onFileChanged((path, event) => {
    const bound = boundTo(path)
    if (!bound.length) return
    if (event === 'delete') {
      for (const { docId, keys } of bound) unbindMany(keys, docId)
      toast.info(t('edit.bindings.unbound', { fileName: basename(path) }), t('edit.bindings.unboundDetail'))
      return
    }
    reloadBinding(path)
  })
}

/**
 * Reload the glyphs bound to a file (one undo step per document), adding components
 * from its <text> labels. A file that does not parse is read once more before
 * reporting it. Documents in background tabs reload too.
 */
export function reloadBinding(path: string, retry = true): void {
  if (!native) return
  clearTimeout(retries.get(path))
  retries.delete(path)
  const id = ++readSeq
  reads.set(path, id)
  native
    .readText(path)
    .then((text) => {
      if (reads.get(path) !== id) return
      const bound = boundTo(path)
      if (!bound.length) return
      const parsed = parseSvg(text, usePrefsStore.getState().markColor)
      if (!parsed.exists) {
        if (retry) retries.set(path, setTimeout(() => reloadBinding(path, false), RETRY_MS))
        else {
          const all = bound.flatMap((b) => b.keys)
          toast.warning(
            t(all.length === 1 ? 'edit.bindings.couldNotReloadGlyph' : 'edit.bindings.couldNotReloadGlyphs', glyphsValues(all)),
            parsed.error ? tm(parsed.error) : t('imports.svg.fileNoPaths')
          )
        }
        return
      }
      for (const { docId, keys } of bound) {
        storeForDoc(docId)?.getState().transact(t(keys.length === 1 ? 'edit.history.reloadGlyph' : 'edit.history.reloadGlyphs', glyphsValues(keys)), (d) => {
          for (const key of keys) applySvgImport(d, key, parsed, { create: false })
        })
      }
    })
    .catch((e: unknown) => {
      if (reads.get(path) === id) toast.warning(t('edit.bindings.couldNotReloadFile', { fileName: basename(path) }), errorMessage(e))
    })
}

/** Bind a glyph (of the active document by default) to a file: the glyph reloads when the file changes. */
export function bind(key: string, path: string, docId = activeDocId()): void {
  if (!native) return
  ensureListener()
  const map = new Map(byDoc.get(docId) ?? [])
  const prev = map.get(key)
  map.set(key, path)
  byDoc.set(docId, map)
  publish(docId)
  if (prev && prev !== path) release(prev)
  void native.watchFile(path)
}

/** The file a glyph (of the active document by default) is bound to, if any. */
export function boundFile(key: string, docId = activeDocId()): string | undefined {
  return byDoc.get(docId)?.get(key)
}

export function unbind(key: string, docId = activeDocId()): void {
  const map = byDoc.get(docId)
  const path = map?.get(key)
  if (!map || !path) return
  const next = new Map(map)
  next.delete(key)
  if (next.size) byDoc.set(docId, next)
  else byDoc.delete(docId)
  publish(docId)
  release(path)
}

export function unbindMany(keys: Iterable<string>, docId = activeDocId()): void {
  for (const k of keys) unbind(k, docId)
}

/** Forget every binding of a document (the active one by default). */
export function clearBindings(docId = activeDocId()): void {
  dropDoc(docId)
  publish(docId)
}

async function resolveEditor(): Promise<string | null | undefined> {
  const prefs = usePrefsStore.getState()
  if (prefs.svgEditorPath === 'system') return undefined
  if (prefs.svgEditorPath) return prefs.svgEditorPath
  const res = await confirmDialog({
    title: t('edit.bindings.pickEditor.title'),
    message: t('edit.bindings.pickEditor.message'),
    confirmLabel: t('edit.bindings.pickEditor.choose'),
    altLabel: t('edit.bindings.pickEditor.systemDefault')
  })
  if (res === 'alt') {
    prefs.set('svgEditorPath', 'system')
    return undefined
  }
  if (res !== 'confirm' || !native) return null
  const exe = await native.pickExecutable(t('edit.bindings.pickEditor.dialogTitle'))
  if (!exe) return null
  prefs.set('svgEditorPath', exe)
  return exe
}

/**
 * v1 CmdEditInExternalEditor: write the glyph's source SVG to a temp file,
 * open it in the external editor and live-reload it on save.
 */
export async function editInExternalEditor(key: string): Promise<void> {
  if (!native) {
    toast.info(t('edit.bindings.needsDesktop'))
    return
  }
  // The font this started in, also when another tab is shown once the file is ready.
  const store = activeDocStore()
  const s = store.getState()
  const glyph = s.data?.glyphs.get(key)
  if (!s.data || !glyph) return
  const editor = await resolveEditor()
  if (editor === null) return
  const svg = variantToSvg(glyph.variants[0], s.data.family.values.em, true, usePrefsStore.getState().markColor)
  const name = `mkfont-${keyToUUni(key).replace(/\+/g, '')}-${Date.now().toString(36)}.svg`
  const path = await native.writeTempFile(name, svg)
  // Closed meanwhile: nothing to edit.
  if (storeForDoc(s.docId) !== store) return
  bind(key, path, s.docId)
  const res = await native.openInEditor(path, editor)
  if (!res.ok) toast.error(t('edit.bindings.couldNotOpenEditor'), res.error)
  else toast.info(t('edit.bindings.editing', { glyph: glyphLabel(key) }), t('edit.bindings.editingDetail'))
}
