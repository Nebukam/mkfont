// ============================================================
// Safe file writes for the main process (kept free of Electron for tests).
// ============================================================

import { writeFile, rename, realpath, unlink, stat, chmod, open, type FileHandle } from 'fs/promises'

let tmpSeq = 0

const errorCode = (e: unknown): string | undefined => (e as NodeJS.ErrnoException).code

/** Errors Windows reports while another program (a virus scanner, the indexer) briefly holds a file. */
const BUSY = new Set(['EPERM', 'EACCES', 'EBUSY'])

/** Rename, retrying for up to ~0.8 s where Windows refuses because a file is briefly held open. */
async function renameRetrying(from: string, to: string, retry: boolean): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(from, to)
      return
    } catch (e) {
      if (!retry || attempt >= 5 || !BUSY.has(errorCode(e) ?? '')) throw e
      await new Promise((r) => setTimeout(r, 25 * 2 ** attempt))
    }
  }
}

/**
 * Write through a temp file and rename it over the target, so a failed
 * write (full disk, crash) never leaves a truncated project behind. The data
 * is flushed to the disk before the rename, so a power cut doesn't either.
 * The original's permissions carry over. Only where the folder refuses new
 * files is the file written in place.
 */
export async function writeFileAtomic(p: string, data: string | Buffer): Promise<void> {
  let target = p
  try {
    target = await realpath(p)
  } catch {
    // New file (or a volume without final path names): write next to the path given.
  }
  let mode: number | undefined
  try {
    mode = (await stat(target)).mode
  } catch {
    // New file.
  }
  const tmp = `${target}.${process.pid}-${Date.now().toString(36)}-${++tmpSeq}.tmp`
  try {
    // Flushed to the disk before the rename: the file system can record a rename before
    // the data it points to, and a power cut in between would leave an empty project.
    await writeFile(tmp, data, { flush: true })
  } catch (e) {
    await unlink(tmp).catch(() => undefined)
    // A full disk or quota must leave the existing file untouched: only a folder
    // that refuses new files (the file itself may be writable) is written in place.
    const code = errorCode(e)
    if (code !== 'EACCES' && code !== 'EPERM') throw e
    await writeFile(target, data, { flush: true })
    return
  }
  if (mode !== undefined) await chmod(tmp, mode).catch(() => undefined)
  try {
    // A read-only target fails for good: no point waiting.
    await renameRetrying(tmp, target, process.platform === 'win32' && (mode === undefined || (mode & 0o200) !== 0))
  } catch {
    // Windows refuses to replace a file another program holds open: write in place.
    let handle: FileHandle
    try {
      handle = await open(target, 'r+')
    } catch (e) {
      // Not writable at all (read-only, locked): the original is intact, drop the copy.
      await unlink(tmp).catch(() => undefined)
      throw e
    }
    try {
      await handle.truncate(0)
      await handle.writeFile(data)
      await handle.sync()
    } catch (e) {
      // The original was already cut: the temp copy is now the only complete one.
      throw new Error(`${(e as Error).message}. The new content is in ${tmp}`)
    } finally {
      await handle.close()
    }
    await unlink(tmp).catch(() => undefined)
  }
}
