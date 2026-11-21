import { afterEach, describe, expect, it, vi } from 'vitest'
import { CloseGuard, CloseWatch, FileRouter, fileFromArgv, type DocWindow } from '../lifecycle'

class FakeWindow implements DocWindow {
  destroyed = false
  minimized = false
  focused = 0
  restored = 0
  sent: [string, unknown[]][] = []
  webContents = { send: (channel: string, ...args: unknown[]): void => void this.sent.push([channel, args]) }
  isDestroyed(): boolean {
    return this.destroyed
  }
  isMinimized(): boolean {
    return this.minimized
  }
  restore(): void {
    this.restored++
    this.minimized = false
  }
  focus(): void {
    this.focused++
  }
}

function setup(ready = true): { router: FileRouter<FakeWindow>; created: FakeWindow[]; setReady: (r: boolean) => void } {
  let appReady = ready
  const created: FakeWindow[] = []
  const router = new FileRouter<FakeWindow>(
    async () => {
      const w = new FakeWindow()
      created.push(w)
      return w
    },
    () => appReady
  )
  return { router, created, setReady: (r) => (appReady = r) }
}

describe('file routing (startup, second instance, macOS open-file)', () => {
  it('keeps a file that arrives before the app is ready for the first window', async () => {
    const { router, created, setReady } = setup(false)
    router.open('/fonts/a.mkfont')
    expect(created.length).toBe(0)
    setReady(true)
    await router.ensureWindow()
    expect(created.length).toBe(1)
    expect(router.takeStartupFile()).toBe('/fonts/a.mkfont')
    expect(router.takeStartupFile()).toBeNull()
  })

  it('opens a window for a file when the app runs without one (macOS)', async () => {
    const { router, created } = setup()
    const first = await router.ensureWindow()
    router.takeStartupFile()
    router.closed(first)
    router.open('/fonts/b.mkfont')
    expect(created.length).toBe(2)
    await router.ensureWindow()
    expect(router.takeStartupFile()).toBe('/fonts/b.mkfont')
  })

  it('holds a file while the page loads, then sends later files straight to it', async () => {
    const { router } = setup()
    const w = await router.ensureWindow()
    router.open('/fonts/early.mkfont')
    expect(w.sent).toEqual([])
    expect(router.takeStartupFile()).toBe('/fonts/early.mkfont')
    w.minimized = true
    router.open('/fonts/later.mkfont')
    expect(w.sent).toEqual([['app:openFile', ['/fonts/later.mkfont']]])
    expect(w.restored).toBe(1)
    expect(w.focused).toBe(1)
  })

  it('never creates two windows at once', async () => {
    const { router, created } = setup()
    const [a, b] = await Promise.all([router.ensureWindow(), router.ensureWindow()])
    expect(a).toBe(b)
    expect(created.length).toBe(1)
  })

  it('brings the window forward for a second instance without a file', async () => {
    const { router } = setup()
    const w = await router.ensureWindow()
    w.minimized = true
    await router.reveal()
    expect(w.restored).toBe(1)
    expect(w.focused).toBe(1)
  })

  it('finds the .mkfont in a command line', () => {
    expect(fileFromArgv(['MkFont.exe', 'C:/fonts/a.mkfont'])).toBe('C:/fonts/a.mkfont')
    expect(fileFromArgv(['electron', '.', '--inspect', 'b.MKFONT'])).toBe('b.MKFONT')
    expect(fileFromArgv(['MkFont.exe', 'notes.txt'])).toBeNull()
  })
})

describe('close guard (unsaved changes on close and quit)', () => {
  it('lets a clean window close', () => {
    expect(new CloseGuard().holdClose()).toBe(false)
  })

  it('holds a dirty close for the prompt, then closes without quitting', () => {
    const g = new CloseGuard()
    g.setDirty(true)
    expect(g.holdClose()).toBe(true)
    expect(g.confirm()).toEqual({ quit: false })
    expect(g.holdClose()).toBe(false)
  })

  it('resumes a quit once the prompt is answered (Cmd+Q)', () => {
    const g = new CloseGuard()
    g.setDirty(true)
    g.beforeQuit()
    expect(g.holdClose()).toBe(true)
    expect(g.confirm()).toEqual({ quit: true })
  })

  it('forgets a quit the user cancelled', () => {
    const g = new CloseGuard()
    g.setDirty(true)
    g.beforeQuit()
    expect(g.holdClose()).toBe(true)
    // Cancel: no confirm. Later the close button is used.
    expect(g.holdClose()).toBe(true)
    expect(g.confirm()).toEqual({ quit: false })
  })

  it('starts clean for a new window', () => {
    const g = new CloseGuard()
    g.setDirty(true)
    g.reset()
    expect(g.holdClose()).toBe(false)
  })
})

describe('close watch (a page that cannot answer a close request)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('offers to close when the page does not hear the request in time', () => {
    vi.useFakeTimers()
    let unanswered = 0
    const w = new CloseWatch(() => unanswered++, 5000)
    w.sent()
    vi.advanceTimersByTime(4999)
    expect(unanswered).toBe(0)
    vi.advanceTimersByTime(1)
    expect(unanswered).toBe(1)
  })

  it('waits for the user once the page heard it (its save prompt can take minutes)', () => {
    vi.useFakeTimers()
    let unanswered = 0
    const w = new CloseWatch(() => unanswered++, 5000)
    w.sent()
    vi.advanceTimersByTime(1000)
    w.heard()
    vi.advanceTimersByTime(60_000)
    expect(unanswered).toBe(0)
  })

  it('keeps the first wait when the close button is pressed again', () => {
    vi.useFakeTimers()
    let unanswered = 0
    const w = new CloseWatch(() => unanswered++, 5000)
    w.sent()
    vi.advanceTimersByTime(3000)
    w.sent()
    vi.advanceTimersByTime(2000)
    expect(unanswered).toBe(1)
    vi.advanceTimersByTime(10_000)
    expect(unanswered).toBe(1)
  })

  it('makes files wait for the page that replaces a crashed one', async () => {
    const { router } = setup()
    const w = await router.ensureWindow()
    router.takeStartupFile()
    router.pageGone(w)
    router.open('/fonts/after-crash.mkfont')
    expect(w.sent).toEqual([])
    // The reloaded page asks for it.
    expect(router.takeStartupFile()).toBe('/fonts/after-crash.mkfont')
  })
})
