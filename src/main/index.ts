import { app, shell, BrowserWindow, ipcMain, dialog, Menu, screen } from 'electron'
import { join, basename, dirname } from 'path'
import { tmpdir } from 'os'
import { spawn } from 'child_process'
import { watch, type FSWatcher } from 'fs'
import { readFile, writeFile, access, mkdir } from 'fs/promises'
import { brotliCompress, constants as zlib } from 'zlib'
import { electronApp, is } from '@electron-toolkit/utils'
import icon from '../../build/icon.png?asset'
import { CloseGuard, CloseWatch, FileRouter, fileFromArgv } from './lifecycle'
import { writeFileAtomic } from './atomic-write'
import { dialogDefaultPath, firstFolder, sanitizeDialogDirs, type DialogDirs, type DialogKind } from './dialog-paths'
import { setLanguage, t } from './i18n'

// ---------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------

const userFile = (name: string): string => join(app.getPath('userData'), name)

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(userFile(name), 'utf-8')) as T
  } catch {
    return fallback
  }
}

async function writeJson(name: string, data: unknown): Promise<void> {
  try {
    await writeFile(userFile(name), JSON.stringify(data), 'utf-8')
  } catch (e) {
    console.error(`Failed to write ${name}`, e)
  }
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------
// Where dialogs open
// ---------------------------------------------------------------

// Since Electron 43 a dialog opened without a path starts in Downloads, and the system no
// longer remembers the folder it was last used in. The app remembers it instead, for each
// kind of dialog.
let dialogDirs: DialogDirs | null = null

async function loadDialogDirs(): Promise<DialogDirs> {
  dialogDirs ??= sanitizeDialogDirs(await readJson<unknown>('dialog-dirs.json', {}))
  return dialogDirs
}

/** The folder a kind of dialog was last used in, if it is still there. */
async function lastDialogDir(kind: DialogKind): Promise<string | undefined> {
  const dir = (await loadDialogDirs())[kind]
  return dir ? ((await firstFolder([dir])) ?? undefined) : undefined
}

function rememberDialogDir(kind: DialogKind, dir: string): void {
  if (dialogDirs?.[kind] === dir) return
  dialogDirs = { ...dialogDirs, [kind]: dir }
  void writeJson('dialog-dirs.json', dialogDirs)
}

// ---------------------------------------------------------------
// Recent files
// ---------------------------------------------------------------

const MAX_RECENT = 12

async function getRecent(): Promise<string[]> {
  const list = await readJson<unknown>('recent-files.json', [])
  return Array.isArray(list) ? list.filter((p): p is string => typeof p === 'string') : []
}

async function addRecent(p: string): Promise<void> {
  const list = (await getRecent()).filter((x) => x !== p)
  list.unshift(p)
  await writeJson('recent-files.json', list.slice(0, MAX_RECENT))
  if (process.platform === 'win32' || process.platform === 'darwin') app.addRecentDocument(p)
}

async function removeRecent(p: string): Promise<void> {
  await writeJson('recent-files.json', (await getRecent()).filter((x) => x !== p))
}

// ---------------------------------------------------------------
// Window state
// ---------------------------------------------------------------

interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  maximized: boolean
}

async function loadWindowState(): Promise<WindowState> {
  const s = await readJson<WindowState>('window-state.json', { width: 1440, height: 900, maximized: false })
  // Ignore positions that are no longer on any display.
  if (s.x !== undefined && s.y !== undefined) {
    const visible = screen.getAllDisplays().some((d) => {
      const b = d.workArea
      return s.x! >= b.x - 50 && s.y! >= b.y - 50 && s.x! < b.x + b.width && s.y! < b.y + b.height
    })
    if (!visible) {
      delete s.x
      delete s.y
    }
  }
  return s
}

function trackWindowState(win: BrowserWindow): void {
  let timer: NodeJS.Timeout | null = null
  const save = (): void => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      if (win.isDestroyed()) return
      const maximized = win.isMaximized()
      const b = maximized ? win.getNormalBounds() : win.getBounds()
      void writeJson('window-state.json', { ...b, maximized })
    }, 400)
  }
  win.on('resize', save)
  win.on('move', save)
  win.on('maximize', save)
  win.on('unmaximize', save)
}

// ---------------------------------------------------------------
// File watching (resource bindings)
// ---------------------------------------------------------------

const watchers = new Map<string, FSWatcher>()
const watchTimers = new Map<string, NodeJS.Timeout>()

function emitWatch(path: string, event: 'change' | 'delete'): void {
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send('watch:changed', path, event)
}

function startWatching(path: string): void {
  stopWatching(path)
  try {
    const w = watch(path, () => {
      // Editors often save through rename/replace: debounce, then check the file.
      const t = watchTimers.get(path)
      if (t) clearTimeout(t)
      watchTimers.set(
        path,
        setTimeout(async () => {
          watchTimers.delete(path)
          const exists = await fileExists(path)
          // Unwatched while waiting: do not resurrect the watcher.
          if (!watchers.has(path)) return
          if (exists) {
            startWatching(path) // re-arm after atomic replace
            emitWatch(path, 'change')
          } else {
            stopWatching(path)
            emitWatch(path, 'delete')
          }
        }, 150)
      )
    })
    w.on('error', () => stopWatching(path))
    watchers.set(path, w)
  } catch {
    emitWatch(path, 'delete')
  }
}

function stopWatching(path: string): void {
  watchers.get(path)?.close()
  watchers.delete(path)
  const t = watchTimers.get(path)
  if (t) clearTimeout(t)
  watchTimers.delete(path)
}

/** Launch an external editor; resolves once the process started (or failed to). */
function launchEditor(editorPath: string, file: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      // macOS: a picked application is an .app bundle (a folder), started through `open -a`.
      const child =
        process.platform === 'darwin' && editorPath.endsWith('.app')
          ? spawn('open', ['-a', editorPath, file], { detached: true, stdio: 'ignore' })
          : spawn(editorPath, [file], { detached: true, stdio: 'ignore' })
      child.once('error', (e) => resolve({ ok: false, error: e.message }))
      child.once('spawn', () => {
        child.unref()
        resolve({ ok: true })
      })
    } catch (e) {
      resolve({ ok: false, error: (e as Error).message })
    }
  })
}

// ---------------------------------------------------------------
// Window
// ---------------------------------------------------------------

/** Unsaved changes on close / quit (see lifecycle.ts). */
const guard = new CloseGuard()
/** The one document window, and files waiting for it (see lifecycle.ts). */
const files = new FileRouter<BrowserWindow>(createWindow, () => app.isReady())
/** A close request the page must hear: one that can't answer must not keep the window open (see lifecycle.ts). */
const closeWatch = new CloseWatch(() => void closeUnanswered())

/** The page did not hear a close request: offer to close without saving. */
async function closeUnanswered(): Promise<void> {
  const win = files.current
  if (!win) return
  const { response } = await dialog.showMessageBox(win, {
    type: 'warning',
    message: t('closeUnanswered.message'),
    detail: t('closeUnanswered.detail'),
    buttons: [t('closeUnanswered.wait'), t('closeUnanswered.close')],
    defaultId: 0,
    cancelId: 0,
    noLink: true
  })
  // The page may have answered (and closed the window) meanwhile.
  if (response !== 1 || win.isDestroyed()) return
  const { quit } = guard.confirm()
  // Not close(): that waits for the page's unload, which a hung page never runs.
  win.destroy()
  if (quit) app.quit()
}

/** The page crashed: its unsaved changes are gone; offer to reload it. */
async function offerReload(win: BrowserWindow, reason: string): Promise<void> {
  const { response } = await dialog.showMessageBox(win, {
    type: 'error',
    message: t('pageGone.message'),
    detail: t('pageGone.detail', { reason }),
    buttons: [t('pageGone.reload'), t('pageGone.close')],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  })
  if (win.isDestroyed()) return
  if (response === 0) win.reload()
  else win.destroy()
}

/** The window that sent an IPC request (parent of the dialogs it opens). */
function senderWindow(e: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(e.sender)
}

async function createWindow(): Promise<BrowserWindow> {
  const state = await loadWindowState()
  guard.reset()
  const win = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 960,
    minHeight: 620,
    show: false,
    title: 'MkFont', // i18n-ignore: app name; the renderer sets the document's title
    backgroundColor: '#17181b',
    autoHideMenuBar: true,
    // macOS uses the app bundle's icon; elsewhere this also covers dev runs.
    ...(process.platform === 'darwin' ? {} : { icon }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  if (state.maximized) win.maximize()
  trackWindowState(win)

  win.on('ready-to-show', () => win.show())

  win.on('close', (e) => {
    if (!guard.holdClose()) return
    e.preventDefault()
    win.webContents.send('window:closeRequest')
    closeWatch.sent()
  })

  win.on('closed', () => {
    closeWatch.heard()
    files.closed(win)
    for (const p of [...watchers.keys()]) stopWatching(p)
  })

  let reloadOffered = false
  win.webContents.on('render-process-gone', (_e, details) => {
    if (details.reason === 'clean-exit') return
    // The unsaved changes went with the page: closing must not wait for its answer, and
    // files that arrive now wait for the reloaded page.
    guard.reset()
    closeWatch.heard()
    files.pageGone(win)
    // One box at a time, also when the page goes again before it is answered.
    if (reloadOffered) return
    reloadOffered = true
    void offerReload(win, details.reason).finally(() => (reloadOffered = false))
  })

  win.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return win
}

function registerIpc(): void {
  ipcMain.handle('fs:openFiles', async (e, opts: { title?: string; filters: Electron.FileFilter[]; multi?: boolean; binary?: boolean }) => {
    const options: Electron.OpenDialogOptions = {
      title: opts.title,
      defaultPath: await lastDialogDir('open'),
      filters: opts.filters,
      properties: opts.multi ? ['openFile', 'multiSelections'] : ['openFile']
    }
    const parent = senderWindow(e)
    const res = parent ? await dialog.showOpenDialog(parent, options) : await dialog.showOpenDialog(options)
    if (res.canceled) return []
    if (res.filePaths.length) rememberDialogDir('open', dirname(res.filePaths[0]))
    const out = []
    for (const p of res.filePaths) {
      if (opts.binary) {
        const buf = await readFile(p)
        out.push({ path: p, name: basename(p), bytes: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) })
      } else {
        out.push({ path: p, name: basename(p), text: await readFile(p, 'utf-8') })
      }
    }
    return out
  })

  ipcMain.handle('fs:saveDialog', async (e, opts: { title?: string; defaultName?: string; defaultDirs?: string[]; filters: Electron.FileFilter[] }) => {
    // The folders the caller prefers, then the one the last save went to.
    const lastSave = (await loadDialogDirs()).save
    const defaultPath = await dialogDefaultPath(opts.defaultName, [...(opts.defaultDirs ?? []), ...(lastSave ? [lastSave] : [])])
    const options: Electron.SaveDialogOptions = { title: opts.title, defaultPath, filters: opts.filters }
    const parent = senderWindow(e)
    const res = parent ? await dialog.showSaveDialog(parent, options) : await dialog.showSaveDialog(options)
    if (res.canceled || !res.filePath) return null
    rememberDialogDir('save', dirname(res.filePath))
    return res.filePath
  })

  ipcMain.handle('fs:readText', (_e, p: string) => readFile(p, 'utf-8'))
  ipcMain.handle('fs:writeText', (_e, p: string, content: string) => writeFileAtomic(p, content))
  ipcMain.handle('fs:writeBinary', (_e, p: string, data: ArrayBuffer) => writeFileAtomic(p, Buffer.from(data)))
  ipcMain.handle('fs:existingPaths', async (_e, paths: string[]) => {
    const found = await Promise.all(paths.map((p) => access(p).then(() => true, () => false)))
    return paths.filter((_p, i) => found[i])
  })
  ipcMain.handle('fs:firstFolder', (_e, dirs: string[]) => firstFolder(dirs))

  // WOFF2 export: the page has no Brotli encoder of its own.
  ipcMain.handle(
    'compress:brotli',
    (_e, data: ArrayBuffer) =>
      new Promise<Uint8Array>((resolve, reject) => {
        const params = { [zlib.BROTLI_PARAM_MODE]: zlib.BROTLI_MODE_FONT, [zlib.BROTLI_PARAM_QUALITY]: zlib.BROTLI_MAX_QUALITY, [zlib.BROTLI_PARAM_SIZE_HINT]: data.byteLength }
        brotliCompress(Buffer.from(data), { params }, (error, out) => (error ? reject(error) : resolve(out)))
      })
  )

  ipcMain.handle('recent:get', async () => {
    const all = await getRecent()
    const valid: string[] = []
    for (const p of all) if (await fileExists(p)) valid.push(p)
    return valid
  })
  ipcMain.handle('recent:add', (_e, p: string) => addRecent(p))
  ipcMain.handle('recent:remove', (_e, p: string) => removeRecent(p))

  ipcMain.handle('watch:add', (_e, p: string) => startWatching(p))
  ipcMain.handle('watch:remove', (_e, p: string) => stopWatching(p))

  ipcMain.handle('temp:write', async (_e, name: string, content: string) => {
    const dir = join(tmpdir(), 'mkfont')
    await mkdir(dir, { recursive: true })
    const safe = name.replace(/[^a-zA-Z0-9._+-]/g, '_')
    const p = join(dir, safe)
    await writeFile(p, content, 'utf-8')
    return p
  })

  ipcMain.handle('shell:openInEditor', async (_e, p: string, editorPath?: string) => {
    try {
      if (editorPath) return await launchEditor(editorPath, p)
      const err = await shell.openPath(p)
      return err ? { ok: false, error: err } : { ok: true }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  })

  ipcMain.handle('dialog:pickExecutable', async (e, title?: string) => {
    const options: Electron.OpenDialogOptions = {
      title: title ?? t('dialogs.selectApplication'),
      defaultPath: await lastDialogDir('executable'),
      properties: ['openFile'],
      filters: process.platform === 'win32' ? [{ name: t('dialogs.applications'), extensions: ['exe'] }] : []
    }
    const parent = senderWindow(e)
    const res = parent ? await dialog.showOpenDialog(parent, options) : await dialog.showOpenDialog(options)
    if (res.canceled || !res.filePaths.length) return null
    rememberDialogDir('executable', dirname(res.filePaths[0]))
    return res.filePaths[0]
  })

  ipcMain.handle('dialog:pickFolder', async (e, title?: string, defaultPath?: string) => {
    const options: Electron.OpenDialogOptions = {
      title: title ?? t('dialogs.selectFolder'),
      defaultPath: defaultPath ?? (await lastDialogDir('folder')),
      properties: ['openDirectory', 'createDirectory']
    }
    const parent = senderWindow(e)
    const res = parent ? await dialog.showOpenDialog(parent, options) : await dialog.showOpenDialog(options)
    if (res.canceled || !res.filePaths.length) return null
    rememberDialogDir('folder', res.filePaths[0])
    return res.filePaths[0]
  })

  ipcMain.handle('shell:showItemInFolder', (_e, p: string) => shell.showItemInFolder(p))
  ipcMain.handle('shell:openExternal', (_e, url: string) => {
    if (/^https?:\/\//.test(url)) return shell.openExternal(url)
    return undefined
  })

  ipcMain.on('window:setTitle', (_e, title: string) => files.current?.setTitle(title))
  ipcMain.on('window:setDirty', (_e, dirty: boolean) => {
    guard.setDirty(dirty)
    files.current?.setDocumentEdited(dirty)
  })
  ipcMain.on('window:closeHeard', () => closeWatch.heard())
  ipcMain.on('window:confirmClose', () => {
    closeWatch.heard()
    const { quit } = guard.confirm()
    files.current?.close()
    if (quit) app.quit()
  })

  ipcMain.handle('app:getStartupFile', () => files.takeStartupFile())
  ipcMain.handle('app:getVersion', () => app.getVersion())
  // The renderer's language preference, once at start-up and on each change.
  ipcMain.on('app:setLanguage', (_e, lng: unknown) => {
    if (typeof lng === 'string' && setLanguage(lng)) buildMenu()
  })
}

function buildMenu(): void {
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        { role: 'appMenu' },
        { role: 'editMenu' },
        // No zoom / reload accelerators: Cmd+-, Cmd+= and Cmd+R belong to the app.
        {
          label: t('menu.view'),
          submenu: [...(is.dev ? [{ role: 'toggleDevTools' as const }] : []), { role: 'togglefullscreen' as const }]
        },
        { role: 'windowMenu' }
      ])
    )
  } else {
    // The renderer provides its own menu bar.
    Menu.setApplicationMenu(null)
  }
}

// ---------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  const startup = fileFromArgv(process.argv)
  if (startup) files.open(startup)

  app.on('second-instance', (_e, argv) => {
    const f = fileFromArgv(argv)
    if (f) files.open(f)
    else void files.reveal()
  })

  // macOS: Finder "Open", drops on the Dock icon (also before the app is ready).
  app.on('open-file', (e, p) => {
    e.preventDefault()
    files.open(p)
  })

  app.on('before-quit', () => guard.beforeQuit())

  app.whenReady().then(async () => {
    electronApp.setAppUserModelId('com.nebukam.mkfont')
    // Only F12 (dev tools, in development) is intercepted: every other key reaches
    // the page, whose own shortcuts include Ctrl+- and Ctrl+Shift+I.
    app.on('browser-window-created', (_, window) => {
      if (!is.dev) return
      window.webContents.on('before-input-event', (_e, input) => {
        if (input.type !== 'keyDown' || input.code !== 'F12') return
        if (window.webContents.isDevToolsOpened()) window.webContents.closeDevTools()
        else window.webContents.openDevTools({ mode: 'undocked' })
      })
    })
    // The system's language until the window says which one the user picked.
    setLanguage(app.getLocale())
    registerIpc()
    buildMenu()
    await files.ensureWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) void files.ensureWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
