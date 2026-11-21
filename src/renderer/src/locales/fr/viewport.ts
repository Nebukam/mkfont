// Viewport: range titles, toolbar, progress and empty states, glyph and pair slots.
import type en from '../en/viewport'
import type { Catalog } from '../catalog'

export default {
  // The view's title and the tag beside it (rangeTitle). Block names are Unicode data; category names are in ./unicode.
  titles: {
    myGlyphs: 'Mes glyphes',
    ligatures: 'Ligatures',
    kerning: 'Crénage',
    commonPairs: 'Paires courantes',
    commonPairsGroup: 'Paires courantes · {{group}}',
    detected: 'Paires détectées',
    allCharacters: 'Tous les caractères',
    category: '{{group}} · {{name}}'
  },
  tags: {
    font: 'Police',
    kerning: 'Crénage',
    unicode: 'Unicode',
    block: 'Bloc',
    category: 'Catégorie {{gc}}'
  },
  // The line under the title. Segments are joined with `separator`; <n> and <s> are styled counts.
  status: {
    separator: ' · ',
    progress_one: '<n>{{kerned, number}}</n> crénées · {{zero, number}} à 0 · {{inherited, number}} héritées · <n>{{none, number}}</n> à faire, sur {{count, number}} paire',
    progress_many: '<n>{{kerned, number}}</n> crénées · {{zero, number}} à 0 · {{inherited, number}} héritées · <n>{{none, number}}</n> à faire, sur {{count, number}} paires',
    progress_other: '<n>{{kerned, number}}</n> crénées · {{zero, number}} à 0 · {{inherited, number}} héritées · <n>{{none, number}}</n> à faire, sur {{count, number}} paires',
    detected_one: '<n>{{count, number}}</n> paire peut demander du crénage · suggestions approximatives mesurées sur vos contours',
    detected_many: '<n>{{count, number}}</n> paires peuvent demander du crénage · suggestions approximatives mesurées sur vos contours',
    detected_other: '<n>{{count, number}}</n> paires peuvent demander du crénage · suggestions approximatives mesurées sur vos contours',
    pairs_one: '<n>{{count, number}}</n> paire',
    pairs_many: '<n>{{count, number}}</n> paires',
    pairs_other: '<n>{{count, number}}</n> paires',
    withGlyphMissing_one: '{{count, number}} avec un glyphe manquant',
    withGlyphMissing_many: '{{count, number}} avec un glyphe manquant',
    withGlyphMissing_other: '{{count, number}} avec un glyphe manquant',
    moreInherited_one: '{{count, number}} de plus héritée par les lettres accentuées',
    moreInherited_many: '{{count, number}} de plus héritées par les lettres accentuées',
    moreInherited_other: '{{count, number}} de plus héritées par les lettres accentuées',
    glyphs_one: '<n>{{count, number}}</n> glyphe',
    glyphs_many: '<n>{{count, number}}</n> glyphes',
    glyphs_other: '<n>{{count, number}}</n> glyphes',
    glyphsOfSlots_one: '<n>{{count, number}}</n> glyphe sur {{slots, number}} cases',
    glyphsOfSlots_many: '<n>{{count, number}}</n> glyphes sur {{slots, number}} cases',
    glyphsOfSlots_other: '<n>{{count, number}}</n> glyphes sur {{slots, number}} cases',
    shown_one: '{{count, number}} affichée',
    shown_many: '{{count, number}} affichées',
    shown_other: '{{count, number}} affichées',
    filteredFrom_one: 'parmi {{count, number}}',
    filteredFrom_many: 'parmi {{count, number}}',
    filteredFrom_other: 'parmi {{count, number}}',
    selected_one: '<s>sélection : {{count, number}}</s>',
    selected_many: '<s>sélection : {{count, number}}</s>',
    selected_other: '<s>sélection : {{count, number}}</s>'
  },
  // Header actions and their "more actions" menus.
  actions: {
    create: 'Créer',
    createTip: 'Créer des glyphes vides pour les cases sélectionnées (Ctrl+Maj+N)',
    more: 'Plus d’actions',
    selection: 'Sélection',
    selectionCount: 'Sélection ({{count, number}})',
    everythingInView: 'Tout ce qui est dans la vue ({{count, number}})',
    selectAll: 'Tout sélectionner',
    copyCharacters: 'Copier les caractères',
    copyUnicodeValues: 'Copier les valeurs Unicode',
    artboardTemplate: 'Modèle de plans de travail Illustrator…',
    createAllMissing: 'Créer tous les glyphes manquants',
    deleteAllInView: 'Supprimer tous les glyphes de la vue',
    newPairPlaceholder: 'Nouvelle paire, p. ex. AV',
    newPairLabel: 'Nouvelle paire de crénage : deux caractères, ou deux glyphes séparés par une espace',
    newPairTip: 'Deux caractères (AV), ou deux glyphes séparés par une espace (fi x)',
    addPair: 'Ajouter la paire',
    applyAll: 'Tout appliquer',
    applyAllTip_one: 'Donner à {{count, number}} paire affichée sa valeur suggérée (une seule annulation)',
    applyAllTip_many: 'Donner aux {{count, number}} paires affichées leurs valeurs suggérées (une seule annulation)',
    applyAllTip_other: 'Donner aux {{count, number}} paires affichées leurs valeurs suggérées (une seule annulation)',
    applySuggestions: 'Appliquer les suggestions',
    noKerning: 'Sans crénage (garder à 0)',
    copyAsCharacters: 'Copier en caractères',
    removeAllPairs: 'Retirer toutes les paires de la vue',
    removePairValues: 'Retirer les valeurs des paires de la vue'
  },
  search: {
    glyphsPlaceholder: 'Chercher des caractères, noms ou codes U+ — p. ex. a, grave, U+00E9',
    pairsPlaceholder: 'Chercher l’un des glyphes d’une paire, ou la paire — p. ex. T, U+0054, AV',
    clear: 'Effacer la recherche',
    relatives: 'Apparentés',
    relativesTip: 'Afficher aussi les caractères apparentés (décompositions communes), même hors de cette plage',
    existingOnly: 'Existants seulement',
    existingGlyphsTip: 'N’afficher que les glyphes qui existent dans la police',
    existingPairsTip: 'N’afficher que les paires dont les deux glyphes existent dans la police',
    todo: 'À faire',
    todoTip: 'Seulement les paires pas encore crénées : sans valeur propre, sans héritage, non réglées sur sans crénage',
    rare: 'Paires rares',
    rareTip: 'Aussi les paires hors de la liste des paires courantes, suggestions les plus fortes d’abord',
    results_one: '{{count, number}} résultat',
    results_many: '{{count, number}} résultats',
    results_other: '{{count, number}} résultats'
  },
  // The order of the common pairs views.
  sort: {
    header: 'Ordre',
    tip: 'Ordre des paires',
    label: 'Ordre : {{order}}',
    rank: { label: 'Les plus courantes d’abord', hint: 'L’ordre de la liste des paires courantes' },
    detected: { label: 'Détectées d’abord', hint: 'Les paires pas encore crénées pour lesquelles les contours suggèrent une valeur, puis les autres' }
  },
  // The view when nothing is listed.
  empty: {
    nothing: 'Rien à afficher ici.',
    noMatch: 'Aucun résultat pour « {{text}} » dans cette plage.',
    measuring: 'Mesure de vos contours…',
    detectedNoGlyphs: 'Cette police n’a pas encore de glyphes : les paires sont mesurées sur leurs contours.',
    detectedNothingRare: 'Rien ne ressort : chaque paire dessinée par votre police est déjà crénée, ou a un espacement normal.',
    detectedNothing: 'Rien ne ressort : chaque paire courante dessinée par votre police est déjà crénée, ou a un espacement normal.',
    todoDone: 'Plus rien à faire ici : chaque paire est crénée, héritée ou réglée sur sans crénage.',
    noExistingPairs: 'Aucune paire n’a ses deux glyphes dans la police.',
    noExistingGlyphs: 'Aucun de ces caractères n’existe encore dans la police.',
    noGlyphs: 'Cette police n’a pas encore de glyphes.',
    noLigatures: 'Aucune ligature pour l’instant.',
    noPairs: 'Aucune paire de crénage pour l’instant. Tapez une paire ci-dessus, sélectionnez deux glyphes et utilisez Créner la paire, ou sélectionnez deux caractères dans l’aperçu du texte.',
    goTo: 'Aller à {{chars}} {{code}} dans {{block}}',
    searchAllCharacters: 'Chercher dans tous les caractères',
    searchAllCommon: 'Chercher dans toutes les paires courantes',
    includeRare: 'Inclure les paires rares',
    browseBlock: 'Parcourir {{block}}',
    importSvgs: 'Importer des SVG…',
    importFont: 'Importer depuis un fichier de police…',
    findLigatures: 'Trouver des ligatures dans un texte…'
  },
  // The grids' accessible names.
  grid: {
    glyphs: 'Glyphes',
    pairs: 'Paires de crénage',
    commonPairs: 'Paires de crénage courantes'
  },
  // A glyph cell. Its accessible name is the glyph's name and its states, joined with `separator`.
  slot: {
    separator: ', ',
    notInFont: 'absent de la police',
    ligature: 'ligature',
    empty: 'vide',
    outOfBounds: 'hors limites',
    notExported: 'non exporté',
    linked: 'lié à un fichier',
    ligaBadge: 'LIGA',
    createEmpty: 'Créer un glyphe vide',
    copyUnicode: 'Copier la valeur Unicode'
  },
  // A pair cell. Its accessible name: "T U+0054 Latin Capital Letter T, then …: <states>".
  pair: {
    label: '{{left}}, puis {{right}} : {{states}}',
    separator: ', ',
    kerned: 'crénage {{value}}',
    zero: 'sans crénage',
    inherited: 'crénage {{value}}, hérité de {{pair}}',
    none: 'non crénée',
    suggested: 'suggestion {{value}}',
    commonRank: 'paire courante {{rank}}',
    notInFont: '{{glyph}} n’est pas dans la police',
    replacedByLigature: 'remplacé par la ligature {{glyph}}',
    suggestedTip: 'Suggéré d’après les contours (non appliqué)',
    rank: '#{{rank, number}}',
    ligaBadge: 'LIGA'
  },
  // Metric line names drawn on the glyph canvas.
  canvas: {
    ascender: 'ascendante',
    capHeight: 'capitale',
    xHeight: 'x',
    baseline: 'ligne de base',
    descender: 'descendante'
  }
} satisfies Catalog<typeof en>
