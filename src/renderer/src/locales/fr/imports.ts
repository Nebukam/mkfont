// Imports: SVG, font file and .mkfont import flows and dialogs; import errors.
import type en from '../en/imports'
import type { Catalog } from '../catalog'

export default {
  // Shared by the import dialogs.
  cancel: 'Annuler',
  /** Import dialogs' confirm button. */
  importGlyphs_one: 'Importer {{count, number}} glyphe',
  importGlyphs_many: 'Importer {{count, number}} glyphes',
  importGlyphs_other: 'Importer {{count, number}} glyphes',
  /** "Existing" row: what to do with glyphs the font already has. */
  existing: 'Existants',
  /** History entry, and the notice after it (font file and .mkfont imports). */
  importGlyphsFrom_one: 'Importer {{count, number}} glyphe de {{fileName}}',
  importGlyphsFrom_many: 'Importer {{count, number}} glyphes de {{fileName}}',
  importGlyphsFrom_other: 'Importer {{count, number}} glyphes de {{fileName}}',
  importedGlyphsFrom_one: '{{count, number}} glyphe importé de {{fileName}}',
  importedGlyphsFrom_many: '{{count, number}} glyphes importés de {{fileName}}',
  importedGlyphsFrom_other: '{{count, number}} glyphes importés de {{fileName}}',

  // File dialog titles (app/imports.ts).
  pick: {
    svgFiles: 'Importer des fichiers SVG',
    newFontFromSvgs: 'Nouvelle police à partir de fichiers SVG',
    fontFile: 'Importer un fichier de police',
    mkfont: 'Importer des glyphes d’un .mkfont',
    svg: 'Importer un SVG'
  },
  /** Dropping SVG files with no font open. */
  openFontFirst: 'Ouvrez ou créez d’abord une police',
  openFontFirstDetail: 'Puis déposez les fichiers SVG pour les importer.',

  // SVG import: one file into a glyph, and the batch import dialog.
  svg: {
    couldNotImport: 'Impossible d’importer {{fileName}}',
    /** History entry: one file imported into a glyph. */
    intoGlyph: 'Importer {{fileName}} dans {{glyph}}',
    fileNoPaths: 'Le fichier ne contient aucun tracé utilisable.',
    /** Reasons an SVG cannot be read (core/import-svg). */
    errors: {
      tooManyCopies: 'Ce SVG dessine trop de copies via <use> pour être importé.',
      tooMuchPathData: 'Ce SVG contient trop de données de tracé pour être importé.',
      malformed: 'Le SVG est incomplet ou mal formé.'
    },

    // Batch import dialog.
    title: 'Importer des fichiers SVG',
    history_one: 'Importer {{count, number}} SVG',
    history_many: 'Importer {{count, number}} SVG',
    history_other: 'Importer {{count, number}} SVG',
    imported_one: '{{count, number}} glyphe importé',
    imported_many: '{{count, number}} glyphes importés',
    imported_other: '{{count, number}} glyphes importés',
    /** Subtitle parts, joined by " · ". */
    summary: {
      files_one: '{{count, number}} fichier',
      files_many: '{{count, number}} fichiers',
      files_other: '{{count, number}} fichiers',
      new_one: '{{count, number}} nouveau',
      new_many: '{{count, number}} nouveaux',
      new_other: '{{count, number}} nouveaux',
      replace_one: '{{count, number}} à remplacer',
      replace_many: '{{count, number}} à remplacer',
      replace_other: '{{count, number}} à remplacer',
      skipped_one: '{{count, number}} ignoré',
      skipped_many: '{{count, number}} ignorés',
      skipped_other: '{{count, number}} ignorés',
      unassigned_one: '{{count, number}} non attribué',
      unassigned_many: '{{count, number}} non attribués',
      unassigned_other: '{{count, number}} non attribués',
      unusable_one: '{{count, number}} inutilisable',
      unusable_many: '{{count, number}} inutilisables',
      unusable_other: '{{count, number}} inutilisables'
    },
    assign: 'Attribuer à l’Unicode',
    assignModes: {
      filename: 'D’après les noms de fichier',
      selection: 'À la sélection ({{count, number}})',
      block: 'À un bloc',
      blockConstrained: 'À un bloc (s’arrêter à sa fin)'
    },
    prefix: 'Préfixe',
    prefixTip: 'Texte avant la partie caractère du nom (p. ex. char dans char_A.svg)',
    prefixNone: 'aucun',
    separator: 'Séparateur',
    separatorTip: 'Sépare les parties du nom ; elles sont jointes en une seule suite (f_i → ligature fi)',
    separators: {
      underscore: '_ tiret bas',
      dash: '- tiret',
      dot: '. point',
      space: '␣ espace',
      none: 'aucun'
    },
    namesHint: 'Les noms peuvent être des caractères (A, fi), U+0041, uni0041 ou de l’hexadécimal comme 00e9.',
    selectionHint: 'Les fichiers sont attribués aux cases sélectionnées, dans l’ordre de sélection.',
    block: 'Bloc',
    blockStart: 'Début du bloc',
    blockStarts: {
      begin: 'Commencer au début',
      firstEmpty: 'Commencer à la première case vide'
    },
    existingGlyphs: 'Glyphes existants',
    /** What to do with glyphs that exist (core/import-assign OverlapMode). */
    overlap: {
      overwrite: 'Remplacer tracé et transformations',
      overwriteEmpty: 'Remplacer les transformations des glyphes vides seulement',
      preserve: 'Remplacer le tracé, garder les transformations',
      ignore: 'Ne pas importer'
    },
    options: 'Options',
    keepLinked: 'Garder les fichiers liés (rechargement à l’enregistrement)',
    textLabels: 'Les étiquettes de texte des SVG deviennent des composants',
    transforms: 'Transformations des glyphes importés',
    importAll: 'Importer tous les fichiers',
    /** File list column headers. */
    columns: {
      file: 'Fichier',
      target: 'Cible',
      override: 'Forcer'
    },
    importFile: 'Importer {{fileName}}',
    noPaths: 'Aucun tracé utilisable.',
    /** File details, joined by " · ". */
    size: '{{width}} × {{height}}',
    markedBox: 'boîte repérée',
    labels_one: '{{count, number}} étiquette',
    labels_many: '{{count, number}} étiquettes',
    labels_other: '{{count, number}} étiquettes',
    unassigned: 'non attribué',
    overrideFor: 'Forcer l’Unicode de {{fileName}}',
    overrideAuto: 'auto',
    /** Status chips of the file rows. */
    status: {
      new: 'nouveau',
      replace: 'remplacer',
      skip: 'ignorer'
    }
  },

  // Font file import dialog (TTF, OTF, WOFF).
  font: {
    titleNew: 'Nouvelle police à partir d’un fichier de police',
    title: 'Importer des glyphes d’un fichier de police',
    /** First History entry of the new font. */
    imported: '{{fileName}} importé',
    created: 'Police créée à partir de {{fileName}}',
    glyphs_one: '{{count, number}} glyphe',
    glyphs_many: '{{count, number}} glyphes',
    glyphs_other: '{{count, number}} glyphes',
    createFont_one: 'Créer la police ({{count, number}} glyphe)',
    createFont_many: 'Créer la police ({{count, number}} glyphes)',
    createFont_other: 'Créer la police ({{count, number}} glyphes)',
    unreadable: 'Ce fichier n’a pas pu être lu : {{error}}',
    family: 'Famille',
    unitsPerEm: 'Unités par EM',
    ascenderDescender: 'Ascendante / descendante',
    glyphsLabel: 'Glyphes',
    /** "Glyphs" value parts, joined by ", ". */
    characters_one: '{{count, number}} caractère',
    characters_many: '{{count, number}} caractères',
    characters_other: '{{count, number}} caractères',
    ligatures_one: '{{count, number}} ligature',
    ligatures_many: '{{count, number}} ligatures',
    ligatures_other: '{{count, number}} ligatures',
    scaled: 'Les contours sont mis à l’échelle pour que l’ascendante de la police corresponde à la vôtre ({{ascent}}) ; les approches deviennent décalage et poussée.',
    includeLigatures: 'Inclure les ligatures (de la fonctionnalité GSUB liga)',
    keepExisting_one: 'Garder {{count, number}} glyphe existant',
    keepExisting_many: 'Garder mes {{count, number}} glyphes existants',
    keepExisting_other: 'Garder mes {{count, number}} glyphes existants',
    replaceExisting_one: 'Remplacer {{count, number}} glyphe existant',
    replaceExisting_many: 'Remplacer {{count, number}} glyphes existants',
    replaceExisting_other: 'Remplacer {{count, number}} glyphes existants'
  },

  // .mkfont import dialog (glyphs from another project).
  mkfont: {
    title: 'Importer des glyphes d’un autre projet de police',
    summary_one: '{{count, number}} glyphe · EM {{em}}',
    summary_many: '{{count, number}} glyphes · EM {{em}}',
    summary_other: '{{count, number}} glyphes · EM {{em}}',
    summaryRescaled_one: '{{count, number}} glyphe · EM {{em}} (redimensionné ×{{factor}})',
    summaryRescaled_many: '{{count, number}} glyphes · EM {{em}} (redimensionnés ×{{factor}})',
    summaryRescaled_other: '{{count, number}} glyphes · EM {{em}} (redimensionnés ×{{factor}})',
    all: 'Tous',
    none: 'Aucun',
    onlyMissing: 'Seulement ceux qui manquent ici',
    keepExisting: 'Garder les glyphes qui existent déjà ici',
    replaceExisting: 'Remplacer les glyphes qui existent déjà ici',
    withComponents: 'Importer aussi les glyphes composants qui manquent ici',
    glyphsToImport: 'Glyphes à importer',
    /** A glyph the open font has too: tooltip, and accessible name. */
    existsTip: '{{glyph}} (existe ici)',
    existsName: '{{name}}, existe ici'
  }
} satisfies Catalog<typeof en>
