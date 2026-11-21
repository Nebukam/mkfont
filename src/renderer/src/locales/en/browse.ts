// Browse panel (left sidebar): the ranges a font can be browsed by.
export default {
  title: 'Browse',
  groups: {
    font: 'Font',
    pairs: 'Kerning pairs',
    categories: 'Categories',
    blocks: 'Unicode blocks'
  },
  myGlyphs: 'My glyphs',
  ligatures: 'Ligatures',
  kerning: 'Kerning',
  allCharacters: 'All characters',
  detected: 'Detected',
  commonPairs: 'Common pairs',
  filterBlocks: 'Filter blocks',
  clearFilter: 'Clear filter',
  onlyUsedBlocks: 'Only blocks with glyphs',
  noBlockMatch: 'No block matches “{{filter}}”.'
} as const
