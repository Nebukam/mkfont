// ============================================================
// Dev-only: an in-memory stand-in for the Electron preload API, so
// desktop-only flows (recent files, file bindings, external editor,
// close guard, autosave) can be exercised in a plain browser.
// Enabled with `?mock-electron` in dev builds; stripped from production.
// ============================================================

import type { MkFontAPI } from '../../preload/index.d'

export interface MockElectron {
  files: Map<string, string | ArrayBuffer>
  watched: Set<string>
  opened: { path: string; editor?: string }[]
  recent: string[]
  /** Paths returned by the next open dialog. */
  nextOpen: string[]
  /** Path returned by the next save dialog (null = cancel). */
  nextSave: string | null
  emitChange: (path: string, event?: 'change' | 'delete') => void
  requestClose: () => void
  /** A file opened from the system (Explorer, a second instance), as the main process sends it. */
  emitOpenFile: (path: string) => void
  closed: boolean
  title: string
  dirty: boolean
}

if (import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('mock-electron')) {
  const changeListeners = new Set<(p: string, e: 'change' | 'delete') => void>()
  const closeListeners = new Set<() => void>()
  const openListeners = new Set<(p: string) => void>()
  const state: MockElectron = {
    files: new Map(),
    watched: new Set(),
    opened: [],
    recent: [],
    nextOpen: [],
    nextSave: null,
    emitChange: (p, e = 'change') => changeListeners.forEach((fn) => fn(p, e)),
    requestClose: () => closeListeners.forEach((fn) => fn()),
    emitOpenFile: (p) => openListeners.forEach((fn) => fn(p)),
    closed: false,
    title: '',
    dirty: false
  }
  const name = (p: string): string => p.split(/[\\/]/).pop() ?? p
  const api: MkFontAPI = {
    openFiles: async (opts) => {
      const paths = state.nextOpen.splice(0)
      return paths.map((p) => {
        const data = state.files.get(p)
        return opts.binary
          ? { path: p, name: name(p), bytes: data instanceof ArrayBuffer ? data : new TextEncoder().encode(String(data ?? '')).buffer }
          : { path: p, name: name(p), text: typeof data === 'string' ? data : '' }
      })
    },
    saveDialog: async () => {
      const p = state.nextSave
      state.nextSave = null
      return p
    },
    readText: async (p) => {
      const d = state.files.get(p)
      if (d === undefined) throw new Error(`ENOENT: ${p}`)
      return typeof d === 'string' ? d : new TextDecoder().decode(d)
    },

    writeText: async (p, c) => void state.files.set(p, c),
    writeBinary: async (p, d) => void state.files.set(p, d),
    existingPaths: async (paths) => paths.filter((p) => state.files.has(p)),
    firstFolder: async (dirs) => dirs[0] ?? null,
    // Only where the browser has a Brotli encoder of its own.
    brotliCompress: async (d) => {
      const stream = new Blob([d]).stream().pipeThrough(new CompressionStream('brotli' as CompressionFormat))
      return new Uint8Array(await new Response(stream).arrayBuffer())
    },
    getRecentFiles: async () => state.recent.filter((p) => state.files.has(p)),
    addRecentFile: async (p) => {
      state.recent = [p, ...state.recent.filter((x) => x !== p)].slice(0, 12)
    },
    removeRecentFile: async (p) => {
      state.recent = state.recent.filter((x) => x !== p)
    },
    watchFile: async (p) => void state.watched.add(p),
    unwatchFile: async (p) => void state.watched.delete(p),
    onFileChanged: (cb) => {
      changeListeners.add(cb)
      return () => changeListeners.delete(cb)
    },
    writeTempFile: async (n, c) => {
      const p = `C:/Temp/mkfont/${n}`
      state.files.set(p, c)
      return p
    },
    openInEditor: async (p, editor) => {
      state.opened.push({ path: p, editor })
      return { ok: true }
    },
    pickExecutable: async () => 'C:/Apps/Editor.exe',
    pickFolder: async () => 'C:/Exports',
    showItemInFolder: async () => undefined,
    openExternal: async () => undefined,
    setTitle: (t) => void (state.title = t),
    setDirty: (d) => void (state.dirty = d),
    onCloseRequest: (cb) => {
      closeListeners.add(cb)
      return () => closeListeners.delete(cb)
    },
    confirmClose: () => void (state.closed = true),
    onOpenFile: (cb) => {
      openListeners.add(cb)
      return () => openListeners.delete(cb)
    },
    getStartupFile: async () => null,
    getAppVersion: async () => '2.0.0-dev',
    setZoomFactor: () => undefined,
    setLanguage: () => undefined,
    getPathForFile: (f) => `C:/Dropped/${f.name}`
  }
  window.api = api
  ;(window as unknown as Record<string, unknown>).__mockElectron = state
}
