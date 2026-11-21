// ============================================================
// Platform layer — Electron when available, browser fallbacks
// otherwise (file inputs, downloads, File System Access API).
// ============================================================

import { MessageError, msg, t } from '../i18n'

export interface FileFilter {
  name: string
  extensions: string[]
}

export interface PickedFile {
  /** Absolute path (Electron) or null (browser). */
  path: string | null
  name: string
  text?: string
  bytes?: ArrayBuffer
}

/** File dialog filters. Getters: the names are looked up when a dialog opens. */
export const FILTERS = {
  get mkfont(): FileFilter[] {
    return [{ name: t('shell.filters.mkfont'), extensions: ['mkfont'] }]
  },
  get svg(): FileFilter[] {
    return [{ name: t('shell.filters.svg'), extensions: ['svg'] }]
  },
  get font(): FileFilter[] {
    return [{ name: t('shell.filters.font'), extensions: ['ttf', 'otf', 'woff'] }]
  },
  get ttf(): FileFilter[] {
    return [{ name: t('shell.filters.ttf'), extensions: ['ttf'] }]
  },
  get otf(): FileFilter[] {
    return [{ name: t('shell.filters.otf'), extensions: ['otf'] }]
  },
  get woff(): FileFilter[] {
    return [{ name: t('shell.filters.woff'), extensions: ['woff'] }]
  },
  get woff2(): FileFilter[] {
    return [{ name: t('shell.filters.woff2'), extensions: ['woff2'] }]
  },
  get jsx(): FileFilter[] {
    return [{ name: t('shell.filters.jsx'), extensions: ['jsx'] }]
  }
} satisfies Record<string, FileFilter[]>

const api = typeof window !== 'undefined' ? window.api : undefined

export const isElectron = !!api

export function basename(p: string): string {
  return p.split(/[\\/]/).pop() ?? p
}

/** Folder part of a path, keeping its separator style ('' when there is none). */
export function dirname(p: string): string {
  const i = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'))
  return i > 0 ? p.slice(0, i) : ''
}

/** Join a folder and a file name with the folder's own separator. */
export function joinPath(dir: string, name: string): string {
  if (!dir) return name
  const sep = dir.includes('\\') && !dir.includes('/') ? '\\' : '/'
  return dir.endsWith(sep) ? dir + name : dir + sep + name
}

export function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

export const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

/** Windows and (by default) macOS file systems ignore case. */
const caseInsensitivePaths = isMac || (typeof navigator !== 'undefined' && /Win/.test(navigator.platform))

/**
 * A path in the form two spellings of the same file share (`D:/a.mkfont` from the
 * command line, `D:\A.mkfont` from a dialog): to compare paths and to key data by them.
 */
export function pathKey(p: string): string {
  const unified = p.replace(/[\\/]+/g, '/').replace(/\/$/, '')
  // macOS can hand back decomposed accents (é as e + ´): compare one form there. Elsewhere
  // two spellings are two different files.
  const key = isMac ? unified.normalize('NFC') : unified
  return caseInsensitivePaths ? key.toLowerCase() : key
}

// ---- Browser helpers ----

function pickWithInput(filters: FileFilter[], multi: boolean): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = multi
    input.accept = filters.flatMap((f) => f.extensions.map((e) => '.' + e)).join(',')
    input.style.display = 'none'
    let settled = false
    const done = (files: File[]): void => {
      if (settled) return
      settled = true
      input.remove()
      resolve(files)
    }
    input.addEventListener('change', () => done(Array.from(input.files ?? [])))
    input.addEventListener('cancel', () => done([]))
    document.body.appendChild(input)
    input.click()
  })
}

/** Hand a file to the browser as a download. */
export function download(data: BlobPart, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

type SavePicker = (opts: unknown) => Promise<{ name: string; createWritable: () => Promise<{ write: (d: BlobPart) => Promise<void>; close: () => Promise<void> }> }>

async function browserSave(data: BlobPart, suggestedName: string, filters: FileFilter[], type: string): Promise<string | null> {
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker
  if (picker) {
    try {
      const handle = await picker({
        suggestedName,
        types: filters.map((f) => ({ description: f.name, accept: { [type]: f.extensions.map((e) => '.' + e) } }))
      })
      const w = await handle.createWritable()
      await w.write(data)
      await w.close()
      return handle.name
    } catch (e) {
      if ((e as Error).name === 'AbortError') return null
      // Fall through to a download when the picker is blocked (iframes, permissions).
    }
  }
  download(data, suggestedName, type)
  return suggestedName
}

// ---- Public API ----

export async function pickFiles(opts: {
  title?: string
  filters: FileFilter[]
  multi?: boolean
  binary?: boolean
}): Promise<PickedFile[]> {
  if (api) return api.openFiles(opts)
  const files = await pickWithInput(opts.filters, !!opts.multi)
  return Promise.all(files.map((f) => readBrowserFile(f, !!opts.binary)))
}

export async function readBrowserFile(f: File, binary: boolean): Promise<PickedFile> {
  const path = api ? api.getPathForFile(f) || null : null
  return binary ? { path, name: f.name, bytes: await f.arrayBuffer() } : { path, name: f.name, text: await f.text() }
}

/**
 * Save text or bytes. With `path` (Electron) the file is written directly;
 * otherwise a save dialog / picker is shown. Returns the saved path or name.
 */
export async function saveFile(opts: {
  data: string | ArrayBuffer
  suggestedName: string
  filters: FileFilter[]
  path?: string | null
  /** Folder the save dialog opens in (Electron), e.g. the project's folder. */
  defaultDir?: string | null
  /** Folders to try in order (the first that exists wins), before `defaultDir`. */
  defaultDirs?: (string | null | undefined)[]
  /** Desktop app: checks the chosen path before anything is written; false cancels the save. */
  beforeWrite?: (path: string) => boolean
  title?: string
  mime?: string
}): Promise<string | null> {
  const mime = opts.mime ?? (typeof opts.data === 'string' ? 'application/json' : 'application/octet-stream')
  if (api) {
    let target = opts.path ?? null
    if (!target) {
      const defaultDirs = [...(opts.defaultDirs ?? []), opts.defaultDir].filter((d): d is string => !!d)
      target = await api.saveDialog({ title: opts.title, defaultName: opts.suggestedName, defaultDirs, filters: opts.filters })
    }
    if (!target || (opts.beforeWrite && !opts.beforeWrite(target))) return null
    if (typeof opts.data === 'string') await api.writeText(target, opts.data)
    else await api.writeBinary(target, opts.data)
    return target
  }
  return browserSave(opts.data, opts.suggestedName, opts.filters, mime)
}

/** Open a web page in the user's browser. */
export function openExternal(url: string): void {
  if (api) void api.openExternal(url)
  else window.open(url, '_blank', 'noopener')
}

/** Pick a folder (desktop app only; null when cancelled). */
export async function pickFolder(title?: string, defaultPath?: string | null): Promise<string | null> {
  return api ? api.pickFolder(title, defaultPath ?? undefined) : null
}

/** Those of `paths` that exist (desktop app only: none in a browser, where files are downloads). */
export async function existingPaths(paths: string[]): Promise<string[]> {
  return api ? api.existingPaths(paths) : []
}

/** The first of `dirs` that is an existing folder (desktop app only; null when there is none). */
export async function firstFolder(dirs: (string | null | undefined)[]): Promise<string | null> {
  const known = dirs.filter((d): d is string => !!d)
  return api && known.length ? api.firstFolder(known) : null
}

/** Reveal a saved file in Explorer / Finder (desktop app only). */
export function showInFolder(path: string): void {
  if (api) void api.showItemInFolder(path)
}

export async function readText(path: string): Promise<string> {
  if (api) return api.readText(path)
  const res = await fetch(path)
  if (!res.ok) throw new MessageError(msg('shell.errors.couldNotRead', { path }))
  return res.text()
}

export async function getRecentFiles(): Promise<string[]> {
  return api ? api.getRecentFiles() : []
}

export async function addRecentFile(path: string): Promise<void> {
  if (api) await api.addRecentFile(path)
}

export async function removeRecentFile(path: string): Promise<void> {
  if (api) await api.removeRecentFile(path)
}

export async function readClipboardText(): Promise<string> {
  try {
    return await navigator.clipboard.readText()
  } catch {
    return ''
  }
}

export async function writeClipboardText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for contexts without the async clipboard permission.
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

export const native = api
