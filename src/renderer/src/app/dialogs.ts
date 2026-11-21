// ============================================================
// Promise-based dialog stack.
// ============================================================

import { create } from 'zustand'
import type { PickedFile } from '../platform'
import type { BatchExportChoice } from './export'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  /** Optional third button (e.g. "Don't save"). */
  altLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export type ConfirmResult = 'confirm' | 'alt' | null

export interface GlyphPickerOptions {
  title?: string
  /** Allow picking several glyphs. */
  multi?: boolean
  /** Keys that cannot be picked (e.g. the host glyph). */
  exclude?: string[]
  confirmLabel?: string
}

export interface DialogMap {
  confirm: { props: ConfirmOptions; result: ConfirmResult }
  'import-svg': { props: { files: PickedFile[] }; result: boolean }
  'import-font': { props: { file: PickedFile; asNew: boolean }; result: boolean }
  'import-mkfont': { props: { file: PickedFile }; result: boolean }
  ligatures: { props: Record<string, never>; result: boolean }
  /** `name`: the file name proposed (no extension); `dir`: the folder proposed, if any. */
  'batch-export': { props: { name: string; dir: string | null }; result: BatchExportChoice | null }
  'glyph-picker': { props: GlyphPickerOptions; result: string[] | null }
  prefs: { props: Record<string, never>; result: void }
  shortcuts: { props: Record<string, never>; result: void }
  about: { props: Record<string, never>; result: void }
  palette: { props: Record<string, never>; result: void }
}

export type DialogKind = keyof DialogMap

export interface OpenDialog<K extends DialogKind = DialogKind> {
  id: number
  kind: K
  props: DialogMap[K]['props']
  resolve: (v: DialogMap[K]['result']) => void
}

interface DialogState {
  stack: OpenDialog[]
  /** Flows that ask and save in turn (closing fonts): see `dialogFlow`. */
  busy: number
  open: <K extends DialogKind>(kind: K, props: DialogMap[K]['props']) => Promise<DialogMap[K]['result']>
  close: (id: number, result: unknown) => void
}

let nextId = 0

export const useDialogs = create<DialogState>()((set, get) => ({
  stack: [],
  busy: 0,
  open: (kind, props) =>
    new Promise((resolve) => {
      const d = { id: ++nextId, kind, props, resolve } as unknown as OpenDialog
      set((s) => ({ stack: [...s.stack, d] }))
    }),
  close: (id, result) => {
    const d = get().stack.find((x) => x.id === id)
    set((s) => ({ stack: s.stack.filter((x) => x.id !== id) }))
    ;(d?.resolve as ((v: unknown) => void) | undefined)?.(result)
  }
}))

export function openDialog<K extends DialogKind>(kind: K, props: DialogMap[K]['props']): Promise<DialogMap[K]['result']> {
  return useDialogs.getState().open(kind, props)
}

export function confirmDialog(opts: ConfirmOptions): Promise<ConfirmResult> {
  return openDialog('confirm', opts)
}

export function pickGlyphs(opts: GlyphPickerOptions = {}): Promise<string[] | null> {
  return openDialog('glyph-picker', opts)
}

/** Each dialog's answer when it is dismissed (Escape, Cancel). */
const DISMISSED: { [K in DialogKind]: DialogMap[K]['result'] } = {
  confirm: null,
  'import-svg': false,
  'import-font': false,
  'import-mkfont': false,
  ligatures: false,
  'batch-export': null,
  'glyph-picker': null,
  prefs: undefined,
  shortcuts: undefined,
  about: undefined,
  palette: undefined
}

/** Close a dialog as if dismissed: one that failed must not leave its caller waiting. */
export function dismissDialog(id: number): void {
  const d = useDialogs.getState().stack.find((x) => x.id === id)
  if (d) useDialogs.getState().close(id, DISMISSED[d.kind])
}

export function isDialogOpen(): boolean {
  return useDialogs.getState().stack.length > 0
}

/**
 * Run `fn` once no dialog is open (now, when none is). A dialog works on the font it
 * was opened for, so a file opened from the system waits instead of switching tabs under it.
 */
export function afterDialogs(fn: () => void): void {
  const idle = (): boolean => !isDialogOpen() && useDialogs.getState().busy === 0
  if (idle()) return fn()
  let done = false
  const off = useDialogs.subscribe(() => {
    if (!idle()) return
    // A prompt can follow right after another: run once none did.
    setTimeout(() => {
      if (done || !idle()) return
      done = true
      off()
      fn()
    }, 0)
  })
}

/**
 * Run a flow that asks and saves in turn (a prompt per unsaved font, a save between two):
 * files opened from the system wait for all of it, not just for the current prompt.
 */
export async function dialogFlow<T>(fn: () => Promise<T>): Promise<T> {
  useDialogs.setState((s) => ({ busy: s.busy + 1 }))
  try {
    return await fn()
  } finally {
    useDialogs.setState((s) => ({ busy: s.busy - 1 }))
  }
}
