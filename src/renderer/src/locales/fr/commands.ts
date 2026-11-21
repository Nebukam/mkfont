// Command labels, by command id nested at its dots ("file.saveAs" → file.saveAs): menu bar,
// command palette, shortcuts dialog, toolbar tips. The selection slot commands
// (preset.restore.0…9) share one message per kind, with the slot number.
// Besides the ids: groups (menu bar titles, palette detail, shortcuts dialog headings),
// withShortcut (tooltips) and palette (the command palette); no command id starts with these.
import type en from '../en/commands'
import type { Catalog } from '../catalog'

export default {
  groups: {
    File: 'Fichier',
    Edit: 'Édition',
    Select: 'Sélection',
    Glyph: 'Glyphe',
    View: 'Affichage',
    Help: 'Aide'
  },
  // A command's tooltip: "Undo (Ctrl+Z)".
  withShortcut: '{{label}} ({{shortcut}})',
  file: {
    new: 'Nouvelle police',
    open: 'Ouvrir…',
    save: 'Enregistrer',
    saveAs: 'Enregistrer sous…',
    importSvg: 'Importer des SVG…',
    importFont: 'Importer des glyphes d’un fichier de police…',
    importMkfont: 'Importer des glyphes d’un autre .mkfont…',
    newFromFont: 'Nouvelle police à partir d’un fichier de police…',
    newFromSvgs: 'Nouvelle police à partir de fichiers SVG…',
    export: 'Exporter la police',
    exportTtf: 'Exporter en TTF',
    exportOtf: 'Exporter en OTF (CFF)',
    exportWoff: 'Exporter en WOFF',
    exportWoff2: 'Exporter en WOFF2',
    exportBatch: 'Exportation par lot…',
    close: 'Fermer la police'
  },
  app: {
    prefs: 'Préférences…'
  },
  edit: {
    undo: 'Annuler',
    redo: 'Rétablir',
    copy: 'Copier les glyphes',
    paste: 'Coller',
    pasteInPlace: 'Coller sur place (mêmes cases)',
    pasteTransforms: 'Coller les transformations',
    delete: 'Supprimer'
  },
  select: {
    all: 'Tout sélectionner dans la vue',
    none: 'Désélectionner',
    invert: 'Inverser la sélection dans la vue',
    existing: 'Ne garder que les glyphes existants'
  },
  glyph: {
    create: 'Créer des glyphes vides',
    reset: 'Réinitialiser les glyphes (effacer contour et composants)',
    resetKeep: 'Réinitialiser le contour, garder les composants',
    compose: 'Créer les composants depuis la décomposition',
    ligature: 'Créer une ligature depuis la sélection',
    ligatureComp: 'Créer une ligature avec composants',
    kern: 'Créner les deux glyphes sélectionnés',
    ligatureFinder: 'Recherche de ligatures…',
    editOutline: 'Modifier le contour',
    editExternal: 'Modifier dans un éditeur externe',
    copyChars: 'Copier la sélection en caractères',
    copyHex: 'Copier la sélection en valeurs Unicode'
  },
  view: {
    search: 'Rechercher un glyphe…',
    palette: 'Palette de commandes…',
    back: 'Précédent',
    forward: 'Suivant',
    nextTab: 'Police suivante',
    prevTab: 'Police précédente',
    left: 'Afficher/masquer le panneau latéral',
    right: 'Afficher/masquer l’inspecteur',
    panel: {
      browse: 'Navigateur de glyphes',
      preview: 'Aperçu du texte',
      history: 'Historique',
      font: 'Infos et métriques de la police'
    },
    kerning: 'Paires de crénage',
    commonPairs: 'Paires de crénage courantes',
    detected: 'Paires de crénage détectées',
    zoomIn: 'Agrandir les cases de glyphe',
    zoomOut: 'Réduire les cases de glyphe',
    uiBigger: 'Agrandir l’interface',
    uiSmaller: 'Réduire l’interface',
    uiReset: 'Taille réelle de l’interface',
    theme: 'Basculer thème clair / sombre'
  },
  help: {
    shortcuts: 'Raccourcis clavier',
    updates: 'Rechercher des mises à jour',
    about: 'À propos de MkFont'
  },
  // preset.<kind>.<slot> (hidden from the menus and the palette).
  preset: {
    restore: 'Restaurer la mémoire de sélection {{slot}}',
    store: 'Enregistrer la sélection dans la mémoire {{slot}}',
    append: 'Ajouter la mémoire de sélection {{slot}}'
  },
  palette: {
    title: 'Palette de commandes',
    input: 'Commande ou caractère',
    placeholder: 'Tapez une commande, ou un caractère / U+XXXX pour y aller',
    list: 'Commandes',
    // First entry when the query is a character or a code point: "Go to A U+0041".
    goTo: 'Aller à {{glyph}} {{code}}',
    noMatch: 'Aucune commande ne correspond.'
  }
} satisfies Catalog<typeof en>
