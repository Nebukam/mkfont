// Window shell: title, toolbar, status bar, tabs, welcome screen, crash screen, file dialog filters, updates.
import type en from '../en/shell'
import type { Catalog } from '../catalog'

export default {
  // Window title ("●" marks unsaved changes).
  windowTitle: '{{name}} — MkFont',
  windowTitleUnsaved: '● {{name}} — MkFont',
  // A button's tooltip with its shortcut.
  withShortcut: '{{label}} ({{shortcut}})',
  // Activity bar (left edge): the sidebar panels and the buttons below them.
  panels: {
    browse: 'Parcourir les glyphes',
    preview: 'Aperçu du texte',
    history: 'Historique',
    font: 'Infos et métriques de la police'
  },
  sidebar: 'Panneau latéral',
  inspector: 'Inspecteur',
  hideInspector: 'Masquer l’inspecteur',
  showInspector: 'Afficher l’inspecteur',
  darkTheme: 'Thème sombre',
  lightTheme: 'Thème clair',
  preferences: 'Préférences',
  // Panel resize handles.
  resizeSidebar: 'Redimensionner le panneau latéral',
  resizeInspector: 'Redimensionner l’inspecteur',
  pixels: '{{value}} pixels',
  status: {
    glyphs_one: '<n>{{count, number}}</n> glyphe',
    glyphs_many: '<n>{{count, number}}</n> glyphes',
    glyphs_other: '<n>{{count, number}}</n> glyphes',
    selected_one: '{{count, number}} sélectionné',
    selected_many: '{{count, number}} sélectionnés',
    selected_other: '{{count, number}} sélectionnés',
    // After a hovered pair's name and code points.
    kerning: '· crénage {{value}}',
    metrics: 'EM {{em}} · base {{baseline}} · asc. {{ascent}} · desc. {{descent}}',
    metricsTip: 'EM · ligne de base · ascendante · descendante',
    toggleLabels: 'Afficher/masquer les étiquettes des cases',
    labelsOn: 'Étiquettes affichées',
    labelsOff: 'Étiquettes masquées',
    cellSize: 'Taille des cases de glyphe',
    cellSizeTip: 'Taille des cases de glyphe (Ctrl+molette sur la grille)',
    ucd: 'UCD {{version}}',
    ucdTip: 'Version de l’Unicode Character Database'
  },
  // Open fonts, one tab each in the header.
  tabs: {
    openFonts: 'Polices ouvertes',
    unsaved: '{{name}}, modifications non enregistrées',
    notSaved: '{{fileName}} (pas encore enregistré)',
    closeFont: 'Fermer {{name}}',
    close: 'Fermer ({{shortcut}})',
    closePlain: 'Fermer'
  },
  // Dropping files on the window.
  drop: {
    hint: 'Déposez des .mkfont, des fichiers de police ou des SVG (déposez un SVG sur une case pour l’y importer)',
    closeDialog: 'Fermez d’abord la boîte de dialogue',
    closeDialogDetail: 'Puis déposez à nouveau les fichiers.'
  },
  welcome: {
    tagline: 'Composez des polices à partir de SVG et de composants réutilisables.',
    newFont: 'Nouvelle police',
    newFontDetail: 'Partir d’une police vide',
    open: 'Ouvrir…',
    openDetail: 'Ouvrir un projet .mkfont',
    fromFontFile: 'Nouvelle depuis un fichier de police…',
    fromFontFileDetail: 'Partir d’un TTF, OTF ou WOFF existant',
    fromSvgs: 'Nouvelle depuis des fichiers SVG…',
    fromSvgsDetail: 'Créer une police et importer un dossier de SVG',
    sample: 'Ouvrir la police d’exemple',
    sampleDetail: 'Un latin de base fait de composants, avec crénage',
    dropHint: 'Vous pouvez aussi déposer un .mkfont, un fichier de police ou des fichiers SVG n’importe où dans cette fenêtre.',
    recent: 'Récents',
    noRecent: 'Les polices que vous ouvrez apparaissent ici.',
    recentNeedsDesktop: 'Les fichiers récents sont disponibles dans l’application de bureau.',
    recentFiles: 'Fichiers récents',
    removeRecent: 'Retirer {{name}} des fichiers récents',
    removeRecentTip: 'Retirer des récents',
    appVersion: 'MkFont {{version}}',
    unicodeVersion: 'Unicode {{version}}',
    checkUpdates: 'Rechercher des mises à jour',
    shortcuts: 'Raccourcis',
    preferences: 'Préférences'
  },
  // Shown when the interface crashes.
  crash: {
    title: 'Un problème est survenu',
    message_one: 'L’éditeur a rencontré une erreur inattendue. Votre police est toujours en mémoire.',
    message_many: 'L’éditeur a rencontré une erreur inattendue. Vos polices sont toujours en mémoire.',
    message_other: 'L’éditeur a rencontré une erreur inattendue. Vos polices sont toujours en mémoire.',
    retry: 'Réessayer',
    rescue_one: 'Enregistrer une copie de secours…',
    rescue_many: 'Enregistrer {{count, number}} copies de secours…',
    rescue_other: 'Enregistrer {{count, number}} copies de secours…',
    rescueTitle: 'Enregistrer une copie de secours de {{name}}',
    rescueFailed: 'Impossible d’enregistrer une copie de secours de {{name}}',
    // One panel failed (sidebar, glyph grid, inspector); the rest of the window still works.
    region: 'Ce panneau a rencontré une erreur inattendue.',
    // A dialog or a context menu failed while showing: it was closed as if cancelled.
    dialogClosed: 'Une boîte de dialogue a rencontré une erreur inattendue et a été fermée',
    menuClosed: 'Un menu a rencontré une erreur inattendue et a été fermé'
  },
  // File type names in open and save dialogs.
  filters: {
    mkfont: 'Projet MkFont',
    svg: 'Fichiers SVG',
    font: 'Fichiers de police',
    ttf: 'Police TrueType',
    otf: 'Police OpenType (CFF)',
    woff: 'Police web WOFF',
    woff2: 'Police web WOFF2',
    jsx: 'Script Illustrator'
  },
  updates: {
    available: 'MkFont {{latest}} est disponible (version installée : {{current}})',
    openReleases: 'Ouvrir la page des versions',
    upToDate: 'Vous êtes à jour ({{current}})',
    failed: 'Impossible de rechercher des mises à jour',
    httpError: 'GitHub a répondu {{status}}'
  },
  errors: {
    couldNotRead: 'Impossible de lire {{path}}'
  }
} satisfies Catalog<typeof en>
