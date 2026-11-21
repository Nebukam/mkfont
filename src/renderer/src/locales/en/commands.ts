// Command labels, by command id nested at its dots ("file.saveAs" → file.saveAs): menu bar,
// command palette, shortcuts dialog, toolbar tips. The selection slot commands
// (preset.restore.0…9) share one message per kind, with the slot number.
// Besides the ids: groups (menu bar titles, palette detail, shortcuts dialog headings),
// withShortcut (tooltips) and palette (the command palette); no command id starts with these.
export default {
  groups: {
    File: 'File',
    Edit: 'Edit',
    Select: 'Select',
    Glyph: 'Glyph',
    View: 'View',
    Help: 'Help'
  },
  // A command's tooltip: "Undo (Ctrl+Z)".
  withShortcut: '{{label}} ({{shortcut}})',
  file: {
    new: 'New font',
    open: 'Open…',
    save: 'Save',
    saveAs: 'Save as…',
    importSvg: 'Import SVGs…',
    importFont: 'Import glyphs from a font file…',
    importMkfont: 'Import glyphs from another .mkfont…',
    newFromFont: 'New font from a font file…',
    newFromSvgs: 'New font from SVG files…',
    export: 'Export font',
    exportTtf: 'Export as TTF',
    exportOtf: 'Export as OTF (CFF)',
    exportWoff: 'Export as WOFF',
    exportWoff2: 'Export as WOFF2',
    exportBatch: 'Batch export…',
    close: 'Close font'
  },
  app: {
    prefs: 'Preferences…'
  },
  edit: {
    undo: 'Undo',
    redo: 'Redo',
    copy: 'Copy glyphs',
    paste: 'Paste',
    pasteInPlace: 'Paste in place (same slots)',
    pasteTransforms: 'Paste transforms',
    delete: 'Delete'
  },
  select: {
    all: 'Select all in view',
    none: 'Deselect',
    invert: 'Invert selection in view',
    existing: 'Keep only existing glyphs'
  },
  glyph: {
    create: 'Create empty glyphs',
    reset: 'Reset glyphs (clear outline & components)',
    resetKeep: 'Reset outline, keep components',
    compose: 'Create components from decomposition',
    ligature: 'Create ligature from selection',
    ligatureComp: 'Create ligature with components',
    kern: 'Kern the two selected glyphs',
    ligatureFinder: 'Ligature finder…',
    editOutline: 'Edit outline',
    editExternal: 'Edit in external editor',
    copyChars: 'Copy selection as characters',
    copyHex: 'Copy selection as unicode values'
  },
  view: {
    search: 'Find glyph…',
    palette: 'Command palette…',
    back: 'Back',
    forward: 'Forward',
    nextTab: 'Next font',
    prevTab: 'Previous font',
    left: 'Toggle sidebar',
    right: 'Toggle inspector',
    panel: {
      browse: 'Glyph browser',
      preview: 'Text preview',
      history: 'History',
      font: 'Font info & metrics'
    },
    kerning: 'Kerning pairs',
    commonPairs: 'Common kerning pairs',
    detected: 'Detected kerning pairs',
    zoomIn: 'Bigger glyph cells',
    zoomOut: 'Smaller glyph cells',
    uiBigger: 'Larger interface',
    uiSmaller: 'Smaller interface',
    uiReset: 'Actual interface size',
    theme: 'Toggle light / dark theme'
  },
  help: {
    shortcuts: 'Keyboard shortcuts',
    updates: 'Check for updates',
    about: 'About MkFont'
  },
  // preset.<kind>.<slot> (hidden from the menus and the palette).
  preset: {
    restore: 'Restore selection slot {{slot}}',
    store: 'Store selection in slot {{slot}}',
    append: 'Add selection slot {{slot}}'
  },
  palette: {
    title: 'Command palette',
    input: 'Command or character',
    placeholder: 'Type a command, or a character / U+XXXX to jump to it',
    list: 'Commands',
    // First entry when the query is a character or a code point: "Go to A U+0041".
    goTo: 'Go to {{glyph}} {{code}}',
    noMatch: 'No command matches.'
  }
} as const
