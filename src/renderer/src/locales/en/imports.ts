// Imports: SVG, font file and .mkfont import flows and dialogs; import errors.
export default {
  // Shared by the import dialogs.
  cancel: 'Cancel',
  /** Import dialogs' confirm button. */
  importGlyphs_one: 'Import {{count, number}} glyph',
  importGlyphs_other: 'Import {{count, number}} glyphs',
  /** "Existing" row: what to do with glyphs the font already has. */
  existing: 'Existing',
  /** History entry, and the notice after it (font file and .mkfont imports). */
  importGlyphsFrom_one: 'Import {{count, number}} glyph from {{fileName}}',
  importGlyphsFrom_other: 'Import {{count, number}} glyphs from {{fileName}}',
  importedGlyphsFrom_one: 'Imported {{count, number}} glyph from {{fileName}}',
  importedGlyphsFrom_other: 'Imported {{count, number}} glyphs from {{fileName}}',

  // File dialog titles (app/imports.ts).
  pick: {
    svgFiles: 'Import SVG files',
    newFontFromSvgs: 'New font from SVG files',
    fontFile: 'Import font file',
    mkfont: 'Import glyphs from .mkfont',
    svg: 'Import SVG'
  },
  /** Dropping SVG files with no font open. */
  openFontFirst: 'Open or create a font first',
  openFontFirstDetail: 'Then drop SVG files to import them.',

  // SVG import: one file into a glyph, and the batch import dialog.
  svg: {
    couldNotImport: 'Could not import {{fileName}}',
    /** History entry: one file imported into a glyph. */
    intoGlyph: 'Import {{fileName}} into {{glyph}}',
    fileNoPaths: 'The file has no usable paths.',
    /** Reasons an SVG cannot be read (core/import-svg). */
    errors: {
      tooManyCopies: 'This SVG draws too many copies through <use> to import.',
      tooMuchPathData: 'This SVG has too much path data to import.',
      malformed: 'The SVG is incomplete or malformed.'
    },

    // Batch import dialog.
    title: 'Import SVG files',
    history_one: 'Import {{count, number}} SVG',
    history_other: 'Import {{count, number}} SVGs',
    imported_one: 'Imported {{count, number}} glyph',
    imported_other: 'Imported {{count, number}} glyphs',
    /** Subtitle parts, joined by " · ". */
    summary: {
      files_one: '{{count, number}} file',
      files_other: '{{count, number}} files',
      new_one: '{{count, number}} new',
      new_other: '{{count, number}} new',
      replace_one: '{{count, number}} replace',
      replace_other: '{{count, number}} replace',
      skipped_one: '{{count, number}} skipped',
      skipped_other: '{{count, number}} skipped',
      unassigned_one: '{{count, number}} unassigned',
      unassigned_other: '{{count, number}} unassigned',
      unusable_one: '{{count, number}} unusable',
      unusable_other: '{{count, number}} unusable'
    },
    assign: 'Assign to unicode',
    assignModes: {
      filename: 'From file names',
      selection: 'To the selection ({{count, number}})',
      block: 'To a block',
      blockConstrained: 'To a block (stop at its end)'
    },
    prefix: 'Prefix',
    prefixTip: 'Text before the character part of the name (e.g. char in char_A.svg)',
    prefixNone: 'none',
    separator: 'Separator',
    separatorTip: 'Splits name parts; parts are joined into one sequence (f_i → fi ligature)',
    separators: {
      underscore: '_ underscore',
      dash: '- dash',
      dot: '. dot',
      space: '␣ space',
      none: 'none'
    },
    namesHint: 'Names can be characters (A, fi), U+0041, uni0041 or hex like 00e9.',
    selectionHint: 'Files are assigned to the selected slots in selection order.',
    block: 'Block',
    blockStart: 'Block start',
    blockStarts: {
      begin: 'Start at the beginning',
      firstEmpty: 'Start at the first empty slot'
    },
    existingGlyphs: 'Existing glyphs',
    /** What to do with glyphs that exist (core/import-assign OverlapMode). */
    overlap: {
      overwrite: 'Replace path & transforms',
      overwriteEmpty: 'Replace transforms of empty glyphs only',
      preserve: 'Replace path, keep transforms',
      ignore: "Don't import"
    },
    options: 'Options',
    keepLinked: 'Keep files linked (live reload on save)',
    textLabels: 'Text labels in SVGs become components',
    transforms: 'Transforms for imported glyphs',
    importAll: 'Import all files',
    /** File list column headers. */
    columns: {
      file: 'File',
      target: 'Target',
      override: 'Override'
    },
    importFile: 'Import {{fileName}}',
    noPaths: 'No usable paths.',
    /** File details, joined by " · ". */
    size: '{{width}} × {{height}}',
    markedBox: 'marked box',
    labels_one: '{{count, number}} label',
    labels_other: '{{count, number}} labels',
    unassigned: 'unassigned',
    overrideFor: 'Override unicode for {{fileName}}',
    overrideAuto: 'auto',
    /** Status chips of the file rows. */
    status: {
      new: 'new',
      replace: 'replace',
      skip: 'skip'
    }
  },

  // Font file import dialog (TTF, OTF, WOFF).
  font: {
    titleNew: 'New font from a font file',
    title: 'Import glyphs from a font file',
    /** First History entry of the new font. */
    imported: 'Imported {{fileName}}',
    created: 'Created a font from {{fileName}}',
    glyphs_one: '{{count, number}} glyph',
    glyphs_other: '{{count, number}} glyphs',
    createFont_one: 'Create font ({{count, number}} glyph)',
    createFont_other: 'Create font ({{count, number}} glyphs)',
    unreadable: 'This file could not be read: {{error}}',
    family: 'Family',
    unitsPerEm: 'Units per EM',
    ascenderDescender: 'Ascender / descender',
    glyphsLabel: 'Glyphs',
    /** "Glyphs" value parts, joined by ", ". */
    characters_one: '{{count, number}} character',
    characters_other: '{{count, number}} characters',
    ligatures_one: '{{count, number}} ligature',
    ligatures_other: '{{count, number}} ligatures',
    scaled: 'Outlines are scaled so the font’s ascender matches yours ({{ascent}}); side bearings become shift & push.',
    includeLigatures: 'Include ligatures (from the GSUB liga feature)',
    keepExisting_one: 'Keep my {{count, number}} existing glyph',
    keepExisting_other: 'Keep my {{count, number}} existing glyphs',
    replaceExisting_one: 'Replace {{count, number}} existing glyph',
    replaceExisting_other: 'Replace {{count, number}} existing glyphs'
  },

  // .mkfont import dialog (glyphs from another project).
  mkfont: {
    title: 'Import glyphs from another font project',
    summary_one: '{{count, number}} glyph · EM {{em}}',
    summary_other: '{{count, number}} glyphs · EM {{em}}',
    summaryRescaled_one: '{{count, number}} glyph · EM {{em}} (rescaled ×{{factor}})',
    summaryRescaled_other: '{{count, number}} glyphs · EM {{em}} (rescaled ×{{factor}})',
    all: 'All',
    none: 'None',
    onlyMissing: 'Only missing here',
    keepExisting: 'Keep glyphs that already exist here',
    replaceExisting: 'Replace glyphs that already exist here',
    withComponents: 'Also import component glyphs missing here',
    glyphsToImport: 'Glyphs to import',
    /** A glyph the open font has too: tooltip, and accessible name. */
    existsTip: '{{glyph}} (exists here)',
    existsName: '{{name}}, exists here'
  }
} as const
