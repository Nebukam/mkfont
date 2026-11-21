// Unicode general categories, as the Browse panel, the view's title and the inspector
// name them. Groups are keyed by their id (core/unicode CATEGORY_GROUPS), categories by
// the standard's two-letter code, which is shown beside the name and is the same in
// every language.
export default {
  categoryGroups: {
    Letter: 'Letter',
    Mark: 'Mark',
    Number: 'Number',
    Separator: 'Separator',
    Other: 'Other',
    Punctuation: 'Punctuation',
    Symbol: 'Symbol'
  },
  categories: {
    Lu: 'Uppercase',
    Ll: 'Lowercase',
    Lt: 'Titlecase',
    Lm: 'Modifier',
    Lo: 'Other Letter',
    Mn: 'Non-Spacing',
    Mc: 'Spacing Combining',
    Me: 'Enclosing',
    Nd: 'Decimal Digit',
    Nl: 'Letter Number',
    No: 'Other Number',
    Zs: 'Space',
    Zl: 'Line',
    Zp: 'Paragraph',
    Cc: 'Control',
    Cf: 'Format',
    Cs: 'Surrogate',
    Co: 'Private Use',
    Cn: 'Unassigned',
    Pc: 'Connector',
    Pd: 'Dash',
    Ps: 'Open',
    Pe: 'Close',
    Pi: 'Initial Quote',
    Pf: 'Final Quote',
    Po: 'Other Punctuation',
    Sm: 'Math',
    Sc: 'Currency',
    Sk: 'Modifier Symbol',
    So: 'Other Symbol'
  }
} as const
