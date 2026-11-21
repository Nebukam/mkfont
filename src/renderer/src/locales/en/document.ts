// Documents: new, open, save, export, autosave, close; their toasts, confirmations and errors.
export default {
  /** A new font's file name, in its tab and the save dialog. */
  untitled: 'Untitled',
  untitledFile: 'Untitled.mkfont',
  untitledFileNumbered: 'Untitled {{n}}.mkfont',
  /** Suggested save / export file name (before the extension) of an untitled font with no family name. */
  fallbackFileName: 'font',
  /** A new font's family name (Font panel; written into the exported font unless changed). */
  untitledFamily: 'Untitled',

  // First History entry of a document.
  history: {
    newFont: 'New font',
    opened: 'Opened',
    openedFile: 'Opened {{fileName}}'
  },

  // Closing a document with unsaved changes.
  unsaved: {
    title: 'Save changes to “{{fileName}}”?',
    message: 'Your changes will be lost if you don’t save them.',
    save: 'Save',
    dontSave: 'Don’t save',
    cancel: 'Cancel'
  },

  // Opening.
  /** File dialog title. */
  openTitle: 'Open font project',
  opened: 'Opened {{fileName}}',
  openedDetail_one: '{{count, number}} glyph in {{seconds}}s',
  openedDetail_other: '{{count, number}} glyphs in {{seconds}}s',
  couldNotOpen: 'Could not open {{fileName}}',
  couldNotLoadSample: 'Could not load the sample font',
  /** Reasons a .mkfont file cannot be read (core/deserialize); `reason` is the parser's own text. */
  parse: {
    invalid: 'Not a valid .mkfont file ({{reason}})',
    missingData: 'Not a valid .mkfont file (missing font data)'
  },

  // Saving.
  /** File dialog title. */
  saveTitle: 'Save font project',
  saveFailed: 'Save failed',
  saved: 'Saved {{fileName}}',
  savedReplacedTab: 'The tab that showed the replaced file was closed.',
  openInOtherTab: '{{fileName}} is open in another tab',
  openInOtherTabDetail: 'It has unsaved changes. Save or close that tab first.',
  autosaved: 'Autosaved',

  // Exporting.
  export: {
    /** File dialog title; `format` is OTF or TTF. */
    title: 'Export {{format}}',
    failed: 'Export failed',
    exported: 'Exported {{fileName}}',
    exportedWithWarnings_one: 'Exported {{fileName}} with {{count, number}} warning',
    exportedWithWarnings_other: 'Exported {{fileName}} with {{count, number}} warnings',
    showInFolder: 'Show in folder',
    /** Notice details, joined by ", ". */
    glyphs_one: '{{count, number}} glyph',
    glyphs_other: '{{count, number}} glyphs',
    ligatures_one: '{{count, number}} ligature',
    ligatures_other: '{{count, number}} ligatures',
    kerningPairs_one: '{{count, number}} kerning pair',
    kerningPairs_other: '{{count, number}} kerning pairs',
    /** Errors and warnings from core/export-font. */
    noGlyphs: 'There is no glyph to export.',
    notSfnt: 'Not a TrueType or OpenType font.',
    noBrotli: 'This browser cannot write WOFF2 (it has no Brotli compression). Use the desktop app.',
    /** Batch export: the prompt before files are replaced, and the notice. {{files}}: names joined by ", ". */
    batch: {
      replaceTitle_one: 'Replace {{count, number}} existing file?',
      replaceTitle_other: 'Replace {{count, number}} existing files?',
      replaceMessage_one: '{{files}} is already in this folder.',
      replaceMessage_other: 'These files are already in this folder: {{files}}.',
      replace: 'Replace',
      exported_one: 'Exported {{count, number}} file to {{folder}}',
      exported_other: 'Exported {{count, number}} files to {{folder}}',
      downloaded_one: 'Exported {{count, number}} file',
      downloaded_other: 'Exported {{count, number}} files'
    },
    warnings: {
      outOfBounds: '{{glyph}} skipped: outline is out of bounds',
      ligatureMissing: 'Ligature "{{chars}}" will not substitute: missing {{missing}}',
      kerningSkipped_one: '{{count, number}} kerning pair skipped: a glyph is missing or not exported',
      kerningSkipped_other: '{{count, number}} kerning pairs skipped: a glyph is missing or not exported'
    }
  }
} as const
