// Glyph and pair inspectors: sections, fields, options, components, kerning.
export default {
  // Shared by several parts of the inspector.
  goTo: 'Go to {{glyph}}',
  more: '+{{n, number}} more',
  noSvgInClipboard: 'No SVG markup in the clipboard',
  details: 'Details',
  kerning: 'Kerning',
  components: 'Components',

  /** Field names inside history entry names ("Set {{field}} of A"), by field id (options.ts). */
  fields: {
    bounds: 'bounds',
    scale: 'scale',
    scaleFactor: 'scale factor',
    nrmFactor: 'normalize margin',
    valign: 'vertical alignment',
    halign: 'horizontal alignment',
    anchor: 'anchor',
    xshift: 'shift',
    xpush: 'push',
    autoW: 'auto width',
    yoffset: 'Y offset',
    mirror: 'mirror',
    skewRotOrder: 'transform order',
    rot: 'rotation',
    rotAnchor: 'rotation pivot',
    skewX: 'skew X',
    skewY: 'skew Y',
    characterRef: 'glyph',
    contextAnchor: 'context anchor',
    contextBounds: 'context bounds',
    xOffset: 'X offset',
    yOffset: 'Y offset',
    customId: 'custom ID',
    inverted: 'inversion',
    inheritPreviousBounds: 'context',
    isControlLayer: 'control',
    doExport: 'visibility',
    width: 'width',
    height: 'height',
    export: 'export',
    flatten: 'flatten',
    flattenMode: 'flatten mode'
  },

  /** History entry names. */
  history: {
    setFieldOfGlyph: 'Set {{field}} of {{glyph}}',
    setFieldOfGlyphs_one: 'Set {{field}} of {{count, number}} glyph',
    setFieldOfGlyphs_other: 'Set {{field}} of {{count, number}} glyphs',
    rename: 'Rename {{glyph}}',
    setFieldOfComponent: 'Set {{field}} of component {{component}}',
    setFieldOfComponents_one: 'Set {{field}} of {{component}} in {{count, number}} glyph',
    setFieldOfComponents_other: 'Set {{field}} of {{component}} in {{count, number}} glyphs',
    addComponent: 'Add component',
    reorderComponents: 'Reorder components',
    moveComponent: 'Move component',
    // Dragged in the glyph view.
    dragComponent: 'Reposition component {{component}}',
    scaleComponent: 'Scale component {{component}}',
    rotateComponent: 'Rotate component {{component}}',
    removeComponent: 'Remove component {{component}}',
    removeComponents_one: 'Remove {{component}} from {{count, number}} glyph',
    removeComponents_other: 'Remove {{component}} from {{count, number}} glyphs',
    // Not kept in the history (view state).
    toggleComponent: 'Toggle component',
    collapseComponents: 'Collapse components',
    addPair: 'Add kerning pair {{pair}}'
  },

  /** Option lists (options.ts). */
  options: {
    bounds: {
      imported: 'Imported bounds',
      mixedVertical: 'Mixed bounds vertical',
      mixedHorizontal: 'Mixed bounds horizontal',
      glyph: 'Glyph bounds',
      tips: 'Which box is fitted:\n• Imported bounds — the SVG viewBox / marked box\n• Glyph bounds — the tight outline box\n• Mixed — outline box on one axis, imported box on the other'
    },
    scale: {
      baselineAscender: 'Baseline to Ascender',
      ascenderDescender: 'Ascender to Descender',
      baselineXHeight: 'Baseline to x-height',
      baselineCapHeight: 'Baseline to cap height',
      height: 'Height (font metrics)',
      em: 'EM (font metrics)',
      manual: 'Manual',
      normalize: 'Normalize (fit metrics)',
      none: 'None'
    },
    valign: {
      top: 'Top (ascender)',
      baseline: 'Baseline',
      descender: 'Descender',
      spread: 'Vertical spread',
      em: 'EM'
    },
    halign: {
      min: 'Min x',
      minTip: 'Align the bound’s left edge (plus shift)',
      center: 'Center',
      centerTip: 'Center within the advance width',
      max: 'Max x',
      maxTip: 'Align the bound’s right edge (minus push)'
    },
    mirror: {
      none: 'None',
      noneTip: 'Don’t mirror',
      h: 'H',
      hTip: 'Mirror horizontally',
      v: 'V',
      vTip: 'Mirror vertically',
      both: 'Both',
      bothTip: 'Mirror horizontally & vertically'
    },
    skewOrder: {
      rxy: 'Rotate → Skew X → Skew Y',
      ryx: 'Rotate → Skew Y → Skew X',
      xry: 'Skew X → Rotate → Skew Y',
      yrx: 'Skew Y → Rotate → Skew X',
      xyr: 'Skew X → Skew Y → Rotate',
      yxr: 'Skew Y → Skew X → Rotate'
    },
    flatten: {
      smart: 'Smart',
      smartTip: 'Keep the glyph’s vertical fit as the reference',
      fit: 'Fit',
      fitTip: 'Fit the combined outline'
    }
  },

  /** Field labels shared by the glyph transforms and the component fields. */
  transform: {
    scale: 'Scale',
    mirrorRotateSkew: 'Mirror, rotate & skew',
    mirror: 'Mirror',
    rotation: 'Rotation',
    rotationPivot: 'Rotation pivot',
    skewX: 'Skew X',
    skewY: 'Skew Y',
    order: 'Order'
  },

  /** Transforms section (TransformsEditor; also the font's defaults). */
  transforms: {
    title: 'Transforms',
    fit: 'Fit',
    bounds: 'Bounds',
    factor: 'Factor',
    margin: 'Margin',
    marginTip: 'Normalize margin (0.1 = 10% extra room around the fitted box)',
    position: 'Position',
    anchor: 'Anchor',
    vertical: 'Vertical',
    verticalAlignment: 'Vertical alignment',
    horizontal: 'Horizontal',
    horizontalAlignment: 'Horizontal alignment',
    spacing: 'Spacing',
    notWithNormalize: 'Not used while scaling with Normalize',
    shift: 'Shift',
    shiftTip: 'Left side bearing',
    push: 'Push',
    pushTip: 'Right side bearing',
    autoWidth: 'Auto width',
    autoWidthTip: 'Advance = fitted width + shift + push',
    yOffset: 'Y offset',
    // The notice above the fields when a control component drives the spacing.
    controlled: 'Spacing follows the control component <ref>{{glyph}}</ref>: its advance width and frame place the components.',
    controlledNoRef: 'Spacing follows the control component glyph: its advance width and frame place the components.',
    goToThisGlyph: 'Go to this glyph',
    controlledOwnEmpty: 'These transforms have no effect unless Flatten is on.',
    controlledOwnOutline: 'These transforms only place this glyph’s own outline.',
    controlledSome_one:
      '{{count, number}} of these glyphs takes its spacing from a control component; these transforms do not change its advance width.',
    controlledSome_other:
      '{{count, number}} of these glyphs take their spacing from a control component; these transforms do not change their advance width.'
  },

  /** Glyph section. */
  glyph: {
    title: 'Glyph',
    name: 'Name',
    nameTip: 'PostScript glyph name written to the font (optional)',
    nameAuto: 'automatic',
    width: 'Width',
    widthAuto: 'Computed from the outline (auto width is on)',
    widthTip: 'Advance width — leave linked to use the font width',
    height: 'Height',
    heightTip: 'Reference height — leave linked to use the font height',
    export: 'Export',
    exportTip: 'Include in exported fonts',
    flatten: 'Flatten',
    flattenTip: 'Fit the combined outline (glyph + components) as a whole',
    flattenMode: 'Flatten mode'
  },

  /** The frame of the component selected in the glyph view (ComponentFrame). */
  frame: {
    label: 'Component {{component}}',
    description: 'Drag it to move it (with Shift, along one axis), a corner to scale it, the knob to rotate it. The arrow keys move it by 1 unit, by 10 with Shift. Escape deselects it.',
    scaleTip: 'Scale from the component anchor (with Alt, from the opposite corner)',
    rotateTip: 'Rotate around the rotation pivot (with Shift, in steps of 15°)'
  },

  /** Glyph view and identity at the top of the inspector (GlyphHeader). */
  header: {
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    resizeView: 'Resize glyph view',
    pixels: '{{value}} pixels',
    copyCharacter: 'Copy character',
    copyCharacterName: 'Copy character {{glyph}}',
    ligature: 'Ligature',
    // A character's general category in the header: its name and the standard's code.
    category: '{{name}} ({{gc}})',
    unknownCharacter: 'Unknown character',
    copyUnicode: 'Copy unicode value',
    copyCode: 'Copy {{code}}',
    notInFont: 'not in font',
    live: 'Live: {{file}}',
    unbind: 'Unbind',
    importSvg: 'Import an SVG into this glyph',
    pasteSvg: 'Paste SVG markup from the clipboard',
    copyGlyph: 'Copy glyph (Ctrl+C)',
    externalEditor: 'Edit in external editor (live reload)',
    moreActions: 'More actions'
  },

  /** A selected slot with no glyph yet. */
  emptySlot: {
    createEmpty: 'Create empty glyph',
    createFromComponents: 'Create from components',
    createFromComponentsTip: 'Creates the glyph with components from its Unicode decomposition (creates missing parts too)',
    importSvg: 'Import SVG…',
    pasteSvg: 'Paste SVG',
    noSvgHint: 'Copy paths from your vector editor first.',
    dropTip: 'Tip: drop an SVG file on any slot to import it there.'
  },

  /** Several glyphs selected. */
  multi: {
    selected: '{{count, number}} selected',
    existing: '{{n, number}} exist',
    existingAndEmpty_one: '{{n, number}} exist · {{count, number}} empty slot',
    existingAndEmpty_other: '{{n, number}} exist · {{count, number}} empty slots',
    create: 'Create {{n, number}}',
    ligature: 'Ligature',
    ligatureTip: 'Create the ligature “{{chars}}” (selection order)',
    kernPair: 'Kern pair',
    kernPairTip: 'Kern “{{chars}}” (selection order)',
    compose: 'Compose',
    composeTip: 'Create components from Unicode decompositions',
    reset: 'Reset',
    clearAll: 'Clear outline & components',
    clearKeepComponents: 'Clear outline, keep components',
    rebuild: 'Rebuild from decomposition',
    delete: 'Delete',
    createFirst: 'Create the selected glyphs to edit their properties together.'
  },

  /** Nothing selected. */
  placeholder: {
    title: 'Select one or more glyphs to edit them here.',
    multiSelect: '<k>Ctrl</k> / <k>Shift</k> + click to multi-select',
    storeSelection: '<k>Ctrl</k>+<k>0-9</k> stores a selection, <k>0-9</k> restores it',
    dropSvg: 'Drop SVG files on a slot to import them',
    palette: '<k>Ctrl</k>+<k>P</k> opens the command palette'
  },

  /** Details section. */
  detailsSection: {
    notListed: '{{code}} is not listed',
    notListedHint: 'It is not in the font, and no view lists unassigned or control characters.',
    advance: 'Advance',
    exported: 'Exported',
    exportedYes: 'yes',
    exportedSkipped: 'skipped (out of bounds)',
    outlineWidth: 'Outline width',
    outlineHeight: 'Outline height',
    leftBearing: 'Left bearing',
    rightBearing: 'Right bearing',
    usedAsComponent: 'Used as component ×{{n, number}}',
    selectAll: 'Select all',
    decomposition: 'Decomposition ({{n, number}})',
    decompositionTagged: 'Decomposition · {{tag}} ({{n, number}})',
    relatives: 'Relatives ({{n, number}})'
  },

  /** Components section, single glyph and multi-selection. */
  componentsSection: {
    empty: '(empty)',
    replace: 'Replace components',
    add: 'Add components',
    copyTransforms: 'Copy component transforms',
    copyTransformsHint: 'Applies copied settings to components with the same glyph',
    pasteTip: 'Paste components from copied glyphs',
    addEmpty: 'Add an empty component',
    searchAdd: 'Search & add components',
    decompose: 'Create components from the Unicode decomposition',
    noDecomposition: 'No decomposition for this character',
    showAll: 'Show all',
    hideAll: 'Hide all',
    collapseAll: 'Collapse all',
    visibilityFolding: 'Visibility & folding',
    none: 'Components place other glyphs inside this one (accents, ligature parts…). Add one with + or build them from the Unicode decomposition.',
    move: 'Move {{component}}',
    moveDescription: 'Drag, or use the up and down arrow keys',
    moveTip: 'Drag to reorder (or focus and use ↑ ↓)',
    expand: 'Expand {{component}}',
    control: 'control',
    controlTip: 'Control component: drives width & context',
    controlInactive: 'control (inactive)',
    controlInactiveTip: 'Flagged as control but its glyph is missing or circular',
    circular: 'circular',
    circularTip: 'This glyph uses the host glyph: the component is ignored',
    missing: 'missing',
    missingTip: 'No glyph exists for this character yet',
    inverted: 'inverted',
    hide: 'Hide component',
    show: 'Show component',
    moveUp: 'Move up',
    moveDown: 'Move down',
    remove: 'Remove component',
    // Multi-selection
    addToAll: 'Add components to every selected glyph',
    decomposeAll: 'Create components from decompositions',
    showAllComponents: 'Show all components',
    hideAllComponents: 'Hide all components',
    noneInSelection: 'None of the selected glyphs have components.',
    inGlyphs_one: 'in {{n, number}} of {{count, number}} glyph',
    inGlyphs_other: 'in {{n, number}} of {{count, number}} glyphs',
    toggleVisibility: 'Toggle visibility',
    removeFromAll: 'Remove from all selected glyphs'
  },

  /** Component fields (LayerFields). */
  layer: {
    glyph: 'Glyph',
    glyphTip: 'Character, ligature or U+XXXX of the glyph used as this component',
    glyphPlaceholder: 'e.g. A, U+0301',
    pickGlyph: 'Pick a glyph',
    pickTitle: 'Choose component glyph',
    context: 'Context',
    contextTip: 'Where, in the host glyph, the component is attached',
    contextAnchor: 'Context anchor',
    contextBounds: 'How the host bounds are measured',
    component: 'Component',
    componentTip: 'Which point of the component is attached',
    componentAnchor: 'Component anchor',
    componentBounds: 'How the component bounds are measured',
    xOffset: 'Horizontal offset',
    yOffset: 'Vertical offset',
    special: 'Special',
    customId: 'Custom ID',
    customIdTip: 'Name shared by components across glyphs, for batch editing and search',
    customIdNone: 'none',
    invert: 'Invert (reverse winding to cut holes)',
    previousContext: 'Use previous component as context',
    control: 'Control component (drives width & context)',
    controlTip: 'The host takes this component\'s advance width, and other components attach to it'
  },

  /** Kerning section of the glyph inspector. */
  kerningSection: {
    showPairs: 'Show these pairs in the Kerning view',
    asLeft: '{{glyph}} + …',
    asRight: '… + {{glyph}}',
    inheritedFrom: 'Inherited from {{glyph}} ({{n, number}})',
    none: 'No kerning pairs with {{glyph}} yet.',
    suggested: 'Suggested from the outlines ({{n, number}})',
    applySuggestedTip: 'Give these pairs the values measured from the outlines (one undo step)',
    applyIt: 'Apply it',
    applyAll: 'Apply all {{n, number}}',
    showInDetected: 'Show in Detected pairs',
    showPairInDetected: 'Show {{pair}} in Detected pairs',
    notInFont: '{{glyph}} is not in the font',
    replacedByLigature: 'Replaced by the ligature {{glyph}}',
    showInKerning: 'Show in the Kerning view',
    showPairInKerning: 'Show {{pair}} in the Kerning view',
    alsoApplies: 'Also applies to {{pairs}} (accented letters follow their base letter)',
    alsoAppliesCount_one: 'Also applies to {{count, number}} accented pair',
    alsoAppliesCount_other: 'Also applies to {{count, number}} accented pairs',
    kerningOf: 'Kerning of {{pair}}',
    followsBase: '{{pair}} follows its base letters\' pair',
    remove: 'Remove {{pair}}',
    giveMeasured: 'Give {{pair}} the value measured from the outlines',
    applyTo: 'Apply {{value}} to {{pair}}',
    apply: 'Apply',
    typeOther: 'Type the other glyph',
    typeOtherHint: 'A character, a U+ code, or a ligature like fi.',
    alreadyPair: '{{pair}} is already a pair',
    side: 'Side of {{glyph}} in the new pair',
    first: '{{glyph}} +',
    firstTip: '{{glyph}} first',
    second: '+ {{glyph}}',
    secondTip: '{{glyph}} second',
    otherPlaceholder: 'Other glyph, e.g. A',
    glyphAfter: 'Glyph after {{glyph}}',
    glyphBefore: 'Glyph before {{glyph}}',
    addPair: 'Add the pair'
  },

  /** Inspector of the pair views (PairInspector). */
  pair: {
    tighten_one: 'Tighten by {{count, number}} unit',
    tighten_other: 'Tighten by {{count, number}} units',
    loosen_one: 'Loosen by {{count, number}} unit',
    loosen_other: 'Loosen by {{count, number}} units',
    state: {
      kerned: 'Kerned',
      zero: 'No kerning',
      inherited: 'Inherited',
      none: 'Not kerned'
    },
    // "Exported" in the Details section.
    exportedYes: 'yes',
    exportedNotKerned: 'no: not kerned',
    exportedNotInFont: 'no: {{glyph}} not in the font',
    exportedNotInFontBoth: 'no: {{first}} and {{second}} not in the font',
    exportedNotExported: 'no: {{glyph}} not exported',
    exportedNotExportedBoth: 'no: {{first}} and {{second}} not exported',
    exportedZero: 'no: nothing to kern',
    exportedInherited: 'yes, inherited from {{pair}}',
    // Under the value field.
    follows: 'Follows {{pair}}: {{base}} is the base letter of {{accented}}. Type a value to give this pair its own.',
    ownValue: 'Its own value; {{pair}} would give {{value}}.',
    follow: 'Follow {{pair}}',
    measured: 'Not kerned yet. Measured from the outlines, about {{value}} would even its spacing: check it by eye.',
    notKernedYet: 'Not kerned yet: a value adds the pair to the font.',
    title: 'Kerning pair {{pair}}',
    rank: '#{{n, number}} common pair',
    rankTip: 'Its rank in the common pairs list (1 is the most relevant)',
    missing: '{{glyph}} is not in the font. The pair is kept, and exported once it exists.',
    missingBoth: '{{first}} and {{second}} are not in the font. The pair is kept, and exported once they exist.',
    createIt: 'Create it',
    createThem: 'Create them',
    ligature:
      'Never applied while ligatures are on: the ligature {{ligature}} replaces {{left}} followed by {{right}}. Kern the ligature with its neighbours instead.',
    goToLigature: 'Go to the ligature',
    value: 'Value',
    valueTip: 'Added to the space between the two glyphs, in font units: negative values bring them closer',
    units: 'units',
    applyTip: 'Give the pair the value measured from the outlines',
    apply: 'Apply {{value}}',
    noKerning: 'No kerning',
    noKerningTip: 'Keep the pair at 0: checked, nothing to kern (not exported)',
    remove: 'Remove',
    removeTip: 'Remove its own value: it follows {{pair}} again',
    exported: 'Exported',
    advanceOf: 'Advance of {{glyph}}',
    rankLabel: 'Common pairs rank',
    rankValue: '#{{n, number}} of {{total, number}}',
    notListed: 'not listed',
    measuredLabel: 'Measured from the outlines',
    // Several pairs selected.
    selected_one: '{{count, number}} pair selected',
    selected_other: '{{count, number}} pairs selected',
    notKerned: '{{n, number}} not kerned',
    valueAllTip: 'Sets every selected pair to this value',
    applySuggestedTip: 'Give the pairs not kerned yet the values measured from their outlines',
    applySuggested: 'Apply {{n, number}} suggested',
    noKerningAllTip: 'Keep the pairs at 0: checked, nothing to kern (not exported)',
    inherit: 'Inherit {{n, number}}',
    inheritTip: 'Drop their own values: they follow their base letters\' pairs again',
    removeCount: 'Remove {{n, number}}',
    // Nothing selected.
    placeholder: 'Select a pair to edit its kerning.',
    typePair: 'Type a pair in the Kerning view (AV)',
    selectTwo: 'Select two glyphs, then Kern pair',
    selectInPreview: 'Select two characters in the text preview',
    doubleClick: 'Double-click a pair to type its value'
  }
} as const
