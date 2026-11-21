// ============================================================
// Command registry — one source of truth for menus, shortcuts,
// context menus and the command palette (and the shortcuts dialog).
// ============================================================

import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  ArrowRight,
  BookType,
  ClipboardPaste,
  Component,
  Copy,
  Download,
  FilePlus2,
  Files,
  FoldHorizontal,
  FolderOpen,
  History,
  Keyboard,
  LayoutGrid,
  Ligature,
  PackageOpen,
  Palette,
  PenTool,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Settings,
  Trash2,
  Type,
  Undo2,
  Upload,
  Wand2,
  X
} from 'lucide-react'
import { useDocStore } from '../stores/doc-store'
import { usePairSelectionStore, useSelectionStore, selectedKeys, type SelectionStore } from '../stores/selection-store'
import { canGoBack, canGoForward, isPairRange, selectionFor, useUIStore } from '../stores/ui-store'
import { addPair, copyPairs, removePairs } from './kerning'
import { cycleSession, useWorkspace } from '../stores/workspace'
import { usePrefsStore, scaleUi, zoomCells } from '../stores/prefs-store'
import { closeFont, newFont, openFontDialog, save, saveAs } from './document'
import { batchExport, exportFontFile } from './export'
import { copySelection, paste, pasteInPlace, pasteTransforms } from './clipboard'
import {
  bootstrapKeys,
  copyCharacters,
  copyHex,
  createLigature,
  createMissing,
  deleteKeys,
  resetKeys,
  restorePreset,
  storePreset,
  viewKeys
} from './actions'
import { importFontFileFlow, importMkfontFlow, importSvgFlow, newFontFromSvgsFlow } from './imports'
import { editInExternalEditor } from './bindings'
import { openOutlineEditor } from './outline'
import { isDialogOpen, openDialog } from './dialogs'
import { checkForUpdates } from './updates'
import { isElectron, isMac } from '../platform'
import { commitFieldEdit, isFocusParked, isTextField, unparkFocus } from '../components/ui/focus'
import { msg, t, tm, type MessageKey } from '../i18n'

/** Command groups, in menu bar order. Ids: their names are `groupLabel(group)`. */
export const COMMAND_GROUPS = ['File', 'Edit', 'Select', 'Glyph', 'View', 'Help'] as const // i18n-ignore: group ids
export type CommandGroup = (typeof COMMAND_GROUPS)[number]

export interface Command {
  id: string
  /** The command's name in the app's language (`commands.<id>` in the catalog), read when shown. */
  readonly label: string
  /** Display + match spec, e.g. "Ctrl+Shift+S". Several specs separated by " / ". */
  shortcut?: string
  icon?: LucideIcon
  group: CommandGroup
  run: () => void | Promise<void>
  enabled?: () => boolean
  /** Fire even while typing in a text field. */
  global?: boolean
  /** Hide from the command palette. */
  hidden?: boolean
  /**
   * Its single key acts from the glyph grid (or the page) only, not from what the mouse
   * focused: Enter on a button that was just clicked presses that button.
   */
  gridOnly?: boolean
}

/** A command as listed in the registry: no label (it comes from the catalog), no group (its section's). */
type CommandDef = Omit<Command, 'label' | 'group'>

/**
 * A command's name in the app's language: `commands.<id>`, nested at the id's dots; the
 * selection slots (preset.<kind>.<slot>) share one message per kind. Keys built from ids:
 * the command-labels test checks them, the types cannot.
 */
export function commandLabel(id: string): string {
  const preset = /^preset\.(restore|store|append)\.(\d)$/.exec(id)
  if (preset) return tm(msg(`commands.preset.${preset[1]}` as MessageKey, { slot: preset[2] }))
  return tm(msg(`commands.${id}` as MessageKey))
}

/** A command group's name in the app's language ("File"). */
export function groupLabel(group: CommandGroup): string {
  return t(`commands.groups.${group}`)
}

/** A command's tooltip: its name and first shortcut, "Undo (Ctrl+Z)", or its name alone. */
export function commandTip(id: string): string {
  const label = commandLabel(id)
  const shortcut = shortcutLabel(id)
  return shortcut ? t('commands.withShortcut', { label, shortcut }) : label
}

const hasDoc = (): boolean => !!useDocStore.getState().data

/** Runs `fn` once a field being typed in has committed its text, so the text is included. */
const withFieldCommitted =
  (fn: () => unknown): (() => void) =>
  () => {
    commitFieldEdit()
    void fn()
  }
/** The view lists kerning pairs: it selects pairs, and glyph commands do not apply. */
const pairView = (): boolean => isPairRange(useUIStore.getState().range)
const glyphView = (): boolean => !pairView()
/** The selection of the view shown: pairs in the pair views, glyphs elsewhere. */
const viewSelection = (): SelectionStore => selectionFor(useUIStore.getState().range)
const hasSelection = (): boolean => hasDoc() && viewSelection().getState().keys.length > 0
const hasGlyphSelection = (): boolean => hasDoc() && glyphView() && useSelectionStore.getState().keys.length > 0
const hasExistingSelection = (): boolean => {
  const g = useDocStore.getState().data?.glyphs
  return !!g && glyphView() && useSelectionStore.getState().keys.some((k) => g.has(k))
}
const hasExistingPairs = (): boolean => {
  const k = useDocStore.getState().data?.kerning
  return !!k && pairView() && usePairSelectionStore.getState().keys.some((p) => k.has(p))
}
const sel = selectedKeys
const pairSel = (): string[] => usePairSelectionStore.getState().keys
const active = (): string | null => useSelectionStore.getState().active

function focusSearch(): void {
  const el = document.getElementById('glyph-search') as HTMLInputElement | null
  el?.focus()
  el?.select()
}

/** Back / Forward: show a step's range, search and selection again (v1 navigation undo / redo). */
function navigate(dir: 'back' | 'forward'): void {
  // The mouse's side buttons leave focus in a field being typed in: its text goes into the
  // glyphs it was typed for, before the step shows others.
  commitFieldEdit()
  const ui = useUIStore.getState()
  const entry = dir === 'back' ? ui.goBack() : ui.goForward()
  if (!entry) return
  // The pair views show the step's pairs.
  if (isPairRange(entry.range)) {
    if (entry.pairActive) useUIStore.getState().reveal(entry.pairActive)
    return
  }
  if (!entry.active) return
  // "Existing only" would hide a step's glyph that is not in the font (a jump turns it off
  // too). "My glyphs" and "Ligatures" never show such a glyph: leave the filter alone there.
  const glyphs = useDocStore.getState().data?.glyphs
  const listsMissing = entry.range.kind !== 'glyphs' && entry.range.kind !== 'ligatures'
  if (listsMissing && glyphs && !glyphs.has(entry.active) && useUIStore.getState().searchExists) useUIStore.getState().toggleSearchExists()
  useUIStore.getState().reveal(entry.active)
}

const cellZoom = zoomCells

/** The commands of one group. */
const inGroup = (group: CommandGroup, defs: CommandDef[]): (CommandDef & { group: CommandGroup })[] => defs.map((d) => ({ ...d, group }))

const DEFS = [
  // i18n-ignore: group id
  ...inGroup('File', [
    { id: 'file.new', shortcut: 'Ctrl+N', icon: FilePlus2, run: newFont, global: true },
    { id: 'file.open', shortcut: 'Ctrl+O', icon: FolderOpen, run: openFontDialog, global: true },
    // Text still being typed in a field (Ctrl+S from the field) goes into the save.
    { id: 'file.save', shortcut: 'Ctrl+S', icon: Save, run: withFieldCommitted(save), enabled: hasDoc, global: true },
    { id: 'file.saveAs', shortcut: 'Ctrl+Shift+S', run: withFieldCommitted(saveAs), enabled: hasDoc, global: true },
    { id: 'file.importSvg', shortcut: 'Ctrl+I', icon: Download, run: () => importSvgFlow(), enabled: hasDoc },
    { id: 'file.importFont', icon: Download, run: () => importFontFileFlow(false), enabled: hasDoc },
    { id: 'file.importMkfont', icon: PackageOpen, run: importMkfontFlow, enabled: hasDoc },
    { id: 'file.newFromFont', run: () => importFontFileFlow(true) },
    { id: 'file.newFromSvgs', run: newFontFromSvgsFlow },
    { id: 'file.export', shortcut: 'Ctrl+E', icon: Upload, run: withFieldCommitted(() => exportFontFile()), enabled: hasDoc, global: true },
    { id: 'file.exportTtf', run: withFieldCommitted(() => exportFontFile('ttf')), enabled: hasDoc },
    { id: 'file.exportOtf', run: withFieldCommitted(() => exportFontFile('otf')), enabled: hasDoc },
    { id: 'file.exportWoff', run: withFieldCommitted(() => exportFontFile('woff')), enabled: hasDoc },
    { id: 'file.exportWoff2', run: withFieldCommitted(() => exportFontFile('woff2')), enabled: hasDoc },
    { id: 'file.exportBatch', icon: Files, run: withFieldCommitted(() => batchExport()), enabled: hasDoc },
    { id: 'file.close', shortcut: 'Ctrl+W', icon: X, run: () => void closeFont(), enabled: hasDoc },
    { id: 'app.prefs', shortcut: 'Ctrl+,', icon: Settings, run: () => void openDialog('prefs', {}), global: true }
  ]),

  // i18n-ignore: group id
  ...inGroup('Edit', [
    { id: 'edit.undo', shortcut: 'Ctrl+Z', icon: Undo2, run: () => useDocStore.getState().undo(), enabled: () => useDocStore.getState().cursor > 0 },
    {
      id: 'edit.redo',
      shortcut: 'Ctrl+Y / Ctrl+Shift+Z',
      icon: Redo2,
      run: () => useDocStore.getState().redo(),
      enabled: () => useDocStore.getState().cursor < useDocStore.getState().history.length
    },
    { id: 'edit.copy', shortcut: 'Ctrl+C', icon: Copy, run: copySelection, enabled: hasExistingSelection },
    { id: 'edit.paste', shortcut: 'Ctrl+V', icon: ClipboardPaste, run: paste, enabled: () => hasDoc() && glyphView() },
    { id: 'edit.pasteInPlace', shortcut: 'Ctrl+Shift+V', run: pasteInPlace, enabled: () => hasDoc() && glyphView() },
    { id: 'edit.pasteTransforms', shortcut: 'Ctrl+Alt+V / Ctrl+T', run: pasteTransforms, enabled: hasExistingSelection },
    // Deletes the selected glyphs, or removes the selected pairs in the pair views.
    {
      id: 'edit.delete',
      shortcut: 'Delete / Backspace', // i18n-ignore: shortcut spec (key names), shown through formatShortcut
      icon: Trash2,
      run: () => (pairView() ? removePairs(pairSel()) : deleteKeys()),
      enabled: () => (pairView() ? hasExistingPairs() : hasExistingSelection())
    }
  ]),

  // i18n-ignore: group id
  ...inGroup('Select', [
    {
      id: 'select.all',
      shortcut: 'Ctrl+A',
      run: () => viewSelection().getState().setSelection(viewKeys(), viewSelection().getState().active),
      enabled: hasDoc
    },
    { id: 'select.none', shortcut: 'Ctrl+D / Escape', run: () => viewSelection().getState().clear(), enabled: hasSelection },
    {
      id: 'select.invert',
      shortcut: 'Ctrl+Shift+I',
      run: () => {
        const s = new Set(viewSelection().getState().keys)
        viewSelection().getState().setSelection(viewKeys().filter((k) => !s.has(k)))
      },
      enabled: hasDoc
    },
    {
      id: 'select.existing',
      run: () => {
        const g = useDocStore.getState().data?.glyphs
        if (g) useSelectionStore.getState().retain((k) => g.has(k))
      },
      enabled: hasGlyphSelection
    }
  ]),

  // i18n-ignore: group id
  ...inGroup('Glyph', [
    { id: 'glyph.create', shortcut: 'Ctrl+Shift+N', icon: Plus, run: () => createMissing(), enabled: hasGlyphSelection },
    { id: 'glyph.reset', icon: RotateCcw, run: () => resetKeys(), enabled: hasGlyphSelection },
    { id: 'glyph.resetKeep', run: () => resetKeys(sel(), { keepLayers: true }), enabled: hasGlyphSelection },
    { id: 'glyph.compose', shortcut: 'Ctrl+K', icon: Component, run: () => bootstrapKeys(), enabled: hasGlyphSelection },
    { id: 'glyph.ligature', shortcut: 'Ctrl+L', icon: Ligature, run: () => createLigature(), enabled: () => glyphView() && sel().length > 1 },
    { id: 'glyph.ligatureComp', shortcut: 'Ctrl+Shift+L', run: () => createLigature(sel(), true), enabled: () => glyphView() && sel().length > 1 },
    {
      id: 'glyph.kern',
      icon: FoldHorizontal,
      run: () => {
        const [left, right] = sel()
        addPair(left, right)
      },
      enabled: () => hasDoc() && glyphView() && sel().length === 2
    },
    { id: 'glyph.ligatureFinder', icon: Ligature, run: () => void openDialog('ligatures', {}), enabled: hasDoc },
    {
      id: 'glyph.editOutline',
      shortcut: 'Enter', // i18n-ignore: shortcut spec (key name), shown through formatShortcut
      icon: PenTool,
      run: () => openOutlineEditor(),
      enabled: () => {
        const k = active()
        return !!k && glyphView() && !!useDocStore.getState().data?.glyphs.has(k)
      },
      gridOnly: true
    },
    {
      id: 'glyph.editExternal',
      shortcut: 'Ctrl+Shift+E',
      run: () => {
        const k = active()
        if (k) void editInExternalEditor(k)
      },
      enabled: () => isElectron && hasExistingSelection()
    },
    { id: 'glyph.copyChars', run: () => (pairView() ? copyPairs(pairSel()) : copyCharacters(sel())), enabled: hasSelection },
    { id: 'glyph.copyHex', run: () => (pairView() ? copyPairs(pairSel(), true) : copyHex(sel())), enabled: hasSelection }
  ]),

  // i18n-ignore: group id
  ...inGroup('View', [
    { id: 'view.search', shortcut: 'Ctrl+F / Ctrl+G', icon: Search, run: focusSearch, enabled: hasDoc, global: true },
    { id: 'view.palette', shortcut: 'Ctrl+P / Ctrl+Shift+P', run: () => void openDialog('palette', {}), global: true },
    { id: 'view.back', shortcut: 'Alt+ArrowLeft', icon: ArrowLeft, run: () => navigate('back'), enabled: canGoBack },
    { id: 'view.forward', shortcut: 'Alt+ArrowRight', icon: ArrowRight, run: () => navigate('forward'), enabled: canGoForward },
    { id: 'view.nextTab', shortcut: 'Ctrl+Tab', run: () => cycleSession(1), enabled: () => useWorkspace.getState().sessions.length > 1, global: true },
    { id: 'view.prevTab', shortcut: 'Ctrl+Shift+Tab', run: () => cycleSession(-1), enabled: () => useWorkspace.getState().sessions.length > 1, global: true },
    { id: 'view.left', shortcut: 'Ctrl+B', run: () => useUIStore.getState().toggleLeft() },
    { id: 'view.right', shortcut: 'Ctrl+Alt+B', run: () => useUIStore.getState().toggleRight() },
    { id: 'view.panel.browse', shortcut: 'Alt+1', icon: LayoutGrid, run: () => useUIStore.getState().showLeftTab('browse'), enabled: hasDoc },
    { id: 'view.panel.preview', shortcut: 'Alt+2', icon: Type, run: () => useUIStore.getState().showLeftTab('preview'), enabled: hasDoc },
    { id: 'view.panel.history', shortcut: 'Alt+3', icon: History, run: () => useUIStore.getState().showLeftTab('history'), enabled: hasDoc },
    { id: 'view.panel.font', shortcut: 'Alt+4', icon: BookType, run: () => useUIStore.getState().showLeftTab('font'), enabled: hasDoc },
    { id: 'view.kerning', icon: FoldHorizontal, run: () => useUIStore.getState().setRange({ kind: 'kerning' }), enabled: hasDoc },
    { id: 'view.commonPairs', run: () => useUIStore.getState().setRange({ kind: 'common', group: 'all' }), enabled: hasDoc },
    { id: 'view.detected', icon: Wand2, run: () => useUIStore.getState().setRange({ kind: 'detected' }), enabled: hasDoc },
    { id: 'view.zoomIn', shortcut: 'Ctrl+=', run: () => cellZoom(16) },
    { id: 'view.zoomOut', shortcut: 'Ctrl+-', run: () => cellZoom(-16) },
    // Desktop app only: in a browser, its own zoom keys (Ctrl+Shift+= / -) stay free.
    ...(isElectron
      ? ([
          { id: 'view.uiBigger', shortcut: 'Ctrl+Shift+=', run: () => scaleUi(1) },
          { id: 'view.uiSmaller', shortcut: 'Ctrl+Shift+-', run: () => scaleUi(-1) },
          { id: 'view.uiReset', shortcut: 'Ctrl+Shift+0', run: () => scaleUi(0) }
        ] satisfies CommandDef[])
      : []),
    {
      id: 'view.theme',
      icon: Palette,
      run: () => {
        const p = usePrefsStore.getState()
        const current = p.theme === 'system' ? document.documentElement.dataset.theme : p.theme
        p.set('theme', current === 'light' ? 'dark' : 'light')
      }
    }
  ]),

  // i18n-ignore: group id
  ...inGroup('Help', [
    { id: 'help.shortcuts', shortcut: 'F1', icon: Keyboard, run: () => void openDialog('shortcuts', {}), global: true },
    { id: 'help.updates', run: () => checkForUpdates(true) },
    { id: 'help.about', run: () => void openDialog('about', {}) }
  ])
]

// Selection presets: 0-9 restore, Ctrl+N store, Shift+N append (v1).
for (let i = 0; i < 10; i++) {
  DEFS.push(
    // i18n-ignore: group id
    ...inGroup('Select', [
      // Presets hold glyphs: the pair views leave them alone.
      { id: `preset.restore.${i}`, shortcut: `${i}`, run: () => restorePreset(i, false), enabled: () => hasDoc() && glyphView(), hidden: true },
      { id: `preset.store.${i}`, shortcut: `Ctrl+${i}`, run: () => storePreset(i), enabled: () => hasDoc() && glyphView(), hidden: true },
      { id: `preset.append.${i}`, shortcut: `Shift+${i}`, run: () => restorePreset(i, true), enabled: () => hasDoc() && glyphView(), hidden: true }
    ])
  )
}

/** The commands, each with a `label` getter: read when shown, it follows the language. */
export const COMMANDS: Command[] = DEFS.map((def) => Object.defineProperty(def, 'label', { get: () => commandLabel(def.id), enumerable: true }) as Command)

export const commandById = new Map(COMMANDS.map((c) => [c.id, c]))

export function runCommand(id: string): void {
  const c = commandById.get(id)
  if (!c || (c.enabled && !c.enabled())) return
  void c.run()
}

export function isEnabled(id: string): boolean {
  const c = commandById.get(id)
  return !!c && (!c.enabled || c.enabled())
}

const ARROWS: Record<string, string> = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' }
const MAC_MODIFIERS: Record<string, string> = { Shift: '⇧', Alt: '⌥' }

/** A key of a shortcut spec as shown: arrows as symbols, names from the catalog ("Ctrl", "Delete"), others as they are. */
const keyName = (key: string): string => ARROWS[key] ?? tm(msg(`help.keys.${key}` as MessageKey, { defaultValue: key }))

/**
 * One shortcut spec for display: "Ctrl+Shift+S" in the app's language's key names, or
 * "⌘⇧S" on macOS (Ctrl+Tab is the Control key there: "⌃Tab").
 */
export function formatShortcut(spec: string): string {
  const parts = spec.split('+')
  const key = parts.pop()!
  if (!isMac) return [...parts, key].map(keyName).join('+')
  const mods = parts.map((m) => (m === 'Ctrl' ? (key === 'Tab' ? '⌃' : '⌘') : (MAC_MODIFIERS[m] ?? keyName(m))))
  return mods.join('') + keyName(key)
}

/** A command's first shortcut, formatted for display. */
export function shortcutLabel(id: string): string | undefined {
  const s = commandById.get(id)?.shortcut
  return s ? formatShortcut(s.split(' / ')[0]) : undefined
}

// ---- Keyboard dispatch ----

/**
 * A key event as a shortcut spec ("Ctrl+Shift+S"). On macOS "Ctrl" is the Command key:
 * the Control key edits text there (Control+E, N, P…) and matches no command, except
 * Control+Tab, which switches fonts as it switches browser tabs.
 */
export function eventSpec(e: Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'key' | 'code'>, mac = isMac): string {
  const parts: string[] = []
  const ctrl = mac ? e.metaKey || (e.ctrlKey && e.key === 'Tab') : e.ctrlKey || e.metaKey
  if (ctrl) parts.push('Ctrl') // i18n-ignore: spec key names are ids, matched not shown
  // macOS: Control on its own, or with Command (⌃⌘F is full screen), matches no command.
  if (mac && e.ctrlKey && e.key !== 'Tab') parts.push('Control') // i18n-ignore: spec key name
  if (e.altKey) parts.push('Alt') // i18n-ignore: spec key name
  if (e.shiftKey) parts.push('Shift') // i18n-ignore: spec key name
  let key = e.key
  // macOS: Option turns letters into other characters (⌥B types ∫); the shortcut is still B.
  if (mac && e.altKey && /^Key[A-Z]$/.test(e.code)) key = e.code.slice(3)
  else if (/^Digit[0-9]$/.test(e.code)) key = e.code.slice(5)
  else if (/^Numpad[0-9]$/.test(e.code)) key = e.code.slice(6)
  else if (key === '+' || (key === '=' && e.code === 'Equal')) key = '='
  else if (key === '_') key = '-'
  else if (key.length === 1) key = key.toUpperCase()
  else if (key === 'Del') key = 'Delete' // i18n-ignore: spec key name
  parts.push(key)
  return parts.join('+')
}

const specMap = new Map<string, Command>()
for (const c of COMMANDS) {
  for (const spec of c.shortcut?.split(' / ') ?? []) specMap.set(spec, c)
}

/** True when keys go to a text field (selects, checkboxes and buttons don't count). */
const isTyping = (target: EventTarget | null): boolean => isTextField(target as Element | null)

/**
 * Single keys act on the glyphs from the grid, when nothing in particular has focus, or
 * from what the mouse just focused (Escape after clicking a toolbar button or the text
 * preview). Of what the mouse focused, only a button takes Delete and Backspace: after a
 * click into the text preview or on a slider they are an editing reflex, not a request
 * to delete glyphs. A control reached with the keyboard keeps single keys, and so does a
 * select (its type-ahead): Escape there must not clear the selection, digits must not
 * reach presets. Text fields never get here (see isTyping).
 * A part of the window that has its own keys (`data-own-keys`: the outline editor, where
 * Delete removes points) keeps every single key, however it got focus.
 */
function takesSingleKeys(target: EventTarget | null, pointerFocused: EventTarget | null, cmd: Command): boolean {
  const el = target as HTMLElement | null
  // Focus fell to the page with a field that went away: the next keys were meant for typing.
  if (el === document.body && isFocusParked()) return false
  if (el?.closest?.('[data-own-keys]')) return false
  if (!el || el === document.body || el === document.documentElement || !!el.closest?.('[role="grid"]')) return true
  if (cmd.gridOnly || el !== pointerFocused) return false
  return cmd.id === 'edit.delete' ? el.tagName === 'BUTTON' : el.tagName !== 'SELECT'
}

function hasPageTextSelection(): boolean {
  const s = window.getSelection()
  return !!s && !s.isCollapsed && s.toString().trim().length > 0
}

export function installKeyboard(): () => void {
  // First: the pointer tracking below must never hear the mouse's side buttons.
  const offNavButtons = installNavButtons()
  // How the focused element got focus: from a pointer press, or from the keyboard
  // (Tab, or a script after a key, like a menu giving focus back).
  let fromPointer = false
  let pointerFocused: EventTarget | null = null
  const onPointerDown = (): void => {
    fromPointer = true
    unparkFocus()
  }
  // Only focus the press itself gives (on pointer down) counts: focus a script sets once
  // it is over (the tab shown after a close, a dialog's field) is not the mouse's.
  const onPointerUp = (): void => {
    fromPointer = false
  }
  const onKeyCapture = (): void => {
    fromPointer = false
  }
  const onFocusIn = (e: FocusEvent): void => {
    pointerFocused = fromPointer ? e.target : null
    if (e.target !== document.body) unparkFocus()
  }
  const onKey = (e: KeyboardEvent): void => {
    if (e.defaultPrevented) return
    // Open dialogs and menus own the keyboard (Escape closes the menu, not the selection).
    if (isDialogOpen() || document.querySelector('[role="menu"]')) return
    const spec = eventSpec(e)
    const cmd = specMap.get(spec)
    if (!cmd) return
    if (isTyping(e.target) && !cmd.global) return
    const chord = e.ctrlKey || e.metaKey || e.altKey
    if (!chord && !/^F\d{1,2}$/.test(e.key) && !takesSingleKeys(e.target, pointerFocused, cmd)) return
    // Ctrl+C over selected page text (names, code points in the inspector) copies that text.
    if (spec === 'Ctrl+C' && hasPageTextSelection()) return
    if (cmd.enabled && !cmd.enabled()) {
      // A disabled copy still lets the browser copy selected text.
      if (spec !== 'Ctrl+C') e.preventDefault()
      return
    }
    e.preventDefault()
    void cmd.run()
  }
  // A tap focuses on the mouse events that follow pointer up: they count as the press too.
  window.addEventListener('pointerdown', onPointerDown, true)
  window.addEventListener('mousedown', onPointerDown, true)
  window.addEventListener('pointerup', onPointerUp, true)
  window.addEventListener('mouseup', onPointerUp, true)
  window.addEventListener('pointercancel', onPointerUp, true)
  window.addEventListener('keydown', onKeyCapture, true)
  window.addEventListener('focusin', onFocusIn, true)
  window.addEventListener('keydown', onKey)
  return () => {
    offNavButtons()
    window.removeEventListener('pointerdown', onPointerDown, true)
    window.removeEventListener('mousedown', onPointerDown, true)
    window.removeEventListener('pointerup', onPointerUp, true)
    window.removeEventListener('mouseup', onPointerUp, true)
    window.removeEventListener('pointercancel', onPointerUp, true)
    window.removeEventListener('keydown', onKeyCapture, true)
    window.removeEventListener('focusin', onFocusIn, true)
    window.removeEventListener('keydown', onKey)
  }
}

/** The command of the mouse's back (3) and forward (4) buttons; none for the other buttons. */
const navButtonCommand = (e: MouseEvent): string | undefined => (e.button === 3 ? 'view.back' : e.button === 4 ? 'view.forward' : undefined)

/**
 * The mouse's back and forward buttons run Back and Forward, one step per press, on release
 * as in a browser. Electron hands them to the page as pointer and mouse events (buttons 3
 * and 4) and sends the main process no `app-command`; the main process handles none, so a
 * press never steps twice. Nothing listening after these listeners hears the buttons: focus
 * stays where it is, no drag or selection starts, the keyboard's pointer tracking (unparking
 * focus, what the mouse focused) is left alone, and a browser's own history navigation never
 * runs. The step runs on pointer up, since cancelling pointer down stops the mouse events
 * that would follow.
 */
function installNavButtons(): () => void {
  const swallow = (e: MouseEvent): string | undefined => {
    const id = navButtonCommand(e)
    if (!id) return undefined
    e.preventDefault()
    e.stopImmediatePropagation()
    return id
  }
  const onPress = (e: MouseEvent): void => void swallow(e)
  const onRelease = (e: PointerEvent): void => {
    const id = swallow(e)
    // Open dialogs and menus own the mouse buttons too, as they own the keyboard.
    if (!id || isDialogOpen() || document.querySelector('[role="menu"]')) return
    runCommand(id)
  }
  const PRESS = ['pointerdown', 'mousedown', 'mouseup', 'auxclick'] as const
  for (const type of PRESS) window.addEventListener(type, onPress, true)
  window.addEventListener('pointerup', onRelease, true)
  return () => {
    for (const type of PRESS) window.removeEventListener(type, onPress, true)
    window.removeEventListener('pointerup', onRelease, true)
  }
}
