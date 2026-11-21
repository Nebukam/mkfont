// ============================================================
// Document lifecycle: new / open / save / close (export: export.ts).
//
// Every document opens in a tab of its own (stores/workspace). Saves and
// exports work on the store of the document they were started for, also
// when another tab is shown by the time they finish.
// ============================================================

import { activeDocStore, selectDirty, type DocStore, type SavedSnapshot } from '../stores/doc-store'
import {
  activateSession,
  activeSession,
  closeSession,
  isPristine,
  openSession,
  openStores,
  sessionForPath,
  storeForDoc,
  useWorkspace
} from '../stores/workspace'
import { usePrefsStore } from '../stores/prefs-store'
import { deserializeMkFont } from '../core/deserialize'
import { serializeMkFont } from '../core/serialize'
import { createFamily } from '../core/model'
import type { Kerning } from '../core/kerning'
import type { Family, Glyph, MkFontFile } from '../types/font'
import {
  FILTERS,
  addRecentFile,
  basename,
  dirname,
  isElectron,
  pickFiles,
  readText,
  removeRecentFile,
  saveFile,
  stripExtension
} from '../platform'
import { confirmDialog, dialogFlow, isDialogOpen, useDialogs } from './dialogs'
import { commitFieldEdit, focusedField, refocusAfterSwitch, restoreFieldFocus } from '../components/ui/focus'
import { toast } from '../components/ui/Overlays'
import { clearBindings } from './bindings'
import { errorMessage } from '../lib/errors'
import { exportDirFor, rememberExportDir } from './export-dirs'
import { t } from '../i18n'

/** Ask to save a document's unsaved changes (the active one by default). Resolves true when it may be closed. */
export async function guardUnsaved(store: DocStore = activeDocStore()): Promise<boolean> {
  const s = store.getState()
  if (!selectDirty(s)) return true
  const res = await confirmDialog({
    title: t('document.unsaved.title', { fileName: s.fileName }),
    message: t('document.unsaved.message'),
    confirmLabel: t('document.unsaved.save'),
    altLabel: t('document.unsaved.dontSave'),
    cancelLabel: t('document.unsaved.cancel')
  })
  if (res === 'confirm') return save(store)
  return res === 'alt'
}

/** Ask about every open document with unsaved changes. False when one was cancelled. */
export function guardAllUnsaved(): Promise<boolean> {
  return dialogFlow(askAllUnsaved)
}

async function askAllUnsaved(): Promise<boolean> {
  commitFieldEdit()
  // Given back after a cancel, should the prompts have shown other fonts meanwhile.
  const field = focusedField()
  const ws = useWorkspace.getState()
  if (!ws.sessions.length) return guardUnsaved()
  const start = ws.activeId
  // Each font is shown while it is asked about, unless a dialog is open: it must keep
  // working on the font it was opened for (the prompt names the font anyway).
  const show = !isDialogOpen()
  for (const session of [...ws.sessions]) {
    if (!selectDirty(session.store.getState())) continue
    if (show) activateSession(session.id)
    if (!(await guardUnsaved(session.store))) {
      // Cancelled: back to the font the user was working on, and to the field they were
      // in, also when a prompt left focus on the grid (it fell back while prompts showed
      // fonts without that field).
      const back = start !== null && useWorkspace.getState().activeId !== start
      if (back) activateSession(start!)
      if (field) {
        if (back) refocusAfterSwitch(field)
        else restoreFieldFocus(field)
      }
      return false
    }
  }
  return true
}

/** "Untitled.mkfont", then "Untitled 2.mkfont"… so new fonts are told apart in their tabs. */
function untitledName(): string {
  const taken = new Set(useWorkspace.getState().sessions.map((s) => s.store.getState().fileName))
  const name = (n: number): string => (n === 1 ? t('document.untitledFile') : t('document.untitledFileNumbered', { n }))
  let n = 1
  while (taken.has(name(n))) n++
  return name(n)
}

/** Open a document in a new tab. An untouched new font in the active tab gives way to it. */
export function loadDocument(
  family: Family,
  glyphs: Map<string, Glyph>,
  opts: {
    filePath?: string | null
    fileName: string
    label?: string
    saved?: boolean
    meta?: MkFontFile['meta']
    kerning?: Kerning
    inheritKerning?: boolean
  }
): void {
  // A field typed in makes the shown font worked on: it is not replaced then.
  commitFieldEdit()
  const current = activeSession()
  const replace = current && isPristine(current)
  const { kerning, inheritKerning, ...rest } = opts
  openSession((store) => store.getState().load({ family, glyphs, kerning, inheritKerning }, rest))
  if (replace && current) closeSession(current.id)
}

/** A new, empty font in a new tab. */
export function openNewFont(label = t('document.history.newFont')): void {
  loadDocument(createFamily({ 'font-family': t('document.untitledFamily') }), new Map(), { fileName: untitledName(), label })
}

export async function newFont(): Promise<void> {
  openNewFont()
}

/** Load .mkfont text in a new tab (or show its tab when it is open); false (and reported) on parse errors. */
export function loadMkFontText(text: string, filePath: string | null, fileName: string): boolean {
  const open = filePath ? sessionForPath(filePath) : null
  if (open) {
    activateSession(open.id)
    return true
  }
  try {
    const t0 = performance.now()
    const { family, glyphs, kerning, inheritKerning, meta } = deserializeMkFont(text)
    loadDocument(family, glyphs, { filePath, fileName, meta, kerning, inheritKerning, label: t('document.history.openedFile', { fileName }) })
    if (filePath) void addRecentFile(filePath)
    const ms = Math.round(performance.now() - t0)
    if (ms > 1500) toast.info(t('document.opened', { fileName }), t('document.openedDetail', { count: glyphs.size, seconds: (ms / 1000).toFixed(1) }))
    return true
  } catch (e) {
    toast.error(t('document.couldNotOpen', { fileName }), errorMessage(e))
    return false
  }
}

export async function openFontDialog(): Promise<void> {
  const files = await pickFiles({ title: t('document.openTitle'), filters: FILTERS.mkfont, multi: true })
  for (const file of files) if (file.text !== undefined) loadMkFontText(file.text, file.path, file.name)
}

export async function openFontPath(path: string): Promise<void> {
  const open = sessionForPath(path)
  if (open) {
    activateSession(open.id)
    return
  }
  try {
    const text = await readText(path)
    loadMkFontText(text, path, basename(path))
  } catch (e) {
    toast.error(t('document.couldNotOpen', { fileName: basename(path) }), errorMessage(e))
    void removeRecentFile(path)
  }
}

/** The example font shipped with the app: `src/renderer/public/MkFontExample.mkfont`, replaced in place to update it. */
const SAMPLE_FILE = 'MkFontExample.mkfont'

export async function loadSample(): Promise<void> {
  try {
    const res = await fetch(`./${SAMPLE_FILE}`)
    if (!res.ok) throw new Error(res.statusText)
    const text = await res.text()
    if (loadMkFontText(text, null, SAMPLE_FILE)) {
      // The sample is read-only content: saving asks for a location.
      activeDocStore().setState({ filePath: null })
    }
  } catch (e) {
    toast.error(t('document.couldNotLoadSample'), errorMessage(e))
  }
}

/** A document as .mkfont JSON (the active one by default), with the snapshot it describes. */
export function serializeCurrent(store: DocStore = activeDocStore()): { json: string; snapshot: SavedSnapshot } | null {
  const s = store.getState()
  if (!s.data) return null
  const family = { ...s.data.family, selections: s.presets }
  const json = serializeMkFont(family, s.data.glyphs, {
    computed: s.computed,
    meta: s.meta,
    kerning: s.data.kerning,
    inheritKerning: s.data.inheritKerning
  })
  return { json, snapshot: { data: s.data, presets: s.presets, docId: s.docId } }
}

// Saves run one at a time: an autosave never overlaps a manual save.
let saveChain: Promise<unknown> = Promise.resolve()
function queued<T>(fn: () => Promise<T>): Promise<T> {
  const run = saveChain.then(fn, fn)
  saveChain = run.catch(() => undefined)
  return run
}

/** Folder of a document's project file: save-as dialogs start there. */
export function projectDir(store: DocStore = activeDocStore()): string | null {
  const p = store.getState().filePath
  return p ? dirname(p) || null : null
}

/** A file name (without extension) for what a document saves or exports: its project's, else its family's. */
export function suggestedBaseName(store: DocStore): string {
  const s = store.getState()
  const untitled = s.fileName.toLowerCase().startsWith(t('document.untitled').toLowerCase())
  return s.fileName && !untitled ? stripExtension(s.fileName) : s.data?.family.values['font-family'] || t('document.fallbackFileName')
}

function suggestedName(ext: string, store: DocStore): string {
  return `${suggestedBaseName(store)}.${ext}`
}

export function save(store: DocStore = activeDocStore()): Promise<boolean> {
  return queued(() => doSave(store))
}

export function saveAs(store: DocStore = activeDocStore()): Promise<boolean> {
  return queued(() => doSaveAs(store))
}

/** False once the font's tab is closed: a save queued before "Don't save" must not write it. */
function isOpen(store: DocStore): boolean {
  return storeForDoc(store.getState().docId) === store
}

async function doSave(store: DocStore): Promise<boolean> {
  const s = store.getState()
  if (!s.data || !isOpen(store)) return false
  if (!isElectron || !s.filePath) return doSaveAs(store)
  const out = serializeCurrent(store)
  if (out === null) return false
  s.trackSave(out.snapshot)
  try {
    await saveFile({ data: out.json, suggestedName: s.fileName, filters: FILTERS.mkfont, path: s.filePath })
    store.getState().markSaved(s.filePath, basename(s.filePath), out.snapshot)
    return true
  } catch (e) {
    toast.error(t('document.saveFailed'), errorMessage(e))
    return false
  }
}

async function doSaveAs(store: DocStore): Promise<boolean> {
  if (!isOpen(store)) return false
  const out = serializeCurrent(store)
  if (out === null) return false
  store.getState().trackSave(out.snapshot)
  // Another tab showed the file this save replaces (it is closed by then).
  let replaced = false
  try {
    const target = await saveFile({
      data: out.json,
      suggestedName: suggestedName('mkfont', store),
      filters: FILTERS.mkfont,
      title: t('document.saveTitle'),
      defaultDir: projectDir(store),
      // One tab per file: the other tab closes before the write (nothing can change it
      // meanwhile; a failed write keeps the old file), or the save stops when it has
      // unsaved changes of its own.
      beforeWrite: (path) => {
        const other = sessionForPath(path)
        if (!other || other.store === store) return true
        if (selectDirty(other.store.getState())) {
          toast.error(t('document.openInOtherTab', { fileName: basename(path) }), t('document.openInOtherTabDetail'))
          return false
        }
        clearBindings(other.store.getState().docId)
        closeSession(other.id)
        replaced = true
        return true
      }
    })
    if (!target) return false
    const name = basename(target)
    // An export folder chosen before this save stays with the document under its new name.
    const exportDir = exportDirFor(store)
    store.getState().markSaved(isElectron ? target : null, name, out.snapshot)
    if (isElectron && exportDir) rememberExportDir(store, exportDir)
    if (isElectron) void addRecentFile(target)
    toast.success(t('document.saved', { fileName: name }), replaced ? t('document.savedReplacedTab') : undefined)
    return true
  } catch (e) {
    toast.error(t('document.saveFailed'), errorMessage(e))
    return false
  }
}

/** Close a document's tab (the active one by default), asking about unsaved changes first. */
export function closeFont(store: DocStore = activeDocStore()): Promise<void> {
  return dialogFlow(() => closeAsked(store))
}

async function closeAsked(store: DocStore): Promise<void> {
  // Text typed in a field of this font counts as an unsaved change.
  commitFieldEdit()
  if (!store.getState().data) return
  if (!(await guardUnsaved(store))) return
  clearBindings(store.getState().docId)
  const session = useWorkspace.getState().sessions.find((s) => s.store === store)
  if (session) closeSession(session.id)
  else store.getState().close()
}

/** How often autosave looks at the open fonts. */
export const AUTOSAVE_TICK = 15_000

/**
 * Periodic autosave of every open document that already has a path, once its changes are
 * as old as the chosen interval. Never while a prompt or a close flow is open.
 */
export function startAutosave(): () => void {
  // When each font started to have unsaved changes: it is saved once they are that old.
  const dirtySince = new WeakMap<DocStore, number>()
  const timer = window.setInterval(() => {
    const prefs = usePrefsStore.getState()
    if (!prefs.autosave) return
    // Never under a prompt: "Don't save" must leave the file as it is on disk.
    if (isDialogOpen() || useDialogs.getState().busy > 0) return
    const now = Date.now()
    for (const store of openStores()) {
      const s = store.getState()
      if (!s.filePath || !selectDirty(s)) {
        dirtySince.delete(store)
        continue
      }
      const since = dirtySince.get(store)
      if (since === undefined) {
        dirtySince.set(store, now)
        continue
      }
      if (now - since < prefs.autosaveMinutes * 60_000) continue
      // Changes made after this save (or a save that failed) wait a full interval again.
      dirtySince.delete(store)
      void save(store).then((ok) => ok && toast.info(t('document.autosaved'), s.fileName))
    }
  }, AUTOSAVE_TICK)
  return () => window.clearInterval(timer)
}
