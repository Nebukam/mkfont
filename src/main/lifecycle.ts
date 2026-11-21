// ============================================================
// Window and document lifecycle decisions of the main process.
//
// Kept free of Electron so they can be unit-tested: they matter most on
// macOS, where the app keeps running without windows and receives files
// through 'open-file' (also before it is ready), and Cmd+Q must wait for
// the unsaved-changes prompt.
// ============================================================

import { extname } from 'path'

/** What the lifecycle needs from a window (BrowserWindow fits). */
export interface DocWindow {
  isDestroyed(): boolean
  isMinimized(): boolean
  restore(): void
  focus(): void
  webContents: { send(channel: string, ...args: unknown[]): void }
}

/** The .mkfont path in a command line, if any (flags and the app path are skipped). */
export function fileFromArgv(argv: readonly string[]): string | null {
  return argv.slice(1).find((a) => !a.startsWith('-') && extname(a).toLowerCase() === '.mkfont') ?? null
}

/**
 * Opens .mkfont files in the window. A file that arrives before the page listens
 * (startup, a window still loading, or no window at all) waits until the page asks
 * for it; when the app has no window, one is created for it.
 */
export class FileRouter<W extends DocWindow> {
  private window: W | null = null
  private creating: Promise<W> | null = null
  private rendererReady = false
  private pending: string | null = null

  constructor(
    private readonly createWindow: () => Promise<W>,
    private readonly appReady: () => boolean
  ) {}

  /** The live window, if any. */
  get current(): W | null {
    return this.window && !this.window.isDestroyed() ? this.window : null
  }

  /** The window, created when there is none (never two at once). */
  ensureWindow(): Promise<W> {
    const live = this.current
    if (live) return Promise.resolve(live)
    if (!this.creating) {
      this.rendererReady = false
      this.creating = this.createWindow().then(
        (w) => {
          this.window = w
          this.creating = null
          return w
        },
        (e: unknown) => {
          this.creating = null
          throw e
        }
      )
    }
    return this.creating
  }

  /** A file from the command line, a second instance, or Finder / the Dock. */
  open(path: string): void {
    const w = this.current
    if (w && this.rendererReady) {
      if (w.isMinimized()) w.restore()
      w.focus()
      w.webContents.send('app:openFile', path)
      return
    }
    this.pending = path
    if (this.appReady()) void this.ensureWindow()
  }

  /** The page subscribed to app:openFile and asks for a file to start with. */
  takeStartupFile(): string | null {
    this.rendererReady = true
    const f = this.pending
    this.pending = null
    return f
  }

  /** A window closed. */
  closed(w: W): void {
    if (this.window !== w) return
    this.window = null
    this.rendererReady = false
  }

  /** The window's page went away (it crashed): files wait until the reloaded page asks for them. */
  pageGone(w: W): void {
    if (this.window === w) this.rendererReady = false
  }

  /** Bring the window forward (a second instance started without a file). */
  async reveal(): Promise<void> {
    const w = await this.ensureWindow()
    if (w.isMinimized()) w.restore()
    w.focus()
  }
}

/**
 * Waits for the page to hear a close request. A page that cannot answer (it crashed, it
 * hangs, or its interface failed) would otherwise keep a window with unsaved changes open
 * for good: past the delay, `onUnanswered` offers to close without saving.
 */
export class CloseWatch {
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private readonly onUnanswered: () => void,
    private readonly delay = 5000
  ) {}

  /** A close request went to the page (a second one while waiting keeps the first wait). */
  sent(): void {
    if (this.timer) return
    this.timer = setTimeout(() => {
      this.timer = null
      this.onUnanswered()
    }, this.delay)
  }

  /** The page heard it (it asks about unsaved changes, or closes), or the window is gone. */
  heard(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }
}

/** Unsaved changes when closing the window or quitting the app. */
export class CloseGuard {
  private dirty = false
  private allowClose = false
  private quitting = false
  private quitAfterClose = false

  setDirty(dirty: boolean): void {
    this.dirty = dirty
  }

  /** A new window starts clean (its page reports its state again). */
  reset(): void {
    this.dirty = false
    this.allowClose = false
  }

  /** The app is about to quit (Cmd+Q, menu, OS). */
  beforeQuit(): void {
    this.quitting = true
  }

  /**
   * On the window's 'close': true when the close must wait for the page's save
   * prompt. A quit in progress resumes once the prompt is answered.
   */
  holdClose(): boolean {
    if (!this.dirty || this.allowClose) return false
    this.quitAfterClose = this.quitting
    this.quitting = false
    return true
  }

  /** The prompt was answered with Save or Don't save: close now, and quit if that was the request. */
  confirm(): { quit: boolean } {
    this.allowClose = true
    const quit = this.quitAfterClose
    this.quitAfterClose = false
    return { quit }
  }
}
