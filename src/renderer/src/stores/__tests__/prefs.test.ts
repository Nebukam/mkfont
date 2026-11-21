import { describe, expect, it } from 'vitest'
import { CELL_SIZE, GLYPH_VIEW, PANEL_WIDTH, sanitizePrefs, usePrefsStore } from '../prefs-store'

const defaults = usePrefsStore.getState()

describe('stored preferences', () => {
  it('keep valid values and bring numbers into range', () => {
    expect(sanitizePrefs({ theme: 'light', cellSize: 9999, rightWidth: 400, glyphViewHeight: null })).toEqual({
      theme: 'light',
      cellSize: CELL_SIZE.max,
      rightWidth: 400,
      glyphViewHeight: null
    })
  })

  it('drop damaged values, which fall back to their defaults', () => {
    const stored = { theme: 'neon', cellSize: 'big', leftWidth: null, rightWidth: Number.NaN, uiScale: {}, autosave: 'yes', glyphViewHeight: '300', unknown: 1 }
    expect(sanitizePrefs(stored)).toEqual({})
    expect(sanitizePrefs('garbage')).toEqual({})
    expect({ ...defaults, ...sanitizePrefs(stored) }.rightWidth).toBe(PANEL_WIDTH.right)
  })

  it('keep a floating window where it was left, or drop a place that makes no sense', () => {
    const rect = { x: -40, y: 12, width: 480, height: 520 }
    expect(sanitizePrefs({ outlineRect: rect, outlineSnapPoints: true })).toEqual({ outlineRect: rect, outlineSnapPoints: true })
    expect(sanitizePrefs({ outlineRect: null })).toEqual({ outlineRect: null })
    for (const bad of [{ x: 0, y: 0, width: 0, height: 100 }, { x: 0, y: 0, width: 'wide', height: 100 }, { x: 0, y: Number.NaN, width: 10, height: 10 }, [1, 2, 3, 4], 'left'])
      expect(sanitizePrefs({ outlineRect: bad })).toEqual({})
  })

  it('round-trip every preference the app writes', () => {
    const { set: _set, ...saved } = { ...defaults, glyphViewHeight: GLYPH_VIEW.min + 10, exportDir: 'D:/out', outlineRect: { x: 10, y: 20, width: 500, height: 400 } }
    expect(sanitizePrefs(saved)).toEqual(saved)
  })
})
