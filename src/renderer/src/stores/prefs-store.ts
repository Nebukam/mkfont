// ============================================================
// Application preferences (persisted per machine).
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { localJSONStorage } from '../lib/storage'
import { LANGUAGES, type Language } from '../i18n'
import { FILE_FORMATS, type FileFormat } from '../core/font-formats'

/** Glyph grid cell width limits (px). */
export const CELL_SIZE = { min: 56, max: 260, default: 110 } as const
/** Side panel width limits and defaults (px). */
export const PANEL_WIDTH = { min: 200, max: 520, left: 260, right: 330 } as const
/** Interface zoom factor limits (desktop app). */
export const UI_SCALE = { min: 0.8, max: 1.6, step: 0.1 } as const
/** Inspector glyph view height limits (px): never below its former fixed height. */
export const GLYPH_VIEW = { min: 240, max: 720 } as const

/** Outline editor window size limits (px). */
export const OUTLINE_WINDOW = { minWidth: 360, minHeight: 320, width: 560, height: 600 } as const

/** Where a floating window sits in the app window (px). */
export interface WindowRect {
  x: number
  y: number
  width: number
  height: number
}

export type ThemePref = 'dark' | 'light' | 'system'
/** The interface language, or 'system' to follow the system's languages. */
export type LanguagePref = Language | 'system'

export interface PrefsState {
  language: LanguagePref
  theme: ThemePref
  /** Glyph grid cell width in px. */
  cellSize: number
  /** Color marking a custom bounding box in imported SVGs (v1 MARK_COLOR). */
  markColor: string
  autosave: boolean
  autosaveMinutes: number
  /** External SVG editor (v1 SVG_EDITOR_PATH): an executable path, 'system' for the OS default app, or '' to ask on first use. */
  svgEditorPath: string
  /** Format of Export (Ctrl+E). */
  exportFormat: FileFormat
  /** Formats checked in the batch export dialog. */
  batchFormats: FileFormat[]
  /** Folder exports open in when a font was never exported ('' = the font's project folder). */
  exportDir: string
  /** Grid slot labels. */
  showSlotLabels: boolean
  leftWidth: number
  rightWidth: number
  /** Zoom factor of the whole interface (Ctrl+Shift+= / Ctrl+Shift+-). */
  uiScale: number
  /** Inspector glyph view height (px), or null for a square view as wide as the inspector (MkFont 1). */
  glyphViewHeight: number | null
  /** Outline editor window: where it was left, or null for its default place. */
  outlineRect: WindowRect | null
  /** Outline editor: dragged points snap to the font's metrics / to other points. */
  outlineSnapMetrics: boolean
  outlineSnapPoints: boolean
  set: <K extends keyof Omit<PrefsState, 'set'>>(key: K, value: PrefsState[K]) => void
}

type StoredKey = Exclude<keyof PrefsState, 'set'>
type StoredPrefs = Partial<Pick<PrefsState, StoredKey>>

/** Reads a stored value: the value to use, or undefined to keep the default. */
type Check<T> = (v: unknown) => T | undefined

const text: Check<string> = (v) => (typeof v === 'string' ? v : undefined)
const flag: Check<boolean> = (v) => (typeof v === 'boolean' ? v : undefined)
const between =
  (min: number, max: number): Check<number> =>
  (v) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : undefined
const oneOf =
  <T extends string>(...choices: T[]): Check<T> =>
  (v) =>
    choices.includes(v as T) ? (v as T) : undefined

/** A list of export formats: known ones, each once, in the app's order (none when the list is not one). */
const formats: Check<FileFormat[]> = (v) => (Array.isArray(v) ? FILE_FORMATS.filter((f) => v.includes(f)) : undefined)

const windowRect: Check<WindowRect | null> = (v) => {
  if (v === null) return null
  if (!v || typeof v !== 'object') return undefined
  const r = v as Record<string, unknown>
  const n = (k: string): number | undefined => (typeof r[k] === 'number' && Number.isFinite(r[k]) ? (r[k] as number) : undefined)
  const [x, y, width, height] = [n('x'), n('y'), n('width'), n('height')]
  if (x === undefined || y === undefined || width === undefined || height === undefined) return undefined
  // Kept in the window when shown; only nonsense sizes are refused here.
  if (width < 1 || height < 1) return undefined
  return { x, y, width, height }
}

/** One check per stored preference: a new preference without one does not compile. */
const CHECKS: { [K in StoredKey]: Check<PrefsState[K]> } = {
  language: oneOf<LanguagePref>('system', ...LANGUAGES),
  theme: oneOf('dark', 'light', 'system'),
  cellSize: between(CELL_SIZE.min, CELL_SIZE.max),
  markColor: text,
  autosave: flag,
  autosaveMinutes: between(1, 120),
  svgEditorPath: text,
  exportFormat: oneOf(...FILE_FORMATS),
  batchFormats: formats,
  exportDir: text,
  showSlotLabels: flag,
  leftWidth: between(PANEL_WIDTH.min, PANEL_WIDTH.max),
  rightWidth: between(PANEL_WIDTH.min, PANEL_WIDTH.max),
  uiScale: between(UI_SCALE.min, UI_SCALE.max),
  glyphViewHeight: (v) => (v === null ? null : between(GLYPH_VIEW.min, GLYPH_VIEW.max)(v)),
  outlineRect: windowRect,
  outlineSnapMetrics: flag,
  outlineSnapPoints: flag
}

/**
 * Stored preferences the app can use: a value of the wrong type (a hand-edited or
 * damaged profile) falls back to its default, and numbers are brought into range.
 */
export function sanitizePrefs(stored: unknown): StoredPrefs {
  const out: Record<string, unknown> = {}
  if (!stored || typeof stored !== 'object') return out
  for (const key of Object.keys(CHECKS) as StoredKey[]) {
    if (!(key in stored)) continue
    const value = CHECKS[key]((stored as Record<string, unknown>)[key])
    if (value !== undefined) out[key] = value
  }
  return out as StoredPrefs
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      language: 'system',
      theme: 'dark',
      cellSize: CELL_SIZE.default,
      markColor: '#ff00ff',
      autosave: false,
      autosaveMinutes: 5,
      svgEditorPath: '',
      exportFormat: 'ttf',
      batchFormats: [...FILE_FORMATS],
      exportDir: '',
      showSlotLabels: true,
      leftWidth: PANEL_WIDTH.left,
      rightWidth: PANEL_WIDTH.right,
      uiScale: 1,
      glyphViewHeight: null,
      outlineRect: null,
      outlineSnapMetrics: true,
      outlineSnapPoints: false,
      set: (key, value) => set({ [key]: value } as Partial<PrefsState>)
    }),
    {
      name: 'mkfont.prefs',
      // v2: the text preview builds only the glyphs it shows, so v1's manual-refresh
      // threshold (previewMaxGlyphs) is gone.
      version: 2,
      migrate: (persisted) => {
        const s = { ...(persisted as Record<string, unknown>) }
        delete s.previewMaxGlyphs
        return s as unknown as PrefsState
      },
      merge: (stored, current) => ({ ...current, ...sanitizePrefs(stored) }),
      storage: localJSONStorage(),
      partialize: ({ set: _set, ...rest }) => rest
    }
  )
)

/** Zoom the whole interface by steps, within UI_SCALE (0 resets it). */
export function scaleUi(steps: number): void {
  const p = usePrefsStore.getState()
  const next = steps === 0 ? 1 : p.uiScale + steps * UI_SCALE.step
  p.set('uiScale', Math.round(Math.max(UI_SCALE.min, Math.min(UI_SCALE.max, next)) * 10) / 10)
}

/** Grow or shrink the glyph cells (Ctrl+wheel, Ctrl+= / Ctrl+-), within CELL_SIZE. */
export function zoomCells(delta: number): void {
  const p = usePrefsStore.getState()
  p.set('cellSize', Math.max(CELL_SIZE.min, Math.min(CELL_SIZE.max, p.cellSize + delta)))
}
