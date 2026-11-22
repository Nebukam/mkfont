import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { dialogDefaultPath, sanitizeDialogDirs } from '../dialog-paths'

let dir = ''
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'mkfont-dialog-'))
})
afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('save dialog folder', () => {
  it('opens in the first folder that still exists', async () => {
    const file = join(dir, 'not-a-folder.txt')
    await writeFile(file, '')
    expect(await dialogDefaultPath('font.ttf', [join(dir, 'deleted'), file, dir])).toBe(join(dir, 'font.ttf'))
  })

  it('falls back to the bare name (the system folder) when none exists', async () => {
    expect(await dialogDefaultPath('font.ttf', [join(dir, 'gone')])).toBe('font.ttf')
    expect(await dialogDefaultPath('font.ttf')).toBe('font.ttf')
  })
})

describe('remembered dialog folders', () => {
  it('keeps the paths of the kinds it knows, and nothing else', () => {
    expect(sanitizeDialogDirs({ open: 'D:/fonts', save: '', folder: 3, other: 'x' })).toEqual({ open: 'D:/fonts' })
  })

  it('reads a damaged record as empty', () => {
    for (const stored of [null, undefined, 'text', 12, []]) expect(sanitizeDialogDirs(stored)).toEqual({})
  })
})
