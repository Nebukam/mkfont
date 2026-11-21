import { contextBridge, ipcRenderer, webFrame, webUtils } from 'electron'
import type { MkFontAPI } from './index.d'

function subscribe<T extends unknown[]>(channel: string, cb: (...args: T) => void): () => void {
  const listener = (_e: Electron.IpcRendererEvent, ...args: unknown[]): void => cb(...(args as T))
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: MkFontAPI = {
  openFiles: (opts) => ipcRenderer.invoke('fs:openFiles', opts),
  saveDialog: (opts) => ipcRenderer.invoke('fs:saveDialog', opts),
  readText: (path) => ipcRenderer.invoke('fs:readText', path),
  writeText: (path, content) => ipcRenderer.invoke('fs:writeText', path, content),
  writeBinary: (path, data) => ipcRenderer.invoke('fs:writeBinary', path, data),
  existingPaths: (paths) => ipcRenderer.invoke('fs:existingPaths', paths),
  firstFolder: (dirs) => ipcRenderer.invoke('fs:firstFolder', dirs),
  brotliCompress: (data) => ipcRenderer.invoke('compress:brotli', data),

  getRecentFiles: () => ipcRenderer.invoke('recent:get'),
  addRecentFile: (path) => ipcRenderer.invoke('recent:add', path),
  removeRecentFile: (path) => ipcRenderer.invoke('recent:remove', path),

  watchFile: (path) => ipcRenderer.invoke('watch:add', path),
  unwatchFile: (path) => ipcRenderer.invoke('watch:remove', path),
  onFileChanged: (cb) => subscribe('watch:changed', cb),

  writeTempFile: (name, content) => ipcRenderer.invoke('temp:write', name, content),
  openInEditor: (path, editorPath) => ipcRenderer.invoke('shell:openInEditor', path, editorPath),
  pickExecutable: (title) => ipcRenderer.invoke('dialog:pickExecutable', title),
  pickFolder: (title, defaultPath) => ipcRenderer.invoke('dialog:pickFolder', title, defaultPath),
  showItemInFolder: (path) => ipcRenderer.invoke('shell:showItemInFolder', path),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  setTitle: (title) => ipcRenderer.send('window:setTitle', title),
  setDirty: (dirty) => ipcRenderer.send('window:setDirty', dirty),
  // Heard at once, before the page asks anything: the main process offers to close a
  // window whose page does not answer (no listener left after a crash, or a hang).
  onCloseRequest: (cb) =>
    subscribe('window:closeRequest', () => {
      ipcRenderer.send('window:closeHeard')
      cb()
    }),
  confirmClose: () => ipcRenderer.send('window:confirmClose'),
  onOpenFile: (cb) => subscribe('app:openFile', cb),
  getStartupFile: () => ipcRenderer.invoke('app:getStartupFile'),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  setZoomFactor: (factor) => webFrame.setZoomFactor(factor),
  setLanguage: (lng) => ipcRenderer.send('app:setLanguage', lng),
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file)
    } catch {
      return ''
    }
  }
}

// Only this narrow API reaches the page: no generic ipcRenderer access.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
