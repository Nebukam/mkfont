// Imports: SVG, font file and .mkfont import flows and dialogs; import errors.
import type en from '../en/imports'
import type { Catalog } from '../catalog'

export default {
  // Shared by the import dialogs.
  cancel: 'Cancelar',
  /** Import dialogs' confirm button. */
  importGlyphs_one: 'Importar {{count, number}} glifo',
  importGlyphs_many: 'Importar {{count, number}} de glifos',
  importGlyphs_other: 'Importar {{count, number}} glifos',
  /** "Existing" row: what to do with glyphs the font already has. */
  existing: 'Existentes',
  /** History entry, and the notice after it (font file and .mkfont imports). */
  importGlyphsFrom_one: 'Importar {{count, number}} glifo de {{fileName}}',
  importGlyphsFrom_many: 'Importar {{count, number}} de glifos de {{fileName}}',
  importGlyphsFrom_other: 'Importar {{count, number}} glifos de {{fileName}}',
  importedGlyphsFrom_one: '{{count, number}} glifo importado de {{fileName}}',
  importedGlyphsFrom_many: '{{count, number}} de glifos importados de {{fileName}}',
  importedGlyphsFrom_other: '{{count, number}} glifos importados de {{fileName}}',

  // File dialog titles (app/imports.ts).
  pick: {
    svgFiles: 'Importar archivos SVG',
    newFontFromSvgs: 'Nueva fuente a partir de archivos SVG',
    fontFile: 'Importar archivo de fuente',
    mkfont: 'Importar glifos de un .mkfont',
    svg: 'Importar SVG'
  },
  /** Dropping SVG files with no font open. */
  openFontFirst: 'Abre o crea antes una fuente',
  openFontFirstDetail: 'Después suelta los archivos SVG para importarlos.',

  // SVG import: one file into a glyph, and the batch import dialog.
  svg: {
    couldNotImport: 'No se pudo importar {{fileName}}',
    /** History entry: one file imported into a glyph. */
    intoGlyph: 'Importar {{fileName}} en {{glyph}}',
    fileNoPaths: 'El archivo no tiene trazados utilizables.',
    /** Reasons an SVG cannot be read (core/import-svg). */
    errors: {
      tooManyCopies: 'Este SVG dibuja demasiadas copias mediante <use> para importarlo.',
      tooMuchPathData: 'Este SVG tiene demasiados datos de trazado para importarlo.',
      malformed: 'El SVG está incompleto o mal formado.'
    },

    // Batch import dialog.
    title: 'Importar archivos SVG',
    history_one: 'Importar {{count, number}} SVG',
    history_many: 'Importar {{count, number}} de SVG',
    history_other: 'Importar {{count, number}} SVG',
    imported_one: '{{count, number}} glifo importado',
    imported_many: '{{count, number}} de glifos importados',
    imported_other: '{{count, number}} glifos importados',
    /** Subtitle parts, joined by " · ". */
    summary: {
      files_one: '{{count, number}} archivo',
      files_many: '{{count, number}} de archivos',
      files_other: '{{count, number}} archivos',
      new_one: '{{count, number}} nuevo',
      new_many: '{{count, number}} nuevos',
      new_other: '{{count, number}} nuevos',
      replace_one: '{{count, number}} reemplaza',
      replace_many: '{{count, number}} reemplazan',
      replace_other: '{{count, number}} reemplazan',
      skipped_one: '{{count, number}} omitido',
      skipped_many: '{{count, number}} omitidos',
      skipped_other: '{{count, number}} omitidos',
      unassigned_one: '{{count, number}} sin asignar',
      unassigned_many: '{{count, number}} sin asignar',
      unassigned_other: '{{count, number}} sin asignar',
      unusable_one: '{{count, number}} inutilizable',
      unusable_many: '{{count, number}} inutilizables',
      unusable_other: '{{count, number}} inutilizables'
    },
    assign: 'Asignar a Unicode',
    assignModes: {
      filename: 'Según los nombres de archivo',
      selection: 'A la selección ({{count, number}})',
      block: 'A un bloque',
      blockConstrained: 'A un bloque (parar al final)'
    },
    prefix: 'Prefijo',
    prefixTip: 'Texto antes de la parte del nombre que indica el carácter (p. ej. char en char_A.svg)',
    prefixNone: 'ninguno',
    separator: 'Separador',
    separatorTip: 'Divide el nombre en partes; las partes se unen en una secuencia (f_i → ligadura fi)',
    separators: {
      underscore: '_ guion bajo',
      dash: '- guion',
      dot: '. punto',
      space: '␣ espacio',
      none: 'ninguno'
    },
    namesHint: 'Los nombres pueden ser caracteres (A, fi), U+0041, uni0041 o hexadecimales como 00e9.',
    selectionHint: 'Los archivos se asignan a las casillas seleccionadas en el orden de selección.',
    block: 'Bloque',
    blockStart: 'Inicio del bloque',
    blockStarts: {
      begin: 'Empezar por el principio',
      firstEmpty: 'Empezar por la primera casilla vacía'
    },
    existingGlyphs: 'Glifos existentes',
    /** What to do with glyphs that exist (core/import-assign OverlapMode). */
    overlap: {
      overwrite: 'Reemplazar trazado y transformaciones',
      overwriteEmpty: 'Reemplazar transformaciones solo de los glifos vacíos',
      preserve: 'Reemplazar trazado, conservar transformaciones',
      ignore: 'No importar'
    },
    options: 'Opciones',
    keepLinked: 'Mantener los archivos vinculados (recarga en vivo al guardar)',
    textLabels: 'Las etiquetas de texto de los SVG se convierten en componentes',
    transforms: 'Transformaciones de los glifos importados',
    importAll: 'Importar todos los archivos',
    /** File list column headers. */
    columns: {
      file: 'Archivo',
      target: 'Destino',
      override: 'Forzar'
    },
    importFile: 'Importar {{fileName}}',
    noPaths: 'No hay trazados utilizables.',
    /** File details, joined by " · ". */
    size: '{{width}} × {{height}}',
    markedBox: 'caja marcada',
    labels_one: '{{count, number}} etiqueta',
    labels_many: '{{count, number}} de etiquetas',
    labels_other: '{{count, number}} etiquetas',
    unassigned: 'sin asignar',
    overrideFor: 'Forzar Unicode de {{fileName}}',
    overrideAuto: 'auto',
    /** Status chips of the file rows. */
    status: {
      new: 'nuevo',
      replace: 'reemplaza',
      skip: 'omite'
    }
  },

  // Font file import dialog (TTF, OTF, WOFF).
  font: {
    titleNew: 'Nueva fuente a partir de un archivo de fuente',
    title: 'Importar glifos de un archivo de fuente',
    /** First History entry of the new font. */
    imported: 'Se importó {{fileName}}',
    created: 'Fuente creada a partir de {{fileName}}',
    glyphs_one: '{{count, number}} glifo',
    glyphs_many: '{{count, number}} de glifos',
    glyphs_other: '{{count, number}} glifos',
    createFont_one: 'Crear fuente ({{count, number}} glifo)',
    createFont_many: 'Crear fuente ({{count, number}} de glifos)',
    createFont_other: 'Crear fuente ({{count, number}} glifos)',
    unreadable: 'No se pudo leer este archivo: {{error}}',
    family: 'Familia',
    unitsPerEm: 'Unidades por EM',
    ascenderDescender: 'Ascendente / descendente',
    glyphsLabel: 'Glifos',
    /** "Glyphs" value parts, joined by ", ". */
    characters_one: '{{count, number}} carácter',
    characters_many: '{{count, number}} de caracteres',
    characters_other: '{{count, number}} caracteres',
    ligatures_one: '{{count, number}} ligadura',
    ligatures_many: '{{count, number}} de ligaduras',
    ligatures_other: '{{count, number}} ligaduras',
    scaled: 'Los contornos se escalan para que el ascendente de la fuente coincida con el tuyo ({{ascent}}); los márgenes laterales pasan a desplazamiento y empuje.',
    includeLigatures: 'Incluir ligaduras (de la función liga de GSUB)',
    keepExisting_one: 'Conservar mi {{count, number}} glifo existente',
    keepExisting_many: 'Conservar mis {{count, number}} de glifos existentes',
    keepExisting_other: 'Conservar mis {{count, number}} glifos existentes',
    replaceExisting_one: 'Reemplazar {{count, number}} glifo existente',
    replaceExisting_many: 'Reemplazar {{count, number}} de glifos existentes',
    replaceExisting_other: 'Reemplazar {{count, number}} glifos existentes'
  },

  // .mkfont import dialog (glyphs from another project).
  mkfont: {
    title: 'Importar glifos de otro proyecto de fuente',
    summary_one: '{{count, number}} glifo · EM {{em}}',
    summary_many: '{{count, number}} de glifos · EM {{em}}',
    summary_other: '{{count, number}} glifos · EM {{em}}',
    summaryRescaled_one: '{{count, number}} glifo · EM {{em}} (reescalado ×{{factor}})',
    summaryRescaled_many: '{{count, number}} de glifos · EM {{em}} (reescalados ×{{factor}})',
    summaryRescaled_other: '{{count, number}} glifos · EM {{em}} (reescalados ×{{factor}})',
    all: 'Todos',
    none: 'Ninguno',
    onlyMissing: 'Solo los que faltan aquí',
    keepExisting: 'Conservar los glifos que ya existen aquí',
    replaceExisting: 'Reemplazar los glifos que ya existen aquí',
    withComponents: 'Importar también los glifos de componente que faltan aquí',
    glyphsToImport: 'Glifos que importar',
    /** A glyph the open font has too: tooltip, and accessible name. */
    existsTip: '{{glyph}} (ya existe aquí)',
    existsName: '{{name}}, ya existe aquí'
  }
} satisfies Catalog<typeof en>
