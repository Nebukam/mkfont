// Command labels, by command id nested at its dots ("file.saveAs" → file.saveAs): menu bar,
// command palette, shortcuts dialog, toolbar tips. The selection slot commands
// (preset.restore.0…9) share one message per kind, with the slot number.
// Besides the ids: groups (menu bar titles, palette detail, shortcuts dialog headings),
// withShortcut (tooltips) and palette (the command palette); no command id starts with these.
import type en from '../en/commands'
import type { Catalog } from '../catalog'

export default {
  groups: {
    File: 'Archivo',
    Edit: 'Edición',
    Select: 'Selección',
    Glyph: 'Glifo',
    View: 'Ver',
    Help: 'Ayuda'
  },
  // A command's tooltip: "Undo (Ctrl+Z)".
  withShortcut: '{{label}} ({{shortcut}})',
  file: {
    new: 'Nueva fuente',
    open: 'Abrir…',
    save: 'Guardar',
    saveAs: 'Guardar como…',
    importSvg: 'Importar SVG…',
    importFont: 'Importar glifos de un archivo de fuente…',
    importMkfont: 'Importar glifos de otro .mkfont…',
    newFromFont: 'Nueva fuente a partir de un archivo de fuente…',
    newFromSvgs: 'Nueva fuente a partir de archivos SVG…',
    export: 'Exportar fuente',
    exportTtf: 'Exportar como TTF',
    exportOtf: 'Exportar como OTF (CFF)',
    exportWoff: 'Exportar como WOFF',
    exportWoff2: 'Exportar como WOFF2',
    exportBatch: 'Exportación por lotes…',
    close: 'Cerrar fuente'
  },
  app: {
    prefs: 'Preferencias…'
  },
  edit: {
    undo: 'Deshacer',
    redo: 'Rehacer',
    copy: 'Copiar glifos',
    paste: 'Pegar',
    pasteInPlace: 'Pegar en el mismo lugar (mismas casillas)',
    pasteTransforms: 'Pegar transformaciones',
    delete: 'Eliminar'
  },
  select: {
    all: 'Seleccionar todo en la vista',
    none: 'Deseleccionar',
    invert: 'Invertir selección en la vista',
    existing: 'Conservar solo los glifos existentes'
  },
  glyph: {
    create: 'Crear glifos vacíos',
    reset: 'Restablecer glifos (borrar contorno y componentes)',
    resetKeep: 'Restablecer contorno, conservar componentes',
    compose: 'Crear componentes a partir de la descomposición',
    ligature: 'Crear ligadura a partir de la selección',
    ligatureComp: 'Crear ligadura con componentes',
    kern: 'Ajustar el kerning de los dos glifos seleccionados',
    ligatureFinder: 'Buscador de ligaduras…',
    editOutline: 'Editar el contorno',
    editExternal: 'Editar en un editor externo',
    copyChars: 'Copiar la selección como caracteres',
    copyHex: 'Copiar la selección como valores Unicode'
  },
  view: {
    search: 'Buscar glifo…',
    palette: 'Paleta de comandos…',
    back: 'Atrás',
    forward: 'Adelante',
    nextTab: 'Fuente siguiente',
    prevTab: 'Fuente anterior',
    left: 'Mostrar u ocultar la barra lateral',
    right: 'Mostrar u ocultar el inspector',
    panel: {
      browse: 'Explorador de glifos',
      preview: 'Vista previa de texto',
      history: 'Historial',
      font: 'Información y métricas de la fuente'
    },
    kerning: 'Pares de kerning',
    commonPairs: 'Pares de kerning comunes',
    detected: 'Pares de kerning detectados',
    zoomIn: 'Celdas de glifo más grandes',
    zoomOut: 'Celdas de glifo más pequeñas',
    uiBigger: 'Interfaz más grande',
    uiSmaller: 'Interfaz más pequeña',
    uiReset: 'Tamaño real de la interfaz',
    theme: 'Alternar tema claro / oscuro'
  },
  help: {
    shortcuts: 'Atajos de teclado',
    updates: 'Buscar actualizaciones',
    about: 'Acerca de MkFont'
  },
  // preset.<kind>.<slot> (hidden from the menus and the palette).
  preset: {
    restore: 'Restaurar la memoria de selección {{slot}}',
    store: 'Guardar la selección en la memoria {{slot}}',
    append: 'Añadir la memoria de selección {{slot}}'
  },
  palette: {
    title: 'Paleta de comandos',
    input: 'Comando o carácter',
    placeholder: 'Escribe un comando, o un carácter / U+XXXX para ir a él',
    list: 'Comandos',
    // First entry when the query is a character or a code point: "Go to A U+0041".
    goTo: 'Ir a {{glyph}} {{code}}',
    noMatch: 'Ningún comando coincide.'
  }
} satisfies Catalog<typeof en>
