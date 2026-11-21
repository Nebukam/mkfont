import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Every writeFile call: where, and with which options. */
const writes: { path: string; options: unknown }[] = []

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>()
  return {
    ...actual,
    writeFile: (path: string, data: string | Buffer, options?: Parameters<typeof actual.writeFile>[2]) => {
      writes.push({ path: String(path), options })
      return actual.writeFile(path, data, options)
    }
  }
})

import { mkdtemp, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFileAtomic } from '../atomic-write'

let dir = ''
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'mkfont-flush-'))
  writes.length = 0
})
afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('atomic project writes on power loss', () => {
  it('flush the new content to the disk before it replaces the project', async () => {
    const p = join(dir, 'font.mkfont')
    await writeFileAtomic(p, 'content')
    expect(await readFile(p, 'utf-8')).toBe('content')
    const temp = writes.find((w) => w.path.endsWith('.tmp'))
    expect(temp?.options).toEqual({ flush: true })
  })
})
