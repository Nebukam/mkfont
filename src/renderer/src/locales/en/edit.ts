// Edits: glyph actions, clipboard, kerning edits, external editing; toasts and history entry names.
// One glyph or pair is named ("…Glyph", "…Pair"), several are counted ("…Glyphs", "…Pairs").
export default {
  // History entry names (History panel, undo notices).
  history: {
    createGlyph: 'Create {{glyph}}',
    createGlyphs_one: 'Create {{count, number}} glyph',
    createGlyphs_other: 'Create {{count, number}} glyphs',
    deleteGlyph: 'Delete {{glyph}}',
    deleteGlyphs_one: 'Delete {{count, number}} glyph',
    deleteGlyphs_other: 'Delete {{count, number}} glyphs',
    resetGlyph: 'Reset {{glyph}}',
    resetGlyphs_one: 'Reset {{count, number}} glyph',
    resetGlyphs_other: 'Reset {{count, number}} glyphs',
    rebuildGlyph: 'Rebuild {{glyph}}',
    rebuildGlyphs_one: 'Rebuild {{count, number}} glyph',
    rebuildGlyphs_other: 'Rebuild {{count, number}} glyphs',
    composeGlyph: 'Compose {{glyph}}',
    composeGlyphs_one: 'Compose {{count, number}} glyph',
    composeGlyphs_other: 'Compose {{count, number}} glyphs',
    addComponent: 'Add component {{glyph}}',
    addComponents_one: 'Add {{count, number}} component',
    addComponents_other: 'Add {{count, number}} components',
    showAllComponents: 'Show all components',
    hideAllComponents: 'Hide all components',
    createLigature: 'Create ligature {{chars}}',
    reloadGlyph: 'Reload {{glyph}} from file',
    reloadGlyphs_one: 'Reload {{count, number}} glyph from file',
    reloadGlyphs_other: 'Reload {{count, number}} glyphs from file',
    pasteOntoGlyph: 'Paste onto {{glyph}}',
    pasteOntoGlyphs_one: 'Paste onto {{count, number}} glyph',
    pasteOntoGlyphs_other: 'Paste onto {{count, number}} glyphs',
    pasteSvgInto: 'Paste SVG into {{glyph}}',
    pasteInPlace_one: 'Paste {{count, number}} glyph in place',
    pasteInPlace_other: 'Paste {{count, number}} glyphs in place',
    pasteTransforms_one: 'Paste transforms onto {{count, number}} glyph',
    pasteTransforms_other: 'Paste transforms onto {{count, number}} glyphs',
    replaceComponents: 'Replace components',
    pasteComponents: 'Paste components',
    pasteComponentTransforms: 'Paste component transforms',
    addPair: 'Add kerning pair {{pair}}',
    setKerningPair: 'Set kerning of {{pair}}',
    setKerningPairs_one: 'Set kerning of {{count, number}} pair',
    setKerningPairs_other: 'Set kerning of {{count, number}} pairs',
    applySuggestionPair: 'Apply suggested kerning to {{pair}}',
    applySuggestionPairs_one: 'Apply {{count, number}} suggested kerning value',
    applySuggestionPairs_other: 'Apply {{count, number}} suggested kerning values',
    inheritPair: 'Inherit kerning for {{pair}}',
    inheritPairs_one: 'Inherit kerning for {{count, number}} pair',
    inheritPairs_other: 'Inherit kerning for {{count, number}} pairs',
    inheritOn: 'Accented letters follow their base letter',
    inheritOff: 'Accented letters kern on their own',
    removePair: 'Remove kerning pair {{pair}}',
    removePairs_one: 'Remove {{count, number}} kerning pair',
    removePairs_other: 'Remove {{count, number}} kerning pairs'
  },

  // Undo notice after an edit (actions.ts offerUndo).
  undo: {
    action: 'Undo',
    fontClosed: 'The font was closed',
    /** By kind of edit. */
    alreadyUndone: {
      delete: 'The delete is already undone',
      change: 'The change is already undone',
      removal: 'The removal is already undone'
    },
    notUndone: {
      delete: 'The delete was not undone',
      change: 'The change was not undone',
      removal: 'The removal was not undone'
    },
    notUndoneDetail: 'Other changes came after it. Use the History panel to go back.'
  },

  // Glyph actions (app/actions.ts).
  allSlotsHaveGlyphs: 'All selected slots already have glyphs',
  createMany: {
    title_one: 'Create {{count, number}} glyph?',
    title_other: 'Create {{count, number}} glyphs?',
    message: 'Creating this many glyphs at once can slow the editor down.',
    confirm: 'Create'
  },
  deletedGlyph: 'Deleted {{glyph}}',
  deletedGlyphs_one: 'Deleted {{count, number}} glyph',
  deletedGlyphs_other: 'Deleted {{count, number}} glyphs',
  noDecomposition: 'No decomposition available',
  noDecompositionDetail: 'Only characters with a Unicode decomposition (like é = e + ◌́) can be composed automatically.',
  alsoCreatedComponents_one: 'Also created {{count, number}} missing component glyph',
  alsoCreatedComponents_other: 'Also created {{count, number}} missing component glyphs',
  alsoCreatedComponentsDetail: 'They are empty: import or draw them to complete the composition.',
  /** Glyph picker opened to add components (title and button). */
  addComponents: 'Add components',
  ligatureNeedsTwo: 'Select at least two characters to build a ligature',
  ligatureExists: 'That ligature already exists — selected it',
  copiedCharacters_one: 'Copied {{count, number}} character',
  copiedCharacters_other: 'Copied {{count, number}} characters',
  copiedUnicodeValues_one: 'Copied {{count, number}} unicode value',
  copiedUnicodeValues_other: 'Copied {{count, number}} unicode values',
  copiedOutline: 'Copied the outline of {{glyph}} as SVG',

  // Selection slots 0–9.
  presets: {
    stored: 'Stored selection in slot {{slot}}',
    cleared: 'Cleared selection slot {{slot}}',
    glyphs_one: '{{count, number}} glyph',
    glyphs_other: '{{count, number}} glyphs',
    empty: 'Selection slot {{slot}} is empty',
    emptyDetail: 'Use Ctrl+{{slot}} to store the current selection.'
  },

  // Illustrator artboard template.
  artboards: {
    tooMany: 'Illustrator supports up to {{max, number}} artboards',
    tooManyDetail_one: 'Only the first {{max, number}} of {{count, number}} glyph are included.',
    tooManyDetail_other: 'Only the first {{max, number}} of {{count, number}} glyphs are included.',
    /** Save dialog title. */
    saveTitle: 'Save Illustrator script',
    saved: 'Saved Illustrator script',
    savedDetail: 'Run it from File › Scripts › Other Script… to create one artboard per glyph.'
  },

  // Bound files and external editing (app/bindings.ts).
  bindings: {
    unbound: 'Unbound {{fileName}}',
    unboundDetail: 'The file was removed.',
    couldNotReloadGlyph: 'Could not reload {{glyph}}',
    couldNotReloadGlyphs_one: 'Could not reload {{count, number}} glyph',
    couldNotReloadGlyphs_other: 'Could not reload {{count, number}} glyphs',
    couldNotReloadFile: 'Could not reload {{fileName}}',
    pickEditor: {
      title: 'Which app should edit SVGs?',
      message: 'Pick your vector editor (Illustrator, Inkscape, Affinity…). You can change it later in Preferences.',
      choose: 'Choose app…',
      systemDefault: 'Use system default',
      /** File dialog title. */
      dialogTitle: 'Select your SVG editor'
    },
    needsDesktop: 'External editing needs the desktop app',
    couldNotOpenEditor: 'Could not open the editor',
    editing: 'Editing {{glyph}} externally',
    editingDetail: 'Changes saved in the editor update the glyph.'
  },

  // Copy and paste (app/clipboard.ts).
  clipboard: {
    nothingToCopy: 'Nothing to copy',
    nothingToCopyDetail: 'Select existing glyphs first.',
    copiedGlyph: 'Copied {{glyph}}',
    copiedGlyphs_one: 'Copied {{count, number}} glyph',
    copiedGlyphs_other: 'Copied {{count, number}} glyphs',
    selectWhere: 'Select where to paste',
    selectWhereDetail: 'Pasted glyphs are distributed over the selection.',
    selectSvgTarget: 'Select a glyph to paste the SVG into',
    nothingToPaste: 'Nothing to paste',
    nothingToPasteDetail: 'Copy glyphs, or SVG markup from a vector editor.',
    nothingToPasteInPlaceDetail: 'Copy glyphs first.',
    couldNotPasteSvg: 'Could not paste the SVG',
    svgNoPaths: 'It has no usable paths.',
    inPlaceSameFont: 'Paste in place copies glyphs between fonts',
    inPlaceSameFontDetail: 'Open another font, then paste in place.',
    selectTransformsTarget: 'Select existing glyphs to paste transforms onto',
    copyGlyphFirst: 'Copy a glyph first',
    selectExisting: 'Select existing glyphs first',
    copyComponentsFirst: 'Copy a glyph with components first'
  },

  // Kerning edits (app/kerning.ts).
  kerning: {
    pairExists: 'That pair already exists — selected it',
    typeTwo: 'Type two characters to add a pair',
    typeTwoDetail: 'Or two glyphs separated by a space, like “fi x” for a ligature followed by x.',
    appliedSuggestions_one: 'Applied {{count, number}} suggested kerning value',
    appliedSuggestions_other: 'Applied {{count, number}} suggested kerning values',
    removedPair: 'Removed kerning pair {{pair}}',
    removedPairs_one: 'Removed {{count, number}} kerning pair',
    removedPairs_other: 'Removed {{count, number}} kerning pairs',
    copiedPairs_one: 'Copied {{count, number}} pair',
    copiedPairs_other: 'Copied {{count, number}} pairs'
  }
} as const
