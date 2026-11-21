// Documents: new, open, save, export, autosave, close; their toasts, confirmations and errors.
import type en from '../en/document'
import type { Catalog } from '../catalog'

export default {
  /** A new font's file name, in its tab and the save dialog. */
  untitled: 'Sans titre',
  untitledFile: 'Sans titre.mkfont',
  untitledFileNumbered: 'Sans titre {{n}}.mkfont',
  /** Suggested save / export file name (before the extension) of an untitled font with no family name. */
  fallbackFileName: 'police',
  /** A new font's family name (Font panel; written into the exported font unless changed). */
  untitledFamily: 'Sans titre',

  // First History entry of a document.
  history: {
    newFont: 'Nouvelle police',
    opened: 'Ouverture',
    openedFile: 'Ouverture de {{fileName}}'
  },

  // Closing a document with unsaved changes.
  unsaved: {
    title: 'Enregistrer les modifications de « {{fileName}} » ?',
    message: 'Vos modifications seront perdues si vous ne les enregistrez pas.',
    save: 'Enregistrer',
    dontSave: 'Ne pas enregistrer',
    cancel: 'Annuler'
  },

  // Opening.
  /** File dialog title. */
  openTitle: 'Ouvrir un projet de police',
  opened: '{{fileName}} ouvert',
  openedDetail_one: '{{count, number}} glyphe en {{seconds}} s',
  openedDetail_many: '{{count, number}} glyphes en {{seconds}} s',
  openedDetail_other: '{{count, number}} glyphes en {{seconds}} s',
  couldNotOpen: 'Impossible d’ouvrir {{fileName}}',
  couldNotLoadSample: 'Impossible de charger la police d’exemple',
  /** Reasons a .mkfont file cannot be read (core/deserialize); `reason` is the parser's own text. */
  parse: {
    invalid: 'Fichier .mkfont non valide ({{reason}})',
    missingData: 'Fichier .mkfont non valide (données de police manquantes)'
  },

  // Saving.
  /** File dialog title. */
  saveTitle: 'Enregistrer le projet de police',
  saveFailed: 'Échec de l’enregistrement',
  saved: '{{fileName}} enregistré',
  savedReplacedTab: 'L’onglet qui affichait le fichier remplacé a été fermé.',
  openInOtherTab: '{{fileName}} est ouvert dans un autre onglet',
  openInOtherTabDetail: 'Il contient des modifications non enregistrées. Enregistrez ou fermez d’abord cet onglet.',
  autosaved: 'Enregistré automatiquement',

  // Exporting.
  export: {
    /** File dialog title; `format` is OTF or TTF. */
    title: 'Exporter en {{format}}',
    failed: 'Échec de l’exportation',
    exported: '{{fileName}} exporté',
    exportedWithWarnings_one: '{{fileName}} exporté avec {{count, number}} avertissement',
    exportedWithWarnings_many: '{{fileName}} exporté avec {{count, number}} avertissements',
    exportedWithWarnings_other: '{{fileName}} exporté avec {{count, number}} avertissements',
    showInFolder: 'Afficher dans le dossier',
    /** Notice details, joined by ", ". */
    glyphs_one: '{{count, number}} glyphe',
    glyphs_many: '{{count, number}} glyphes',
    glyphs_other: '{{count, number}} glyphes',
    ligatures_one: '{{count, number}} ligature',
    ligatures_many: '{{count, number}} ligatures',
    ligatures_other: '{{count, number}} ligatures',
    kerningPairs_one: '{{count, number}} paire de crénage',
    kerningPairs_many: '{{count, number}} paires de crénage',
    kerningPairs_other: '{{count, number}} paires de crénage',
    /** Errors and warnings from core/export-font. */
    noGlyphs: 'Il n’y a aucun glyphe à exporter.',
    notSfnt: 'Ce n’est pas une police TrueType ou OpenType.',
    noBrotli: 'Ce navigateur ne peut pas écrire de WOFF2 (il n’a pas la compression Brotli). Utilisez l’application de bureau.',
    /** Batch export: the prompt before files are replaced, and the notice. {{files}}: names joined by ", ". */
    batch: {
      replaceTitle_one: 'Remplacer {{count, number}} fichier existant ?',
      replaceTitle_many: 'Remplacer {{count, number}} fichiers existants ?',
      replaceTitle_other: 'Remplacer {{count, number}} fichiers existants ?',
      replaceMessage_one: '{{files}} est déjà dans ce dossier.',
      replaceMessage_many: 'Ces fichiers sont déjà dans ce dossier : {{files}}.',
      replaceMessage_other: 'Ces fichiers sont déjà dans ce dossier : {{files}}.',
      replace: 'Remplacer',
      exported_one: '{{count, number}} fichier exporté dans {{folder}}',
      exported_many: '{{count, number}} fichiers exportés dans {{folder}}',
      exported_other: '{{count, number}} fichiers exportés dans {{folder}}',
      downloaded_one: '{{count, number}} fichier exporté',
      downloaded_many: '{{count, number}} fichiers exportés',
      downloaded_other: '{{count, number}} fichiers exportés'
    },
    warnings: {
      outOfBounds: '{{glyph}} ignoré : le contour sort des limites',
      ligatureMissing: 'La ligature « {{chars}} » ne sera pas substituée : il manque {{missing}}',
      kerningSkipped_one: '{{count, number}} paire de crénage ignorée : un glyphe manque ou n’est pas exporté',
      kerningSkipped_many: '{{count, number}} paires de crénage ignorées : un glyphe manque ou n’est pas exporté',
      kerningSkipped_other: '{{count, number}} paires de crénage ignorées : un glyphe manque ou n’est pas exporté'
    }
  }
} satisfies Catalog<typeof en>
