// Glyph and pair inspectors: sections, fields, options, components, kerning.
import type en from '../en/inspector'
import type { Catalog } from '../catalog'

export default {
  // Shared by several parts of the inspector.
  goTo: 'Aller à {{glyph}}',
  more: '+{{n, number}} de plus',
  noSvgInClipboard: 'Aucun code SVG dans le presse-papiers',
  details: 'Détails',
  kerning: 'Crénage',
  components: 'Composants',

  /** Field names inside history entry names ("Set {{field}} of A"), by field id (options.ts). */
  fields: {
    bounds: 'boîte',
    scale: 'échelle',
    scaleFactor: 'facteur d’échelle',
    nrmFactor: 'marge de normalisation',
    valign: 'alignement vertical',
    halign: 'alignement horizontal',
    anchor: 'ancre',
    xshift: 'décalage',
    xpush: 'poussée',
    autoW: 'largeur auto',
    yoffset: 'décalage Y',
    mirror: 'miroir',
    skewRotOrder: 'ordre des transformations',
    rot: 'rotation',
    rotAnchor: 'pivot de rotation',
    skewX: 'inclinaison X',
    skewY: 'inclinaison Y',
    characterRef: 'glyphe',
    contextAnchor: 'ancre du contexte',
    contextBounds: 'boîte du contexte',
    xOffset: 'décalage X',
    yOffset: 'décalage Y',
    customId: 'ID personnalisé',
    inverted: 'inversion',
    inheritPreviousBounds: 'contexte',
    isControlLayer: 'contrôle',
    doExport: 'visibilité',
    width: 'largeur',
    height: 'hauteur',
    export: 'exportation',
    flatten: 'aplatissement',
    flattenMode: 'mode d’aplatissement'
  },

  /** History entry names. */
  history: {
    setFieldOfGlyph: 'Modifier « {{field}} » de {{glyph}}',
    setFieldOfGlyphs_one: 'Modifier « {{field}} » de {{count, number}} glyphe',
    setFieldOfGlyphs_many: 'Modifier « {{field}} » de {{count, number}} glyphes',
    setFieldOfGlyphs_other: 'Modifier « {{field}} » de {{count, number}} glyphes',
    rename: 'Renommer {{glyph}}',
    setFieldOfComponent: 'Modifier « {{field}} » du composant {{component}}',
    setFieldOfComponents_one: 'Modifier « {{field}} » de {{component}} dans {{count, number}} glyphe',
    setFieldOfComponents_many: 'Modifier « {{field}} » de {{component}} dans {{count, number}} glyphes',
    setFieldOfComponents_other: 'Modifier « {{field}} » de {{component}} dans {{count, number}} glyphes',
    addComponent: 'Ajouter un composant',
    reorderComponents: 'Réordonner les composants',
    moveComponent: 'Déplacer un composant',
    // Dragged in the glyph view.
    dragComponent: 'Repositionner le composant {{component}}',
    scaleComponent: 'Mettre à l’échelle le composant {{component}}',
    rotateComponent: 'Faire pivoter le composant {{component}}',
    removeComponent: 'Retirer le composant {{component}}',
    removeComponents_one: 'Retirer {{component}} de {{count, number}} glyphe',
    removeComponents_many: 'Retirer {{component}} de {{count, number}} glyphes',
    removeComponents_other: 'Retirer {{component}} de {{count, number}} glyphes',
    // Not kept in the history (view state).
    toggleComponent: 'Afficher/masquer le composant',
    collapseComponents: 'Replier les composants',
    addPair: 'Ajouter la paire de crénage {{pair}}'
  },

  /** Option lists (options.ts). */
  options: {
    bounds: {
      imported: 'Boîte importée',
      mixedVertical: 'Boîte mixte verticale',
      mixedHorizontal: 'Boîte mixte horizontale',
      glyph: 'Boîte du glyphe',
      tips: 'Quelle boîte est ajustée :\n• Boîte importée — la viewBox du SVG / la boîte repérée\n• Boîte du glyphe — la boîte serrée du contour\n• Mixte — boîte du contour sur un axe, boîte importée sur l’autre'
    },
    scale: {
      baselineAscender: 'Ligne de base à ascendante',
      ascenderDescender: 'Ascendante à descendante',
      baselineXHeight: 'Ligne de base à hauteur d’x',
      baselineCapHeight: 'Ligne de base à hauteur de capitale',
      height: 'Hauteur (métriques de la police)',
      em: 'EM (métriques de la police)',
      manual: 'Manuelle',
      normalize: 'Normaliser (ajuster aux métriques)',
      none: 'Aucune'
    },
    valign: {
      top: 'Haut (ascendante)',
      baseline: 'Ligne de base',
      descender: 'Descendante',
      spread: 'Étendue verticale',
      em: 'EM'
    },
    halign: {
      min: 'x min',
      minTip: 'Aligner le bord gauche de la boîte (plus le décalage)',
      center: 'Centre',
      centerTip: 'Centrer dans la chasse',
      max: 'x max',
      maxTip: 'Aligner le bord droit de la boîte (moins la poussée)'
    },
    mirror: {
      none: 'Aucun',
      noneTip: 'Pas de miroir',
      h: 'H',
      hTip: 'Miroir horizontal',
      v: 'V',
      vTip: 'Miroir vertical',
      both: 'Les deux',
      bothTip: 'Miroir horizontal et vertical'
    },
    skewOrder: {
      rxy: 'Rotation → Inclinaison X → Inclinaison Y',
      ryx: 'Rotation → Inclinaison Y → Inclinaison X',
      xry: 'Inclinaison X → Rotation → Inclinaison Y',
      yrx: 'Inclinaison Y → Rotation → Inclinaison X',
      xyr: 'Inclinaison X → Inclinaison Y → Rotation',
      yxr: 'Inclinaison Y → Inclinaison X → Rotation'
    },
    flatten: {
      smart: 'Intelligent',
      smartTip: 'Garder l’ajustement vertical du glyphe comme référence',
      fit: 'Ajuster',
      fitTip: 'Ajuster le contour combiné'
    }
  },

  /** Field labels shared by the glyph transforms and the component fields. */
  transform: {
    scale: 'Échelle',
    mirrorRotateSkew: 'Miroir, rotation et inclinaison',
    mirror: 'Miroir',
    rotation: 'Rotation',
    rotationPivot: 'Pivot de rotation',
    skewX: 'Inclinaison X',
    skewY: 'Inclinaison Y',
    order: 'Ordre'
  },

  /** Transforms section (TransformsEditor; also the font's defaults). */
  transforms: {
    title: 'Transformations',
    fit: 'Ajustement',
    bounds: 'Boîte',
    factor: 'Facteur',
    margin: 'Marge',
    marginTip: 'Marge de normalisation (0,1 = 10 % d’espace en plus autour de la boîte ajustée)',
    position: 'Position',
    anchor: 'Ancre',
    vertical: 'Vertical',
    verticalAlignment: 'Alignement vertical',
    horizontal: 'Horizontal',
    horizontalAlignment: 'Alignement horizontal',
    spacing: 'Espacement',
    notWithNormalize: 'Inutilisé avec l’échelle Normaliser',
    shift: 'Décalage',
    shiftTip: 'Approche gauche',
    push: 'Poussée',
    pushTip: 'Approche droite',
    autoWidth: 'Largeur auto',
    autoWidthTip: 'Chasse = largeur ajustée + décalage + poussée',
    yOffset: 'Décalage Y',
    // The notice above the fields when a control component drives the spacing.
    controlled: 'L’espacement suit le composant de contrôle <ref>{{glyph}}</ref> : sa chasse et son cadre placent les composants.',
    controlledNoRef: 'L’espacement suit le glyphe du composant de contrôle : sa chasse et son cadre placent les composants.',
    goToThisGlyph: 'Aller à ce glyphe',
    controlledOwnEmpty: 'Ces transformations n’ont aucun effet sauf si Aplatir est activé.',
    controlledOwnOutline: 'Ces transformations ne placent que le contour propre de ce glyphe.',
    controlledSome_one: '{{count, number}} de ces glyphes prend son espacement d’un composant de contrôle ; ces transformations ne changent pas sa chasse.',
    controlledSome_many: '{{count, number}} de ces glyphes prennent leur espacement d’un composant de contrôle ; ces transformations ne changent pas leur chasse.',
    controlledSome_other: '{{count, number}} de ces glyphes prennent leur espacement d’un composant de contrôle ; ces transformations ne changent pas leur chasse.'
  },

  /** Glyph section. */
  glyph: {
    title: 'Glyphe',
    name: 'Nom',
    nameTip: 'Nom de glyphe PostScript écrit dans la police (facultatif)',
    nameAuto: 'automatique',
    width: 'Largeur',
    widthAuto: 'Calculée d’après le contour (la largeur auto est activée)',
    widthTip: 'Chasse — laisser lié pour utiliser la largeur de la police',
    height: 'Hauteur',
    heightTip: 'Hauteur de référence — laisser lié pour utiliser la hauteur de la police',
    export: 'Exporter',
    exportTip: 'Inclure dans les polices exportées',
    flatten: 'Aplatir',
    flattenTip: 'Ajuster le contour combiné (glyphe + composants) comme un tout',
    flattenMode: 'Mode d’aplatissement'
  },

  /** The frame of the component selected in the glyph view (ComponentFrame). */
  frame: {
    label: 'Composant {{component}}',
    description: 'Faites-le glisser pour le déplacer (avec Maj, le long d’un seul axe), un coin pour le mettre à l’échelle, la poignée pour le faire pivoter. Les flèches le déplacent d’une unité, de 10 avec Maj. Échap le désélectionne.',
    scaleTip: 'Mettre à l’échelle depuis l’ancre du composant (avec Alt, depuis le coin opposé)',
    rotateTip: 'Faire pivoter autour du pivot de rotation (avec Maj, par pas de 15°)'
  },

  /** Glyph view and identity at the top of the inspector (GlyphHeader). */
  header: {
    zoomOut: 'Zoom arrière',
    zoomIn: 'Zoom avant',
    resizeView: 'Redimensionner la vue du glyphe',
    pixels: '{{value}} pixels',
    copyCharacter: 'Copier le caractère',
    copyCharacterName: 'Copier le caractère {{glyph}}',
    ligature: 'Ligature',
    // A character's general category in the header: its name and the standard's code.
    category: '{{name}} ({{gc}})',
    unknownCharacter: 'Caractère inconnu',
    copyUnicode: 'Copier la valeur Unicode',
    copyCode: 'Copier {{code}}',
    notInFont: 'absent de la police',
    live: 'Lié : {{file}}',
    unbind: 'Délier',
    importSvg: 'Importer un SVG dans ce glyphe',
    pasteSvg: 'Coller le code SVG du presse-papiers',
    copyGlyph: 'Copier le glyphe (Ctrl+C)',
    externalEditor: 'Modifier dans un éditeur externe (rechargement en direct)',
    moreActions: 'Plus d’actions'
  },

  /** A selected slot with no glyph yet. */
  emptySlot: {
    createEmpty: 'Créer un glyphe vide',
    createFromComponents: 'Créer à partir de composants',
    createFromComponentsTip: 'Crée le glyphe avec les composants de sa décomposition Unicode (crée aussi les parties manquantes)',
    importSvg: 'Importer un SVG…',
    pasteSvg: 'Coller un SVG',
    noSvgHint: 'Copiez d’abord des tracés depuis votre éditeur vectoriel.',
    dropTip: 'Astuce : déposez un fichier SVG sur une case pour l’y importer.'
  },

  /** Several glyphs selected. */
  multi: {
    selected: '{{count, number}} sélectionnés',
    existing: '{{n, number}} existants',
    existingAndEmpty_one: '{{n, number}} existants · {{count, number}} case vide',
    existingAndEmpty_many: '{{n, number}} existants · {{count, number}} cases vides',
    existingAndEmpty_other: '{{n, number}} existants · {{count, number}} cases vides',
    create: 'Créer {{n, number}}',
    ligature: 'Ligature',
    ligatureTip: 'Créer la ligature « {{chars}} » (ordre de sélection)',
    kernPair: 'Créner la paire',
    kernPairTip: 'Créner « {{chars}} » (ordre de sélection)',
    compose: 'Composer',
    composeTip: 'Créer les composants depuis les décompositions Unicode',
    reset: 'Réinitialiser',
    clearAll: 'Effacer contour et composants',
    clearKeepComponents: 'Effacer le contour, garder les composants',
    rebuild: 'Reconstruire depuis la décomposition',
    delete: 'Supprimer',
    createFirst: 'Créez les glyphes sélectionnés pour modifier leurs propriétés ensemble.'
  },

  /** Nothing selected. */
  placeholder: {
    title: 'Sélectionnez un ou plusieurs glyphes pour les modifier ici.',
    multiSelect: '<k>Ctrl</k> / <k>Maj</k> + clic pour une sélection multiple',
    storeSelection: '<k>Ctrl</k>+<k>0-9</k> enregistre une sélection, <k>0-9</k> la restaure',
    dropSvg: 'Déposez des fichiers SVG sur une case pour les importer',
    palette: '<k>Ctrl</k>+<k>P</k> ouvre la palette de commandes'
  },

  /** Details section. */
  detailsSection: {
    notListed: '{{code}} n’est pas listé',
    notListedHint: 'Il n’est pas dans la police, et aucune vue ne liste les caractères non attribués ou de contrôle.',
    advance: 'Chasse',
    exported: 'Exporté',
    exportedYes: 'oui',
    exportedSkipped: 'ignoré (hors limites)',
    outlineWidth: 'Largeur du contour',
    outlineHeight: 'Hauteur du contour',
    leftBearing: 'Approche gauche',
    rightBearing: 'Approche droite',
    usedAsComponent: 'Utilisé comme composant ×{{n, number}}',
    selectAll: 'Tout sélectionner',
    decomposition: 'Décomposition ({{n, number}})',
    decompositionTagged: 'Décomposition · {{tag}} ({{n, number}})',
    relatives: 'Apparentés ({{n, number}})'
  },

  /** Components section, single glyph and multi-selection. */
  componentsSection: {
    empty: '(vide)',
    replace: 'Remplacer les composants',
    add: 'Ajouter des composants',
    copyTransforms: 'Copier les transformations des composants',
    copyTransformsHint: 'Applique les réglages copiés aux composants du même glyphe',
    pasteTip: 'Coller les composants des glyphes copiés',
    addEmpty: 'Ajouter un composant vide',
    searchAdd: 'Rechercher et ajouter des composants',
    decompose: 'Créer les composants depuis la décomposition Unicode',
    noDecomposition: 'Aucune décomposition pour ce caractère',
    showAll: 'Tout afficher',
    hideAll: 'Tout masquer',
    collapseAll: 'Tout replier',
    visibilityFolding: 'Visibilité et repli',
    none: 'Les composants placent d’autres glyphes dans celui-ci (accents, parties de ligature…). Ajoutez-en un avec + ou créez-les depuis la décomposition Unicode.',
    move: 'Déplacer {{component}}',
    moveDescription: 'Glisser, ou utiliser les flèches haut et bas',
    moveTip: 'Glisser pour réordonner (ou focus puis ↑ ↓)',
    expand: 'Déplier {{component}}',
    control: 'contrôle',
    controlTip: 'Composant de contrôle : pilote la largeur et le contexte',
    controlInactive: 'contrôle (inactif)',
    controlInactiveTip: 'Marqué comme contrôle, mais son glyphe manque ou est circulaire',
    circular: 'circulaire',
    circularTip: 'Ce glyphe utilise le glyphe hôte : le composant est ignoré',
    missing: 'manquant',
    missingTip: 'Aucun glyphe n’existe encore pour ce caractère',
    inverted: 'inversé',
    hide: 'Masquer le composant',
    show: 'Afficher le composant',
    moveUp: 'Monter',
    moveDown: 'Descendre',
    remove: 'Retirer le composant',
    // Multi-selection
    addToAll: 'Ajouter des composants à chaque glyphe sélectionné',
    decomposeAll: 'Créer les composants depuis les décompositions',
    showAllComponents: 'Afficher tous les composants',
    hideAllComponents: 'Masquer tous les composants',
    noneInSelection: 'Aucun des glyphes sélectionnés n’a de composants.',
    inGlyphs_one: 'dans {{n, number}} glyphe sur {{count, number}}',
    inGlyphs_many: 'dans {{n, number}} glyphes sur {{count, number}}',
    inGlyphs_other: 'dans {{n, number}} glyphes sur {{count, number}}',
    toggleVisibility: 'Afficher/masquer',
    removeFromAll: 'Retirer de tous les glyphes sélectionnés'
  },

  /** Component fields (LayerFields). */
  layer: {
    glyph: 'Glyphe',
    glyphTip: 'Caractère, ligature ou U+XXXX du glyphe utilisé comme composant',
    glyphPlaceholder: 'p. ex. A, U+0301',
    pickGlyph: 'Choisir un glyphe',
    pickTitle: 'Choisir le glyphe du composant',
    context: 'Contexte',
    contextTip: 'Où, dans le glyphe hôte, le composant est attaché',
    contextAnchor: 'Ancre du contexte',
    contextBounds: 'Comment la boîte de l’hôte est mesurée',
    component: 'Composant',
    componentTip: 'Quel point du composant est attaché',
    componentAnchor: 'Ancre du composant',
    componentBounds: 'Comment la boîte du composant est mesurée',
    xOffset: 'Décalage horizontal',
    yOffset: 'Décalage vertical',
    special: 'Spécial',
    customId: 'ID personnalisé',
    customIdTip: 'Nom partagé par des composants de plusieurs glyphes, pour les modifier en lot et les rechercher',
    customIdNone: 'aucun',
    invert: 'Inverser (sens inverse pour évider)',
    previousContext: 'Utiliser le composant précédent comme contexte',
    control: 'Composant de contrôle (pilote la largeur et le contexte)',
    controlTip: 'L’hôte prend la chasse de ce composant, et les autres composants s’y attachent'
  },

  /** Kerning section of the glyph inspector. */
  kerningSection: {
    showPairs: 'Afficher ces paires dans la vue Crénage',
    asLeft: '{{glyph}} + …',
    asRight: '… + {{glyph}}',
    inheritedFrom: 'Hérité de {{glyph}} ({{n, number}})',
    none: 'Aucune paire de crénage avec {{glyph}} pour l’instant.',
    suggested: 'Suggérées d’après les contours ({{n, number}})',
    applySuggestedTip: 'Donner à ces paires les valeurs mesurées sur les contours (une seule annulation)',
    applyIt: 'L’appliquer',
    applyAll: 'Appliquer les {{n, number}}',
    showInDetected: 'Afficher dans Paires détectées',
    showPairInDetected: 'Afficher {{pair}} dans Paires détectées',
    notInFont: '{{glyph}} n’est pas dans la police',
    replacedByLigature: 'Remplacé par la ligature {{glyph}}',
    showInKerning: 'Afficher dans la vue Crénage',
    showPairInKerning: 'Afficher {{pair}} dans la vue Crénage',
    alsoApplies: 'S’applique aussi à {{pairs}} (les lettres accentuées suivent leur lettre de base)',
    alsoAppliesCount_one: 'S’applique aussi à {{count, number}} paire accentuée',
    alsoAppliesCount_many: 'S’applique aussi à {{count, number}} paires accentuées',
    alsoAppliesCount_other: 'S’applique aussi à {{count, number}} paires accentuées',
    kerningOf: 'Crénage de {{pair}}',
    followsBase: '{{pair}} suit la paire de ses lettres de base',
    remove: 'Retirer {{pair}}',
    giveMeasured: 'Donner à {{pair}} la valeur mesurée sur les contours',
    applyTo: 'Appliquer {{value}} à {{pair}}',
    apply: 'Appliquer',
    typeOther: 'Tapez l’autre glyphe',
    typeOtherHint: 'Un caractère, un code U+ ou une ligature comme fi.',
    alreadyPair: '{{pair}} est déjà une paire',
    side: 'Côté de {{glyph}} dans la nouvelle paire',
    first: '{{glyph}} +',
    firstTip: '{{glyph}} en premier',
    second: '+ {{glyph}}',
    secondTip: '{{glyph}} en second',
    otherPlaceholder: 'Autre glyphe, p. ex. A',
    glyphAfter: 'Glyphe après {{glyph}}',
    glyphBefore: 'Glyphe avant {{glyph}}',
    addPair: 'Ajouter la paire'
  },

  /** Inspector of the pair views (PairInspector). */
  pair: {
    tighten_one: 'Resserrer de {{count, number}} unité',
    tighten_many: 'Resserrer de {{count, number}} unités',
    tighten_other: 'Resserrer de {{count, number}} unités',
    loosen_one: 'Desserrer de {{count, number}} unité',
    loosen_many: 'Desserrer de {{count, number}} unités',
    loosen_other: 'Desserrer de {{count, number}} unités',
    state: {
      kerned: 'Crénée',
      zero: 'Sans crénage',
      inherited: 'Héritée',
      none: 'Non crénée'
    },
    // "Exported" in the Details section.
    exportedYes: 'oui',
    exportedNotKerned: 'non : non crénée',
    exportedNotInFont: 'non : {{glyph}} absent de la police',
    exportedNotInFontBoth: 'non : {{first}} et {{second}} absents de la police',
    exportedNotExported: 'non : {{glyph}} non exporté',
    exportedNotExportedBoth: 'non : {{first}} et {{second}} non exportés',
    exportedZero: 'non : rien à créner',
    exportedInherited: 'oui, héritée de {{pair}}',
    // Under the value field.
    follows: 'Suit {{pair}} : {{base}} est la lettre de base de {{accented}}. Saisissez une valeur pour donner à cette paire la sienne.',
    ownValue: 'Sa propre valeur ; {{pair}} donnerait {{value}}.',
    follow: 'Suivre {{pair}}',
    measured: 'Pas encore crénée. D’après les contours, environ {{value}} égaliserait son espacement : vérifiez à l’œil.',
    notKernedYet: 'Pas encore crénée : une valeur ajoute la paire à la police.',
    title: 'Paire de crénage {{pair}}',
    rank: 'Paire courante nº {{n, number}}',
    rankTip: 'Son rang dans la liste des paires courantes (1 est la plus pertinente)',
    missing: '{{glyph}} n’est pas dans la police. La paire est conservée, et exportée dès qu’il existe.',
    missingBoth: '{{first}} et {{second}} ne sont pas dans la police. La paire est conservée, et exportée dès qu’ils existent.',
    createIt: 'Le créer',
    createThem: 'Les créer',
    ligature: 'Jamais appliquée quand les ligatures sont actives : la ligature {{ligature}} remplace {{left}} suivi de {{right}}. Crénez plutôt la ligature avec ses voisins.',
    goToLigature: 'Aller à la ligature',
    value: 'Valeur',
    valueTip: 'Ajoutée à l’espace entre les deux glyphes, en unités de la police : une valeur négative les rapproche',
    units: 'unités',
    applyTip: 'Donner à la paire la valeur mesurée sur les contours',
    apply: 'Appliquer {{value}}',
    noKerning: 'Sans crénage',
    noKerningTip: 'Garder la paire à 0 : vérifiée, rien à créner (non exportée)',
    remove: 'Retirer',
    removeTip: 'Retirer sa propre valeur : elle suit de nouveau {{pair}}',
    exported: 'Exportée',
    advanceOf: 'Chasse de {{glyph}}',
    rankLabel: 'Rang parmi les paires courantes',
    rankValue: 'nº {{n, number}} sur {{total, number}}',
    notListed: 'non listée',
    measuredLabel: 'Mesurée sur les contours',
    // Several pairs selected.
    selected_one: '{{count, number}} paire sélectionnée',
    selected_many: '{{count, number}} paires sélectionnées',
    selected_other: '{{count, number}} paires sélectionnées',
    notKerned: '{{n, number}} non crénées',
    valueAllTip: 'Donne cette valeur à chaque paire sélectionnée',
    applySuggestedTip: 'Donner aux paires pas encore crénées les valeurs mesurées sur leurs contours',
    applySuggested: 'Appliquer {{n, number}} suggestions',
    noKerningAllTip: 'Garder les paires à 0 : vérifiées, rien à créner (non exportées)',
    inherit: 'Hériter {{n, number}}',
    inheritTip: 'Abandonner leurs propres valeurs : elles suivent de nouveau les paires de leurs lettres de base',
    removeCount: 'Retirer {{n, number}}',
    // Nothing selected.
    placeholder: 'Sélectionnez une paire pour modifier son crénage.',
    typePair: 'Tapez une paire dans la vue Crénage (AV)',
    selectTwo: 'Sélectionnez deux glyphes, puis Créner la paire',
    selectInPreview: 'Sélectionnez deux caractères dans l’aperçu du texte',
    doubleClick: 'Double-cliquez sur une paire pour saisir sa valeur'
  }
} satisfies Catalog<typeof en>
