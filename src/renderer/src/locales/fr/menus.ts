// Menu bar (beside the command menus, whose items are command labels) and the context
// menus of glyphs and kerning pairs.
import type en from '../en/menus'
import type { Catalog } from '../catalog'

export default {
  bar: {
    label: 'Menu principal',
    // File menu, after Open…
    openRecent: 'Ouvrir un fichier récent',
    noRecent: 'Aucun fichier récent',
    recentNeedsDesktop: 'Les fichiers récents nécessitent l’application de bureau',
    openSample: 'Ouvrir la police d’exemple',
    // Help menu, last item.
    github: 'MkFont sur GitHub',
    // Import button and its menu.
    import: 'Importer',
    importSvg: 'Fichiers SVG…',
    importFont: 'Glyphes d’un fichier de police (TTF, OTF, WOFF)…',
    importMkfont: 'Glyphes d’un autre .mkfont…',
    // Export button and its menu.
    export: 'Exporter',
    exportTtf: 'Exporter en TTF',
    exportTtfHint: 'Contours TrueType (même chaîne que MkFont 1)',
    exportOtf: 'Exporter en OTF',
    exportOtfHint: 'Contours CFF, garde les courbes exactes',
    exportWoff: 'Exporter en WOFF',
    exportWoffHint: 'Police web : contours TrueType, compressée',
    exportWoff2: 'Exporter en WOFF2',
    exportWoff2Hint: 'Police web : contours TrueType, fichiers les plus légers',
    exportOptions: 'Options d’exportation…',
    // The arrow button that opens the export menu.
    exportMenu: 'Options d’exportation'
  },
  // Submenu of the glyph and pair menus.
  copyText: {
    title: 'Copier en texte',
    characters: 'Caractères',
    unicodeValues: 'Valeurs Unicode'
  },
  // Context menu of glyph slots (grid, inspector).
  glyph: {
    createEmpty_one: 'Créer un glyphe vide',
    createEmpty_many: 'Créer {{count, number}} glyphes vides',
    createEmpty_other: 'Créer {{count, number}} glyphes vides',
    importSvg: 'Importer un SVG…',
    copy: 'Copier',
    pasteSpecial: 'Collage spécial',
    pasteTransformsOnly: 'Coller les transformations seulement',
    replaceComponents: 'Remplacer les composants',
    addComponents: 'Ajouter les composants',
    copyComponentTransforms: 'Copier les transformations des composants',
    outlineSvg: 'Contour en SVG',
    outlineSvgHint: 'Le contour final, composants compris',
    components: 'Composants',
    fromDecomposition: 'Créer depuis la décomposition',
    fromDecompositionHint: 'Crée aussi les glyphes composants manquants',
    noDecomposition: 'Aucune décomposition Unicode pour cette sélection',
    fromDecompositionExisting: 'Créer depuis la décomposition (glyphes existants seulement)',
    addComponentsPick: 'Ajouter des composants…',
    showComponents: 'Afficher tous les composants',
    hideComponents: 'Masquer tous les composants',
    createLigature: 'Créer une ligature',
    // "Kern A V": the two selected glyphs.
    kern: 'Créner {{left}} {{right}}',
    reset: 'Réinitialiser',
    clearAll: 'Effacer contour et composants',
    clearOutline: 'Effacer le contour, garder les composants',
    rebuild: 'Reconstruire depuis la décomposition',
    unbind_one: 'Délier le fichier source',
    unbind_many: 'Délier {{count, number}} fichiers',
    unbind_other: 'Délier {{count, number}} fichiers',
    storeInSlot: 'Enregistrer la sélection dans la mémoire',
    slot: 'Mémoire {{slot}}',
    artboardTemplate: 'Modèle de plans de travail Illustrator…',
    // The item reads as for one glyph while it is disabled (no existing glyph selected).
    delete_one: 'Supprimer le glyphe',
    delete_many: 'Supprimer {{count, number}} glyphes',
    delete_other: 'Supprimer {{count, number}} glyphes'
  },
  // Context menu of kerning pairs (the pair views).
  pair: {
    goTo: 'Aller à {{glyph}}',
    applySuggested_one: 'Appliquer la valeur suggérée ({{value}})',
    applySuggested_many: 'Appliquer {{count, number}} valeurs suggérées',
    applySuggested_other: 'Appliquer {{count, number}} valeurs suggérées',
    applySuggestedHint: 'Mesurée sur les contours : un point de départ à vérifier à l’œil',
    noKerning: 'Sans crénage (garder à 0)',
    noKerningHint: 'La paire a été vérifiée et n’a pas besoin de crénage : elle est conservée, mais pas exportée',
    // The item reads as for one pair while it is disabled (no kerned pair selected).
    remove_one: 'Retirer la paire',
    remove_many: 'Retirer {{count, number}} paires',
    remove_other: 'Retirer {{count, number}} paires'
  }
} satisfies Catalog<typeof en>
