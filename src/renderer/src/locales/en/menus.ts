// Menu bar (beside the command menus, whose items are command labels) and the context
// menus of glyphs and kerning pairs.
export default {
  bar: {
    label: 'Main menu',
    // File menu, after Open…
    openRecent: 'Open recent',
    noRecent: 'No recent files',
    recentNeedsDesktop: 'Recent files need the desktop app',
    openSample: 'Open sample font',
    // Help menu, last item.
    github: 'MkFont on GitHub',
    // Import button and its menu.
    import: 'Import',
    importSvg: 'SVG files…',
    importFont: 'Glyphs from a font file (TTF, OTF, WOFF)…',
    importMkfont: 'Glyphs from another .mkfont…',
    // Export button and its menu.
    export: 'Export',
    exportTtf: 'Export TTF',
    exportTtfHint: 'TrueType outlines (same pipeline as MkFont 1)',
    exportOtf: 'Export OTF',
    exportOtfHint: 'CFF outlines, keeps curves exact',
    exportWoff: 'Export WOFF',
    exportWoffHint: 'Web font: TrueType outlines, compressed',
    exportWoff2: 'Export WOFF2',
    exportWoff2Hint: 'Web font: TrueType outlines, smallest files',
    exportOptions: 'Export options…',
    // The arrow button that opens the export menu.
    exportMenu: 'Export options'
  },
  // Submenu of the glyph and pair menus.
  copyText: {
    title: 'Copy as text',
    characters: 'Characters',
    unicodeValues: 'Unicode values'
  },
  // Context menu of glyph slots (grid, inspector).
  glyph: {
    createEmpty_one: 'Create empty glyph',
    createEmpty_other: 'Create {{count, number}} empty glyphs',
    importSvg: 'Import SVG…',
    copy: 'Copy',
    pasteSpecial: 'Paste special',
    pasteTransformsOnly: 'Paste transforms only',
    replaceComponents: 'Replace components',
    addComponents: 'Add components',
    copyComponentTransforms: 'Copy component transforms',
    outlineSvg: 'Outline as SVG',
    outlineSvgHint: 'The final outline, components included',
    components: 'Components',
    fromDecomposition: 'Create from decomposition',
    fromDecompositionHint: 'Also creates missing component glyphs',
    noDecomposition: 'No Unicode decomposition for this selection',
    fromDecompositionExisting: 'Create from decomposition (existing glyphs only)',
    addComponentsPick: 'Add components…',
    showComponents: 'Show all components',
    hideComponents: 'Hide all components',
    createLigature: 'Create ligature',
    // "Kern A V": the two selected glyphs.
    kern: 'Kern {{left}} {{right}}',
    reset: 'Reset',
    clearAll: 'Clear outline & components',
    clearOutline: 'Clear outline, keep components',
    rebuild: 'Rebuild from decomposition',
    unbind_one: 'Unbind source file',
    unbind_other: 'Unbind {{count, number}} files',
    storeInSlot: 'Store selection in slot',
    slot: 'Slot {{slot}}',
    artboardTemplate: 'Illustrator artboard template…',
    // The item reads as for one glyph while it is disabled (no existing glyph selected).
    delete_one: 'Delete glyph',
    delete_other: 'Delete {{count, number}} glyphs'
  },
  // Context menu of kerning pairs (the pair views).
  pair: {
    goTo: 'Go to {{glyph}}',
    applySuggested_one: 'Apply suggested value ({{value}})',
    applySuggested_other: 'Apply {{count, number}} suggested values',
    applySuggestedHint: 'Measured from the outlines: a starting point to check by eye',
    noKerning: 'No kerning (keep at 0)',
    noKerningHint: 'The pair was checked and needs no kerning: it is kept, but not exported',
    // The item reads as for one pair while it is disabled (no kerned pair selected).
    remove_one: 'Remove pair',
    remove_other: 'Remove {{count, number}} pairs'
  }
} as const
