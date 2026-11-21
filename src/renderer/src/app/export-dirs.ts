// ============================================================
// Export folders: each document remembers the folder it was last exported to.
// Saved documents keep it between sessions, keyed by their project path on
// this machine (folders are machine-specific, so it is not written into the
// file). New documents keep it while open, and take it along when first saved.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DocStore } from '../stores/doc-store'
import { localJSONStorage } from '../lib/storage'
import { pathKey as keyOf } from '../platform'

/** Most documents remembered (the least recently exported are forgotten first). */
const LIMIT = 200

const useExportDirs = create<{ byPath: Record<string, string> }>()(
  persist(() => ({ byPath: {} as Record<string, string> }), { name: 'mkfont.export-dirs', storage: localJSONStorage() })
)

/** Folders of documents without a project file (yet). */
const unsaved = new WeakMap<DocStore, string>()

/** The folder a document was last exported to, or null. */
export function exportDirFor(store: DocStore): string | null {
  const path = store.getState().filePath
  return (path ? useExportDirs.getState().byPath[keyOf(path)] : undefined) ?? unsaved.get(store) ?? null
}

/** Remember the folder a document was exported to. */
export function rememberExportDir(store: DocStore, dir: string): void {
  unsaved.set(store, dir)
  const path = store.getState().filePath
  if (!path) return
  const key = keyOf(path)
  const entries = Object.entries(useExportDirs.getState().byPath).filter(([k]) => k !== key)
  entries.push([key, dir])
  useExportDirs.setState({ byPath: Object.fromEntries(entries.slice(-LIMIT)) })
}
