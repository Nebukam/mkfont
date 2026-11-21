import { describe, expect, it, vi } from 'vitest'
import { join } from 'path'

// Folders on an offline network drive ("offline…"): their check never answers.
vi.mock('fs/promises', () => ({
  stat: vi.fn((p: string) => (p.startsWith('offline') ? new Promise(() => {}) : Promise.resolve({ isDirectory: () => p !== 'missing' })))
}))

import { stat } from 'fs/promises'
import { dialogDefaultPath } from '../dialog-paths'

const statCalls = (dir: string): number => vi.mocked(stat).mock.calls.filter(([p]) => p === dir).length

describe('save dialog folder', () => {
  it('does not wait long for a folder that never answers', async () => {
    const t0 = Date.now()
    expect(await dialogDefaultPath('font.ttf', ['offline', 'local'], 50)).toBe(join('local', 'font.ttf'))
    expect(Date.now() - t0).toBeLessThan(1000)
  })

  it('keeps the order: an earlier folder wins over a later one', async () => {
    expect(await dialogDefaultPath('font.ttf', ['first', 'second'], 50)).toBe(join('first', 'font.ttf'))
    expect(await dialogDefaultPath('font.ttf', ['missing', 'second'], 50)).toBe(join('second', 'font.ttf'))
  })

  it('checks a folder once per dialog, and leaves one that timed out alone for a while', async () => {
    expect(await dialogDefaultPath('font.ttf', ['same', 'same', 'other'], 50)).toBe(join('same', 'font.ttf'))
    expect(statCalls('same')).toBe(1)
    await dialogDefaultPath('font.ttf', ['offline-share', 'local'], 50)
    const t0 = Date.now()
    expect(await dialogDefaultPath('font.ttf', ['offline-share', 'local'], 50)).toBe(join('local', 'font.ttf'))
    expect(Date.now() - t0).toBeLessThan(40)
    expect(statCalls('offline-share')).toBe(1)
  })
})
