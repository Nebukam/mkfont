// ============================================================
// Batch import: map files to unicode slots (v1 assign-* widgets).
// ============================================================

import { codePointToKey, resolveString, charsToKey } from './unicode-keys'
import { keysInRange } from './unicode'

export enum AssignMode {
  Filename = 0,
  Selection = 2,
  Block = 3,
  BlockConstrained = 4
}

export enum BlockStart {
  Begin = 0,
  FirstEmpty = 1
}

export enum OverlapMode {
  Overwrite = 0,
  OverwriteEmpty = 1,
  Preserve = 2,
  Ignore = 3
}

/** The overlap modes in the order the import dialog lists them (it names them). */
export const OVERLAP_MODES: readonly OverlapMode[] = [OverlapMode.Overwrite, OverlapMode.OverwriteEmpty, OverlapMode.Preserve, OverlapMode.Ignore]

/**
 * One filename segment → characters. Recognizes `U+XXXX` sequences (v1),
 * AGL names (`uni0041`, `u1F600`) and 4–6 digit hex containing a digit (`00e9`).
 */
export function segmentToChars(seg: string): string {
  const s = seg.trim()
  if (!s) return ''
  const agl = /^uni([0-9a-fA-F]{4})+$/.exec(s)
  if (agl) {
    let out = ''
    for (let i = 3; i < s.length; i += 4) out += String.fromCodePoint(parseInt(s.slice(i, i + 4), 16))
    return out
  }
  const u = /^u([0-9a-fA-F]{4,6})$/.exec(s)
  if (u) {
    const cp = parseInt(u[1], 16)
    if (cp <= 0x10ffff) return String.fromCodePoint(cp)
  }
  if (/^[0-9a-fA-F]{4,6}$/.test(s) && /\d/.test(s)) {
    const cp = parseInt(s, 16)
    if (cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff)) return String.fromCodePoint(cp)
  }
  return resolveString(s)
}

/** v1 AssignFilename._FindUnicodeStructure: strip prefix, join separator segments. */
export function keyFromFilename(fileName: string, prefix: string, separator: string): string | null {
  const base = fileName.replace(/\.[^.]+$/, '')
  let body = base
  if (prefix) {
    const parts = base.split(prefix)
    body = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  }
  const segments = separator ? body.split(separator) : [body]
  const chars = segments.map(segmentToChars).join('')
  if (!chars) return null
  const key = charsToKey(chars)
  return key || null
}

/** Guess a common prefix + separator ("char_0041.svg" → "char", "_"). */
export function detectPrefixSeparator(names: string[]): { prefix: string; separator: string } {
  const bases = names.map((n) => n.replace(/\.[^.]+$/, ''))
  for (const sep of ['_', '-', '.', ' ']) {
    const counts = new Map<string, number>()
    for (const b of bases) {
      const i = b.indexOf(sep)
      if (i > 0) {
        const p = b.slice(0, i)
        counts.set(p, (counts.get(p) ?? 0) + 1)
      }
    }
    let best: [string, number] | null = null
    for (const e of counts) if (!best || e[1] > best[1]) best = e
    if (best && best[1] >= Math.max(2, bases.length * 0.6)) {
      // A shared prefix that itself resolves to a single glyph is probably content, not a prefix.
      if (Array.from(segmentToChars(best[0])).length > 1 || bases.length > 2) return { prefix: best[0], separator: sep }
    }
  }
  return { prefix: '', separator: '_' }
}

export interface AssignContext {
  mode: AssignMode
  prefix: string
  separator: string
  /** Selected keys in selection order (Selection mode). */
  selection: string[]
  /** Block bounds (Block modes). */
  block: { start: number; end: number } | null
  blockStart: BlockStart
  exists: (key: string) => boolean
}

export interface AssignItem {
  name: string
  enabled: boolean
  /** User override ("A", "U+0041", "fi"); empty = automatic. */
  custom: string
}

/** Compute the target key for each item (null = unassigned / out of range). */
export function assignKeys(items: AssignItem[], ctx: AssignContext): (string | null)[] {
  const out: (string | null)[] = []
  let cursor = 0
  let blockKeys: string[] = []
  if ((ctx.mode === AssignMode.Block || ctx.mode === AssignMode.BlockConstrained) && ctx.block) {
    blockKeys = keysInRange(ctx.block.start, ctx.block.end)
    if (ctx.blockStart === BlockStart.FirstEmpty) {
      const first = blockKeys.findIndex((k) => !ctx.exists(k))
      cursor = first === -1 ? blockKeys.length : first
    }
  }
  let overflowCp = ctx.block ? ctx.block.end + 1 : 0

  for (const item of items) {
    if (item.custom.trim()) {
      const key = charsToKey(segmentToChars(item.custom))
      out.push(key || null)
      continue
    }
    if (!item.enabled) {
      out.push(null)
      continue
    }
    switch (ctx.mode) {
      case AssignMode.Filename:
        out.push(keyFromFilename(item.name, ctx.prefix, ctx.separator))
        break
      case AssignMode.Selection:
        out.push(ctx.selection[cursor++] ?? null)
        break
      case AssignMode.Block:
      case AssignMode.BlockConstrained: {
        if (cursor < blockKeys.length) out.push(blockKeys[cursor++])
        else if (ctx.mode === AssignMode.Block && ctx.block) out.push(codePointToKey(overflowCp++))
        else out.push(null)
        break
      }
    }
  }
  return out
}
