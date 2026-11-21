// Edits: glyph actions, clipboard, kerning edits, external editing; toasts and history entry names.
// One glyph or pair is named ("…Glyph", "…Pair"), several are counted ("…Glyphs", "…Pairs").
import type en from '../en/edit'
import type { Catalog } from '../catalog'

export default {
  // History entry names (History panel, undo notices).
  history: {
    createGlyph: 'Créer {{glyph}}',
    createGlyphs_one: 'Créer {{count, number}} glyphe',
    createGlyphs_many: 'Créer {{count, number}} glyphes',
    createGlyphs_other: 'Créer {{count, number}} glyphes',
    deleteGlyph: 'Supprimer {{glyph}}',
    deleteGlyphs_one: 'Supprimer {{count, number}} glyphe',
    deleteGlyphs_many: 'Supprimer {{count, number}} glyphes',
    deleteGlyphs_other: 'Supprimer {{count, number}} glyphes',
    resetGlyph: 'Réinitialiser {{glyph}}',
    resetGlyphs_one: 'Réinitialiser {{count, number}} glyphe',
    resetGlyphs_many: 'Réinitialiser {{count, number}} glyphes',
    resetGlyphs_other: 'Réinitialiser {{count, number}} glyphes',
    rebuildGlyph: 'Reconstruire {{glyph}}',
    rebuildGlyphs_one: 'Reconstruire {{count, number}} glyphe',
    rebuildGlyphs_many: 'Reconstruire {{count, number}} glyphes',
    rebuildGlyphs_other: 'Reconstruire {{count, number}} glyphes',
    composeGlyph: 'Composer {{glyph}}',
    composeGlyphs_one: 'Composer {{count, number}} glyphe',
    composeGlyphs_many: 'Composer {{count, number}} glyphes',
    composeGlyphs_other: 'Composer {{count, number}} glyphes',
    addComponent: 'Ajouter le composant {{glyph}}',
    addComponents_one: 'Ajouter {{count, number}} composant',
    addComponents_many: 'Ajouter {{count, number}} composants',
    addComponents_other: 'Ajouter {{count, number}} composants',
    showAllComponents: 'Afficher tous les composants',
    hideAllComponents: 'Masquer tous les composants',
    createLigature: 'Créer la ligature {{chars}}',
    reloadGlyph: 'Recharger {{glyph}} depuis le fichier',
    reloadGlyphs_one: 'Recharger {{count, number}} glyphe depuis le fichier',
    reloadGlyphs_many: 'Recharger {{count, number}} glyphes depuis les fichiers',
    reloadGlyphs_other: 'Recharger {{count, number}} glyphes depuis les fichiers',
    pasteOntoGlyph: 'Coller sur {{glyph}}',
    pasteOntoGlyphs_one: 'Coller sur {{count, number}} glyphe',
    pasteOntoGlyphs_many: 'Coller sur {{count, number}} glyphes',
    pasteOntoGlyphs_other: 'Coller sur {{count, number}} glyphes',
    pasteSvgInto: 'Coller un SVG dans {{glyph}}',
    pasteInPlace_one: 'Coller {{count, number}} glyphe sur place',
    pasteInPlace_many: 'Coller {{count, number}} glyphes sur place',
    pasteInPlace_other: 'Coller {{count, number}} glyphes sur place',
    pasteTransforms_one: 'Coller les transformations sur {{count, number}} glyphe',
    pasteTransforms_many: 'Coller les transformations sur {{count, number}} glyphes',
    pasteTransforms_other: 'Coller les transformations sur {{count, number}} glyphes',
    replaceComponents: 'Remplacer les composants',
    pasteComponents: 'Coller les composants',
    pasteComponentTransforms: 'Coller les transformations des composants',
    addPair: 'Ajouter la paire de crénage {{pair}}',
    setKerningPair: 'Modifier le crénage de {{pair}}',
    setKerningPairs_one: 'Modifier le crénage de {{count, number}} paire',
    setKerningPairs_many: 'Modifier le crénage de {{count, number}} paires',
    setKerningPairs_other: 'Modifier le crénage de {{count, number}} paires',
    applySuggestionPair: 'Appliquer le crénage suggéré à {{pair}}',
    applySuggestionPairs_one: 'Appliquer {{count, number}} valeur de crénage suggérée',
    applySuggestionPairs_many: 'Appliquer {{count, number}} valeurs de crénage suggérées',
    applySuggestionPairs_other: 'Appliquer {{count, number}} valeurs de crénage suggérées',
    inheritPair: 'Hériter le crénage pour {{pair}}',
    inheritPairs_one: 'Hériter le crénage pour {{count, number}} paire',
    inheritPairs_many: 'Hériter le crénage pour {{count, number}} paires',
    inheritPairs_other: 'Hériter le crénage pour {{count, number}} paires',
    inheritOn: 'Les lettres accentuées suivent leur lettre de base',
    inheritOff: 'Les lettres accentuées ont leur propre crénage',
    removePair: 'Retirer la paire de crénage {{pair}}',
    removePairs_one: 'Retirer {{count, number}} paire de crénage',
    removePairs_many: 'Retirer {{count, number}} paires de crénage',
    removePairs_other: 'Retirer {{count, number}} paires de crénage'
  },

  // Undo notice after an edit (actions.ts offerUndo).
  undo: {
    action: 'Annuler',
    fontClosed: 'La police a été fermée',
    /** By kind of edit. */
    alreadyUndone: {
      delete: 'La suppression est déjà annulée',
      change: 'La modification est déjà annulée',
      removal: 'Le retrait est déjà annulé'
    },
    notUndone: {
      delete: 'La suppression n’a pas été annulée',
      change: 'La modification n’a pas été annulée',
      removal: 'Le retrait n’a pas été annulé'
    },
    notUndoneDetail: 'D’autres modifications ont suivi. Utilisez le panneau Historique pour revenir en arrière.'
  },

  // Glyph actions (app/actions.ts).
  allSlotsHaveGlyphs: 'Toutes les cases sélectionnées ont déjà un glyphe',
  createMany: {
    title_one: 'Créer {{count, number}} glyphe ?',
    title_many: 'Créer {{count, number}} glyphes ?',
    title_other: 'Créer {{count, number}} glyphes ?',
    message: 'Créer autant de glyphes d’un coup peut ralentir l’éditeur.',
    confirm: 'Créer'
  },
  deletedGlyph: '{{glyph}} supprimé',
  deletedGlyphs_one: '{{count, number}} glyphe supprimé',
  deletedGlyphs_many: '{{count, number}} glyphes supprimés',
  deletedGlyphs_other: '{{count, number}} glyphes supprimés',
  noDecomposition: 'Aucune décomposition disponible',
  noDecompositionDetail: 'Seuls les caractères ayant une décomposition Unicode (comme é = e + ◌́) peuvent être composés automatiquement.',
  alsoCreatedComponents_one: '{{count, number}} glyphe composant manquant a aussi été créé',
  alsoCreatedComponents_many: '{{count, number}} glyphes composants manquants ont aussi été créés',
  alsoCreatedComponents_other: '{{count, number}} glyphes composants manquants ont aussi été créés',
  alsoCreatedComponentsDetail: 'Ils sont vides : importez-les ou dessinez-les pour compléter la composition.',
  /** Glyph picker opened to add components (title and button). */
  addComponents: 'Ajouter des composants',
  ligatureNeedsTwo: 'Sélectionnez au moins deux caractères pour créer une ligature',
  ligatureExists: 'Cette ligature existe déjà — elle est sélectionnée',
  copiedCharacters_one: '{{count, number}} caractère copié',
  copiedCharacters_many: '{{count, number}} caractères copiés',
  copiedCharacters_other: '{{count, number}} caractères copiés',
  copiedUnicodeValues_one: '{{count, number}} valeur Unicode copiée',
  copiedUnicodeValues_many: '{{count, number}} valeurs Unicode copiées',
  copiedUnicodeValues_other: '{{count, number}} valeurs Unicode copiées',
  copiedOutline: 'Contour de {{glyph}} copié en SVG',

  // Selection slots 0–9.
  presets: {
    stored: 'Sélection enregistrée dans la mémoire {{slot}}',
    cleared: 'Mémoire de sélection {{slot}} vidée',
    glyphs_one: '{{count, number}} glyphe',
    glyphs_many: '{{count, number}} glyphes',
    glyphs_other: '{{count, number}} glyphes',
    empty: 'La mémoire de sélection {{slot}} est vide',
    emptyDetail: 'Utilisez Ctrl+{{slot}} pour y enregistrer la sélection actuelle.'
  },

  // Illustrator artboard template.
  artboards: {
    tooMany: 'Illustrator accepte au plus {{max, number}} plans de travail',
    tooManyDetail_one: 'Seuls les {{max, number}} premiers glyphes sur {{count, number}} sont inclus.',
    tooManyDetail_many: 'Seuls les {{max, number}} premiers glyphes sur {{count, number}} sont inclus.',
    tooManyDetail_other: 'Seuls les {{max, number}} premiers glyphes sur {{count, number}} sont inclus.',
    /** Save dialog title. */
    saveTitle: 'Enregistrer le script Illustrator',
    saved: 'Script Illustrator enregistré',
    savedDetail: 'Lancez-le depuis Fichier › Scripts › Autre script… pour créer un plan de travail par glyphe.'
  },

  // Bound files and external editing (app/bindings.ts).
  bindings: {
    unbound: '{{fileName}} délié',
    unboundDetail: 'Le fichier a été supprimé.',
    couldNotReloadGlyph: 'Impossible de recharger {{glyph}}',
    couldNotReloadGlyphs_one: 'Impossible de recharger {{count, number}} glyphe',
    couldNotReloadGlyphs_many: 'Impossible de recharger {{count, number}} glyphes',
    couldNotReloadGlyphs_other: 'Impossible de recharger {{count, number}} glyphes',
    couldNotReloadFile: 'Impossible de recharger {{fileName}}',
    pickEditor: {
      title: 'Quelle application doit modifier les SVG ?',
      message: 'Choisissez votre éditeur vectoriel (Illustrator, Inkscape, Affinity…). Vous pourrez le changer plus tard dans les Préférences.',
      choose: 'Choisir une application…',
      systemDefault: 'Utiliser l’application par défaut',
      /** File dialog title. */
      dialogTitle: 'Choisissez votre éditeur SVG'
    },
    needsDesktop: 'La modification externe nécessite l’application de bureau',
    couldNotOpenEditor: 'Impossible d’ouvrir l’éditeur',
    editing: '{{glyph}} en cours de modification externe',
    editingDetail: 'Les modifications enregistrées dans l’éditeur mettent le glyphe à jour.'
  },

  // Copy and paste (app/clipboard.ts).
  clipboard: {
    nothingToCopy: 'Rien à copier',
    nothingToCopyDetail: 'Sélectionnez d’abord des glyphes existants.',
    copiedGlyph: '{{glyph}} copié',
    copiedGlyphs_one: '{{count, number}} glyphe copié',
    copiedGlyphs_many: '{{count, number}} glyphes copiés',
    copiedGlyphs_other: '{{count, number}} glyphes copiés',
    selectWhere: 'Sélectionnez où coller',
    selectWhereDetail: 'Les glyphes collés sont répartis sur la sélection.',
    selectSvgTarget: 'Sélectionnez un glyphe où coller le SVG',
    nothingToPaste: 'Rien à coller',
    nothingToPasteDetail: 'Copiez des glyphes, ou du code SVG depuis un éditeur vectoriel.',
    nothingToPasteInPlaceDetail: 'Copiez d’abord des glyphes.',
    couldNotPasteSvg: 'Impossible de coller le SVG',
    svgNoPaths: 'Il ne contient aucun tracé utilisable.',
    inPlaceSameFont: 'Coller sur place copie des glyphes d’une police à l’autre',
    inPlaceSameFontDetail: 'Ouvrez une autre police, puis collez sur place.',
    selectTransformsTarget: 'Sélectionnez des glyphes existants où coller les transformations',
    copyGlyphFirst: 'Copiez d’abord un glyphe',
    selectExisting: 'Sélectionnez d’abord des glyphes existants',
    copyComponentsFirst: 'Copiez d’abord un glyphe avec des composants'
  },

  // Kerning edits (app/kerning.ts).
  kerning: {
    pairExists: 'Cette paire existe déjà — elle est sélectionnée',
    typeTwo: 'Tapez deux caractères pour ajouter une paire',
    typeTwoDetail: 'Ou deux glyphes séparés par une espace, comme « fi x » pour une ligature suivie de x.',
    appliedSuggestions_one: '{{count, number}} valeur de crénage suggérée appliquée',
    appliedSuggestions_many: '{{count, number}} valeurs de crénage suggérées appliquées',
    appliedSuggestions_other: '{{count, number}} valeurs de crénage suggérées appliquées',
    removedPair: 'Paire de crénage {{pair}} retirée',
    removedPairs_one: '{{count, number}} paire de crénage retirée',
    removedPairs_many: '{{count, number}} paires de crénage retirées',
    removedPairs_other: '{{count, number}} paires de crénage retirées',
    copiedPairs_one: '{{count, number}} paire copiée',
    copiedPairs_many: '{{count, number}} paires copiées',
    copiedPairs_other: '{{count, number}} paires copiées'
  }
} satisfies Catalog<typeof en>
