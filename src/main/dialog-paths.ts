// ============================================================
// Where save dialogs open (kept free of Electron for tests).
// ============================================================

import { stat } from 'fs/promises'
import { join } from 'path'

/** A folder that does not answer in time (an offline network drive) counts as missing. */
const CHECK_TIMEOUT_MS = 1000
/** How long a folder that timed out is skipped without asking again. */
const RETRY_AFTER_MS = 60_000

// A stat of an offline share holds one of Node's few file threads until the system gives
// up (often half a minute), shared with every save and read: never run two for a folder,
// and leave a folder that timed out alone for a while.
const running = new Map<string, Promise<boolean>>()
const timedOut = new Map<string, number>()

function statFolder(dir: string): Promise<boolean> {
  let check = running.get(dir)
  if (!check) {
    check = stat(dir)
      .then(
        (s) => {
          timedOut.delete(dir)
          return s.isDirectory()
        },
        () => false
      )
      .finally(() => running.delete(dir))
    running.set(dir, check)
  }
  return check
}

function isFolder(dir: string, timeoutMs: number): Promise<boolean> {
  const since = timedOut.get(dir)
  if (since !== undefined && Date.now() - since < RETRY_AFTER_MS) return Promise.resolve(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => {
      timedOut.set(dir, Date.now())
      resolve(false)
    }, timeoutMs)
  })
  return Promise.race([statFolder(dir), late]).finally(() => clearTimeout(timer))
}

/**
 * The first of `dirs` that is an existing folder, or null. The folders are checked
 * together, so an unreachable one delays the answer by one timeout at most.
 */
export async function firstFolder(dirs: readonly string[], timeoutMs = CHECK_TIMEOUT_MS): Promise<string | null> {
  const unique = [...new Set(dirs)]
  const checks = unique.map((dir) => isFolder(dir, timeoutMs))
  for (let i = 0; i < unique.length; i++) if (await checks[i]) return unique[i]
  return null
}

/**
 * The default path of a save dialog: `name` in the first of `dirs` that is an
 * existing folder (a remembered export folder may have been deleted since),
 * else the bare name, which opens the system's default folder.
 */
export async function dialogDefaultPath(
  name: string | undefined,
  dirs: readonly string[] = [],
  timeoutMs = CHECK_TIMEOUT_MS
): Promise<string | undefined> {
  const dir = await firstFolder(dirs, timeoutMs)
  return dir === null ? name : join(dir, name ?? '')
}

/** The kinds of dialog whose last folder the app remembers. */
export const DIALOG_KINDS = ['open', 'save', 'executable', 'folder'] as const
export type DialogKind = (typeof DIALOG_KINDS)[number]
export type DialogDirs = Partial<Record<DialogKind, string>>

/** What a stored record of last folders holds that can be used: a path for a known kind. */
export function sanitizeDialogDirs(stored: unknown): DialogDirs {
  const out: DialogDirs = {}
  if (stored && typeof stored === 'object') {
    for (const kind of DIALOG_KINDS) {
      const dir = (stored as Record<string, unknown>)[kind]
      if (typeof dir === 'string' && dir) out[kind] = dir
    }
  }
  return out
}
