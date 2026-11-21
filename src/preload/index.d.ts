export interface FileFilter {
  name: string
  extensions: string[]
}

export interface NativeFile {
  path: string
  name: string
  /** Text content (text reads). */
  text?: string
  /** Binary content (binary reads). */
  bytes?: ArrayBuffer
}

export interface MkFontAPI {
  /** Show an open dialog and read the chosen file(s). */
  openFiles(opts: { title?: string; filters: FileFilter[]; multi?: boolean; binary?: boolean }): Promise<NativeFile[]>
  /** Show a save dialog; returns the chosen path or null. */
  /** Show a save dialog in the first of `defaultDirs` that exists; returns the chosen path or null. */
  saveDialog(opts: { title?: string; defaultName?: string; defaultDirs?: string[]; filters: FileFilter[] }): Promise<string | null>
  readText(path: string): Promise<string>
  /** Writes are atomic (temp file + rename). */
  writeText(path: string, content: string): Promise<void>
  writeBinary(path: string, data: ArrayBuffer): Promise<void>
  /** Those of `paths` that exist. */
  existingPaths(paths: string[]): Promise<string[]>
  /** The first of `dirs` that is an existing folder, or null. */
  firstFolder(dirs: string[]): Promise<string | null>
  /** Brotli-compress bytes, tuned for fonts (WOFF2 export). */
  brotliCompress(data: ArrayBuffer): Promise<Uint8Array>

  getRecentFiles(): Promise<string[]>
  addRecentFile(path: string): Promise<void>
  removeRecentFile(path: string): Promise<void>

  /** Watch a file for changes; changes arrive through onFileChanged. */
  watchFile(path: string): Promise<void>
  unwatchFile(path: string): Promise<void>
  onFileChanged(cb: (path: string, event: 'change' | 'delete') => void): () => void

  /** Write a file in the app temp folder and return its path. */
  writeTempFile(name: string, content: string): Promise<string>
  /** Open a file with an external editor executable, or the OS default app. */
  openInEditor(path: string, editorPath?: string): Promise<{ ok: boolean; error?: string }>
  /** Pick an executable path. */
  pickExecutable(title?: string): Promise<string | null>
  /** Pick a folder. */
  pickFolder(title?: string, defaultPath?: string): Promise<string | null>
  showItemInFolder(path: string): Promise<void>
  openExternal(url: string): Promise<void>

  setTitle(title: string): void
  setDirty(dirty: boolean): void
  /** Main process asks whether the window may close; reply with confirmClose(). */
  onCloseRequest(cb: () => void): () => void
  confirmClose(): void
  /** Files passed on the command line / opened from the OS. */
  onOpenFile(cb: (path: string) => void): () => void
  getStartupFile(): Promise<string | null>
  getAppVersion(): Promise<string>
  /** Zoom the whole interface (1 = 100%). */
  setZoomFactor(factor: number): void
  /** The interface language ("fr"), for the native menus and dialogs. */
  setLanguage(lng: string): void
  /** Absolute path of a dropped File (Electron webUtils). */
  getPathForFile(file: File): string
}

declare global {
  interface Window {
    api?: MkFontAPI
  }
}
