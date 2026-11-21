// Viewport: range titles, toolbar, progress and empty states, glyph and pair slots.
export default {
  // The view's title and the tag beside it (rangeTitle). Block names are Unicode data; category names are in ./unicode.
  titles: {
    myGlyphs: 'My glyphs',
    ligatures: 'Ligatures',
    kerning: 'Kerning',
    commonPairs: 'Common pairs',
    commonPairsGroup: 'Common pairs · {{group}}',
    detected: 'Detected pairs',
    allCharacters: 'All characters',
    category: '{{group}} · {{name}}'
  },
  tags: {
    font: 'Font',
    kerning: 'Kerning',
    unicode: 'Unicode',
    block: 'Block',
    category: 'Category {{gc}}'
  },
  // The line under the title. Segments are joined with `separator`; <n> and <s> are styled counts.
  status: {
    separator: ' · ',
    progress_one: '<n>{{kerned, number}}</n> kerned · {{zero, number}} at 0 · {{inherited, number}} inherited · <n>{{none, number}}</n> to do, of {{count, number}} pair',
    progress_other: '<n>{{kerned, number}}</n> kerned · {{zero, number}} at 0 · {{inherited, number}} inherited · <n>{{none, number}}</n> to do, of {{count, number}} pairs',
    detected_one: '<n>{{count, number}}</n> pair may need kerning · rough suggestions measured from your outlines',
    detected_other: '<n>{{count, number}}</n> pairs may need kerning · rough suggestions measured from your outlines',
    pairs_one: '<n>{{count, number}}</n> pair',
    pairs_other: '<n>{{count, number}}</n> pairs',
    withGlyphMissing_one: '{{count, number}} with a glyph missing',
    withGlyphMissing_other: '{{count, number}} with a glyph missing',
    moreInherited_one: '{{count, number}} more inherited by accented letters',
    moreInherited_other: '{{count, number}} more inherited by accented letters',
    glyphs_one: '<n>{{count, number}}</n> glyph',
    glyphs_other: '<n>{{count, number}}</n> glyphs',
    glyphsOfSlots_one: '<n>{{count, number}}</n> glyph of {{slots, number}} slots',
    glyphsOfSlots_other: '<n>{{count, number}}</n> glyphs of {{slots, number}} slots',
    shown_one: '{{count, number}} shown',
    shown_other: '{{count, number}} shown',
    filteredFrom_one: 'filtered from {{count, number}}',
    filteredFrom_other: 'filtered from {{count, number}}',
    selected_one: '<s>{{count, number}} selected</s>',
    selected_other: '<s>{{count, number}} selected</s>'
  },
  // Header actions and their "more actions" menus.
  actions: {
    create: 'Create',
    createTip: 'Create empty glyphs for the selected slots (Ctrl+Shift+N)',
    more: 'More actions',
    selection: 'Selection',
    selectionCount: 'Selection ({{count, number}})',
    everythingInView: 'Everything in view ({{count, number}})',
    selectAll: 'Select all',
    copyCharacters: 'Copy characters',
    copyUnicodeValues: 'Copy unicode values',
    artboardTemplate: 'Illustrator artboard template…',
    createAllMissing: 'Create all missing glyphs',
    deleteAllInView: 'Delete all glyphs in view',
    newPairPlaceholder: 'New pair, e.g. AV',
    newPairLabel: 'New kerning pair: two characters, or two glyphs separated by a space',
    newPairTip: 'Two characters (AV), or two glyphs separated by a space (fi x)',
    addPair: 'Add pair',
    applyAll: 'Apply all',
    applyAllTip_one: 'Give the {{count, number}} pair shown their suggested values (one undo step)',
    applyAllTip_other: 'Give the {{count, number}} pairs shown their suggested values (one undo step)',
    applySuggestions: 'Apply suggestions',
    noKerning: 'No kerning (keep at 0)',
    copyAsCharacters: 'Copy as characters',
    removeAllPairs: 'Remove all pairs in view',
    removePairValues: 'Remove the values of the pairs in view'
  },
  search: {
    glyphsPlaceholder: 'Search characters, names or U+ codes — e.g. a, grave, U+00E9',
    pairsPlaceholder: 'Search either glyph of a pair, or the pair itself — e.g. T, U+0054, AV',
    clear: 'Clear search',
    relatives: 'Relatives',
    relativesTip: 'Also show related characters (shared decompositions), even outside this range',
    existingOnly: 'Existing only',
    existingGlyphsTip: 'Only show glyphs that exist in the font',
    existingPairsTip: 'Only show pairs whose two glyphs exist in the font',
    todo: 'To do',
    todoTip: 'Only pairs not kerned yet: no value of their own, none inherited, not set to no kerning',
    rare: 'Rare pairs',
    rareTip: 'Also pairs outside the common pairs list, strongest suggestions first',
    results_one: '{{count, number}} result',
    results_other: '{{count, number}} results'
  },
  // The order of the common pairs views.
  sort: {
    header: 'Order',
    tip: 'Order of the pairs',
    label: 'Order: {{order}}',
    rank: { label: 'Most common first', hint: 'The order of the common pairs list' },
    detected: { label: 'Detected first', hint: 'Pairs not kerned yet that the outlines suggest a value for, then the others' }
  },
  // The view when nothing is listed.
  empty: {
    nothing: 'Nothing to show here.',
    noMatch: 'No match for “{{text}}” in this range.',
    measuring: 'Measuring your outlines…',
    detectedNoGlyphs: 'This font has no glyphs yet: pairs are measured from their outlines.',
    detectedNothingRare: 'Nothing stands out: every pair your font draws is kerned already, or sits at its normal spacing.',
    detectedNothing: 'Nothing stands out: every common pair your font draws is kerned already, or sits at its normal spacing.',
    todoDone: 'Nothing left to do here: every pair is kerned, inherited, or set to no kerning.',
    noExistingPairs: 'No pair has both of its glyphs in the font.',
    noExistingGlyphs: 'None of these characters exist in the font yet.',
    noGlyphs: 'This font has no glyphs yet.',
    noLigatures: 'No ligatures yet.',
    noPairs: 'No kerning pairs yet. Type a pair above, select two glyphs and use Kern pair, or select two characters in the text preview.',
    goTo: 'Go to {{chars}} {{code}} in {{block}}',
    searchAllCharacters: 'Search all characters',
    searchAllCommon: 'Search all common pairs',
    includeRare: 'Include rare pairs',
    browseBlock: 'Browse {{block}}',
    importSvgs: 'Import SVGs…',
    importFont: 'Import from a font file…',
    findLigatures: 'Find ligatures in a text…'
  },
  // The grids' accessible names.
  grid: {
    glyphs: 'Glyphs',
    pairs: 'Kerning pairs',
    commonPairs: 'Common kerning pairs'
  },
  // A glyph cell. Its accessible name is the glyph's name and its states, joined with `separator`.
  slot: {
    separator: ', ',
    notInFont: 'not in the font',
    ligature: 'ligature',
    empty: 'empty',
    outOfBounds: 'out of bounds',
    notExported: 'not exported',
    linked: 'linked to a file',
    ligaBadge: 'LIGA',
    createEmpty: 'Create empty glyph',
    copyUnicode: 'Copy unicode value'
  },
  // A pair cell. Its accessible name: "T U+0054 Latin Capital Letter T, then …: <states>".
  pair: {
    label: '{{left}}, then {{right}}: {{states}}',
    separator: ', ',
    kerned: 'kerning {{value}}',
    zero: 'no kerning',
    inherited: 'kerning {{value}}, inherited from {{pair}}',
    none: 'not kerned',
    suggested: 'suggested {{value}}',
    commonRank: 'common pair {{rank}}',
    notInFont: '{{glyph}} is not in the font',
    replacedByLigature: 'replaced by the ligature {{glyph}}',
    suggestedTip: 'Suggested from the outlines (not applied)',
    rank: '#{{rank, number}}',
    ligaBadge: 'LIGA'
  },
  // Metric line names drawn on the glyph canvas.
  canvas: {
    ascender: 'ascender',
    capHeight: 'cap',
    xHeight: 'x',
    baseline: 'baseline',
    descender: 'descender'
  }
} as const
