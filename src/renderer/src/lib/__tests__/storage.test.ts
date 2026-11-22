// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { localJSONStorage } from '../storage'

afterEach(() => {
  // The test environment's localStorage keeps the function it was first asked for, so
  // putting Storage.prototype back is not enough: the spy itself has to stop throwing.
  vi.resetAllMocks()
  vi.restoreAllMocks()
})

describe('persisted stores', () => {
  it('keep working in memory when storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is full', 'QuotaExceededError')
    })
    const useThing = create<{ n: number }>()(persist(() => ({ n: 0 }), { name: 'test.full', storage: localJSONStorage() }))
    expect(() => useThing.setState({ n: 1 })).not.toThrow()
    expect(useThing.getState().n).toBe(1)
  })

  it('read back what they wrote', () => {
    const storage = localJSONStorage<{ n: number }>()!
    storage.setItem('test.roundtrip', { state: { n: 2 }, version: 0 })
    expect(storage.getItem('test.roundtrip')).toEqual({ state: { n: 2 }, version: 0 })
    expect(window.localStorage.getItem('test.roundtrip')).toContain('"n":2')
  })
})
