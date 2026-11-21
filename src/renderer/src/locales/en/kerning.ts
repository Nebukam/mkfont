// Kerning vocabulary shared by the Browse panel, the viewport and the inspector.
export default {
  /** Sub-lists of the common pairs (core/common-pairs.ts COMMON_GROUPS). */
  commonGroups: {
    all: { name: 'All pairs', tip: 'Every common pair, except those with a space (they have their own list)' },
    upper: { name: 'Capitals', tip: 'Two capital letters: AV, TA…' },
    mixed: { name: 'Mixed case', tip: 'A capital and a lowercase letter: To, Va…' },
    lower: { name: 'Lowercase', tip: 'Two lowercase letters: ry, ve…' },
    punct: { name: 'Punctuation & figures', tip: 'A punctuation mark, figure or symbol and another character: T., “A, 17…' },
    space: { name: 'With a space', tip: 'A character next to a space: kerning these changes word spacing' }
  }
} as const
