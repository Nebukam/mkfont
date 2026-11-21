// Documents: new, open, save, export, autosave, close; their toasts, confirmations and errors.
import type en from '../en/document'
import type { Catalog } from '../catalog'

export default {
  /** A new font's file name, in its tab and the save dialog. */
  untitled: 'Sin título',
  untitledFile: 'Sin título.mkfont',
  untitledFileNumbered: 'Sin título {{n}}.mkfont',
  /** Suggested save / export file name (before the extension) of an untitled font with no family name. */
  fallbackFileName: 'fuente',
  /** A new font's family name (Font panel; written into the exported font unless changed). */
  untitledFamily: 'Sin título',

  // First History entry of a document.
  history: {
    newFont: 'Nueva fuente',
    opened: 'Abierto',
    openedFile: 'Se abrió {{fileName}}'
  },

  // Closing a document with unsaved changes.
  unsaved: {
    title: '¿Guardar los cambios de «{{fileName}}»?',
    message: 'Si no los guardas, se perderán los cambios.',
    save: 'Guardar',
    dontSave: 'No guardar',
    cancel: 'Cancelar'
  },

  // Opening.
  /** File dialog title. */
  openTitle: 'Abrir proyecto de fuente',
  opened: 'Se abrió {{fileName}}',
  openedDetail_one: '{{count, number}} glifo en {{seconds}} s',
  openedDetail_many: '{{count, number}} de glifos en {{seconds}} s',
  openedDetail_other: '{{count, number}} glifos en {{seconds}} s',
  couldNotOpen: 'No se pudo abrir {{fileName}}',
  couldNotLoadSample: 'No se pudo cargar la fuente de ejemplo',
  /** Reasons a .mkfont file cannot be read (core/deserialize); `reason` is the parser's own text. */
  parse: {
    invalid: 'No es un archivo .mkfont válido ({{reason}})',
    missingData: 'No es un archivo .mkfont válido (faltan los datos de la fuente)'
  },

  // Saving.
  /** File dialog title. */
  saveTitle: 'Guardar proyecto de fuente',
  saveFailed: 'Error al guardar',
  saved: 'Se guardó {{fileName}}',
  savedReplacedTab: 'Se cerró la pestaña que mostraba el archivo reemplazado.',
  openInOtherTab: '{{fileName}} está abierto en otra pestaña',
  openInOtherTabDetail: 'Tiene cambios sin guardar. Guarda o cierra antes esa pestaña.',
  autosaved: 'Guardado automáticamente',

  // Exporting.
  export: {
    /** File dialog title; `format` is OTF or TTF. */
    title: 'Exportar {{format}}',
    failed: 'Error al exportar',
    exported: 'Se exportó {{fileName}}',
    exportedWithWarnings_one: 'Se exportó {{fileName}} con {{count, number}} advertencia',
    exportedWithWarnings_many: 'Se exportó {{fileName}} con {{count, number}} de advertencias',
    exportedWithWarnings_other: 'Se exportó {{fileName}} con {{count, number}} advertencias',
    showInFolder: 'Mostrar en la carpeta',
    /** Notice details, joined by ", ". */
    glyphs_one: '{{count, number}} glifo',
    glyphs_many: '{{count, number}} de glifos',
    glyphs_other: '{{count, number}} glifos',
    ligatures_one: '{{count, number}} ligadura',
    ligatures_many: '{{count, number}} de ligaduras',
    ligatures_other: '{{count, number}} ligaduras',
    kerningPairs_one: '{{count, number}} par de kerning',
    kerningPairs_many: '{{count, number}} de pares de kerning',
    kerningPairs_other: '{{count, number}} pares de kerning',
    /** Errors and warnings from core/export-font. */
    noGlyphs: 'No hay ningún glifo que exportar.',
    notSfnt: 'No es una fuente TrueType ni OpenType.',
    noBrotli: 'Este navegador no puede escribir WOFF2 (no tiene compresión Brotli). Usa la aplicación de escritorio.',
    /** Batch export: the prompt before files are replaced, and the notice. {{files}}: names joined by ", ". */
    batch: {
      replaceTitle_one: '¿Reemplazar {{count, number}} archivo existente?',
      replaceTitle_many: '¿Reemplazar {{count, number}} de archivos existentes?',
      replaceTitle_other: '¿Reemplazar {{count, number}} archivos existentes?',
      replaceMessage_one: '{{files}} ya está en esta carpeta.',
      replaceMessage_many: 'Estos archivos ya están en esta carpeta: {{files}}.',
      replaceMessage_other: 'Estos archivos ya están en esta carpeta: {{files}}.',
      replace: 'Reemplazar',
      exported_one: 'Se exportó {{count, number}} archivo a {{folder}}',
      exported_many: 'Se exportaron {{count, number}} de archivos a {{folder}}',
      exported_other: 'Se exportaron {{count, number}} archivos a {{folder}}',
      downloaded_one: 'Se exportó {{count, number}} archivo',
      downloaded_many: 'Se exportaron {{count, number}} de archivos',
      downloaded_other: 'Se exportaron {{count, number}} archivos'
    },
    warnings: {
      outOfBounds: '{{glyph}} omitido: el contorno está fuera de límites',
      ligatureMissing: 'La ligadura «{{chars}}» no se sustituirá: falta {{missing}}',
      kerningSkipped_one: '{{count, number}} par de kerning omitido: falta un glifo o no se exporta',
      kerningSkipped_many: '{{count, number}} de pares de kerning omitidos: falta un glifo o no se exporta',
      kerningSkipped_other: '{{count, number}} pares de kerning omitidos: falta un glifo o no se exporta'
    }
  }
} satisfies Catalog<typeof en>
