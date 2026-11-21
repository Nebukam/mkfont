import { describe, expect, it, vi } from 'vitest'
import { COMMANDS, COMMAND_GROUPS, commandById, commandLabel, commandTip, formatShortcut, groupLabel } from '../commands'

// The desktop-only commands (interface size) are listed too.
vi.mock('../../platform', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../platform')>()), isElectron: true }))

describe('command labels', () => {
  it('every command has a label in the catalog', () => {
    expect(commandById.has('view.uiBigger')).toBe(true)
    for (const c of COMMANDS) {
      expect(c.label, c.id).not.toBe(`commands.${c.id}`)
      expect(c.label, c.id).not.toMatch(/^commands\./)
      expect(c.label, c.id).toBe(commandLabel(c.id))
    }
  })

  it('every group has a display name', () => {
    for (const g of COMMAND_GROUPS) expect(groupLabel(g), g).not.toBe(`commands.groups.${g}`)
    for (const c of COMMANDS) expect(COMMAND_GROUPS).toContain(c.group)
  })

  it('no command id clashes with the catalog keys beside the ids', () => {
    for (const c of COMMANDS) expect(c.id).not.toMatch(/^(groups|withShortcut|palette)(\.|$)/)
  })

  it('reads as before in English', () => {
    expect(commandById.get('file.saveAs')!.label).toBe('Save as…')
    expect(commandById.get('view.panel.font')!.label).toBe('Font info & metrics')
    expect(commandById.get('preset.store.3')!.label).toBe('Store selection in slot 3')
    expect(groupLabel('Glyph')).toBe('Glyph')
    expect(commandTip('edit.undo')).toBe('Undo (Ctrl+Z)')
    expect(commandTip('file.newFromSvgs')).toBe('New font from SVG files…')
    expect(formatShortcut('Ctrl+Shift+S')).toBe('Ctrl+Shift+S')
    expect(formatShortcut('Alt+ArrowLeft')).toBe('Alt+←')
    expect(formatShortcut('Delete')).toBe('Delete')
    expect(formatShortcut('Ctrl+=')).toBe('Ctrl+=')
    expect(formatShortcut('Ctrl+,')).toBe('Ctrl+,')
  })
})
