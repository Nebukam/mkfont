// ============================================================
// Multi-selection values: `undefined` means the selected items differ ("mixed").
// ============================================================

/** The value every item shares, or undefined when they differ. */
export function commonValue<T>(list: readonly T[]): T | undefined {
  return list.length && list.every((x) => x === list[0]) ? list[0] : undefined
}

/** Per-key shared values of several objects (undefined where they differ). */
export function commonValues<T extends object>(list: readonly T[], skip: readonly (keyof T)[] = []): { [K in keyof T]?: T[K] } {
  const out: { [K in keyof T]?: T[K] } = {}
  if (!list.length) return out
  for (const k of Object.keys(list[0]) as (keyof T)[]) {
    if (!skip.includes(k)) out[k] = commonValue(list.map((x) => x[k]))
  }
  return out
}
