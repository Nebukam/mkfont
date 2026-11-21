import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { chmod, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFileAtomic } from '../atomic-write'

let dir = ''
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'mkfont-atomic-'))
})
afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

const leftovers = async (): Promise<string[]> => (await readdir(dir)).filter((f) => f.endsWith('.tmp'))

describe('atomic project writes', () => {
  it('creates a new file', async () => {
    const p = join(dir, 'new.mkfont')
    await writeFileAtomic(p, '{"a":1}')
    expect(await readFile(p, 'utf-8')).toBe('{"a":1}')
    expect(await leftovers()).toEqual([])
  })

  it('replaces an existing file without leaving temp files', async () => {
    const p = join(dir, 'font.mkfont')
    await writeFile(p, 'old')
    await writeFileAtomic(p, 'new content')
    expect(await readFile(p, 'utf-8')).toBe('new content')
    expect(await leftovers()).toEqual([])
  })

  it('keeps a read-only project intact and leaves no copy (Windows), or replaces it like POSIX editors do', async () => {
    const p = join(dir, 'locked.mkfont')
    await writeFile(p, 'original')
    await chmod(p, 0o444)
    try {
      if (process.platform === 'win32') {
        await expect(writeFileAtomic(p, 'new')).rejects.toThrow()
        expect(await readFile(p, 'utf-8')).toBe('original')
      } else {
        await writeFileAtomic(p, 'new')
        expect(await readFile(p, 'utf-8')).toBe('new')
      }
      expect(await leftovers()).toEqual([])
    } finally {
      await chmod(p, 0o644).catch(() => undefined)
    }
  })

  it('handles saves of the same file started at the same moment', async () => {
    const p = join(dir, 'race.mkfont')
    await writeFile(p, 'old')
    const a = 'a'.repeat(200_000)
    const b = 'b'.repeat(200_000)
    await Promise.all([writeFileAtomic(p, a), writeFileAtomic(p, b), writeFileAtomic(p, a)])
    expect([a, b]).toContain(await readFile(p, 'utf-8'))
    expect(await leftovers()).toEqual([])
  })

  it.skipIf(process.platform === 'win32')('keeps the file permissions (POSIX)', async () => {
    const p = join(dir, 'mode.mkfont')
    await writeFile(p, 'old')
    await chmod(p, 0o600)
    await writeFileAtomic(p, 'new')
    expect((await stat(p)).mode & 0o777).toBe(0o600)
  })
})
