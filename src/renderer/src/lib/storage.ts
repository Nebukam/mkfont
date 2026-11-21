// ============================================================
// Storage for persisted stores.
// ============================================================

import { createJSONStorage, type StateStorage } from 'zustand/middleware'

function localStorageOrNull(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * localStorage, or memory where it is unavailable (private mode, tests). Writes never
 * throw: when storage is full or blocked the value lives on in memory, so a failed
 * write cannot turn a save or an export into an error.
 */
export function localJSONStorage<S>(): ReturnType<typeof createJSONStorage<S>> {
  return createJSONStorage<S>(() => {
    const local = localStorageOrNull()
    // Values written this session: newer than what storage holds when a write failed.
    const mem = new Map<string, string>()
    const storage: StateStorage = {
      getItem: (k) => {
        if (mem.has(k)) return mem.get(k)!
        try {
          return local?.getItem(k) ?? null
        } catch {
          return null
        }
      },
      setItem: (k, v) => {
        mem.set(k, v)
        try {
          local?.setItem(k, v)
        } catch {
          // Full or blocked: kept in memory for this session.
        }
      },
      removeItem: (k) => {
        mem.delete(k)
        try {
          local?.removeItem(k)
        } catch {
          // Blocked: nothing to remove.
        }
      }
    }
    return storage
  })
}
