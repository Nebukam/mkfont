// ============================================================
// Keyboard cursor of the glyph grid.
// ============================================================

/**
 * Where the cursor goes when its glyph leaves the list (deleted from "My glyphs"):
 * the first glyph after it in the old list that is still listed, else the nearest
 * one before it. `index` is the cursor's position in `before`.
 */
export function neighbourAfterRemoval(before: readonly string[], index: number, after: readonly string[]): string | null {
  if (!after.length) return null
  const kept = new Set(after)
  for (let i = index + 1; i < before.length; i++) if (kept.has(before[i])) return before[i]
  for (let i = Math.min(index, before.length) - 1; i >= 0; i--) if (kept.has(before[i])) return before[i]
  return after[0]
}
