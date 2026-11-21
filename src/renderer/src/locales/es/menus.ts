// Menu bar (beside the command menus, whose items are command labels) and the context
// menus of glyphs and kerning pairs.
import type en from '../en/menus'
import type { Catalog } from '../catalog'

export default {
  bar: {
    label: 'Menú principal',
    // File menu, after Open…
    openRecent: 'Abrir reciente',
    noRecent: 'No hay archivos recientes',
    recentNeedsDesktop: 'Los archivos recientes requieren la aplicación de escritorio',
    openSample: 'Abrir la fuente de ejemplo',
    // Help menu, last item.
    github: 'MkFont en GitHub',
    // Import button and its menu.
    import: 'Importar',
    importSvg: 'Archivos SVG…',
    importFont: 'Glifos de un archivo de fuente (TTF, OTF, WOFF)…',
    importMkfont: 'Glifos de otro .mkfont…',
    // Export button and its menu.
    export: 'Exportar',
    exportTtf: 'Exportar TTF',
    exportTtfHint: 'Contornos TrueType (el mismo proceso que MkFont 1)',
    exportOtf: 'Exportar OTF',
    exportOtfHint: 'Contornos CFF, conserva las curvas exactas',
    exportWoff: 'Exportar WOFF',
    exportWoffHint: 'Fuente web: contornos TrueType, comprimida',
    exportWoff2: 'Exportar WOFF2',
    exportWoff2Hint: 'Fuente web: contornos TrueType, los archivos más pequeños',
    exportOptions: 'Opciones de exportación…',
    // The arrow button that opens the export menu.
    exportMenu: 'Opciones de exportación'
  },
  // Submenu of the glyph and pair menus.
  copyText: {
    title: 'Copiar como texto',
    characters: 'Caracteres',
    unicodeValues: 'Valores Unicode'
  },
  // Context menu of glyph slots (grid, inspector).
  glyph: {
    createEmpty_one: 'Crear glifo vacío',
    createEmpty_many: 'Crear {{count, number}} de glifos vacíos',
    createEmpty_other: 'Crear {{count, number}} glifos vacíos',
    importSvg: 'Importar SVG…',
    copy: 'Copiar',
    pasteSpecial: 'Pegado especial',
    pasteTransformsOnly: 'Pegar solo las transformaciones',
    replaceComponents: 'Reemplazar componentes',
    addComponents: 'Añadir componentes',
    copyComponentTransforms: 'Copiar transformaciones de componentes',
    outlineSvg: 'Contorno como SVG',
    outlineSvgHint: 'El contorno final, componentes incluidos',
    components: 'Componentes',
    fromDecomposition: 'Crear a partir de la descomposición',
    fromDecompositionHint: 'Crea también los glifos de componente que faltan',
    noDecomposition: 'Esta selección no tiene descomposición Unicode',
    fromDecompositionExisting: 'Crear a partir de la descomposición (solo glifos existentes)',
    addComponentsPick: 'Añadir componentes…',
    showComponents: 'Mostrar todos los componentes',
    hideComponents: 'Ocultar todos los componentes',
    createLigature: 'Crear ligadura',
    // "Kern A V": the two selected glyphs.
    kern: 'Kerning {{left}} {{right}}',
    reset: 'Restablecer',
    clearAll: 'Borrar contorno y componentes',
    clearOutline: 'Borrar contorno, conservar componentes',
    rebuild: 'Reconstruir a partir de la descomposición',
    unbind_one: 'Desvincular el archivo de origen',
    unbind_many: 'Desvincular {{count, number}} de archivos',
    unbind_other: 'Desvincular {{count, number}} archivos',
    storeInSlot: 'Guardar la selección en una memoria',
    slot: 'Memoria {{slot}}',
    artboardTemplate: 'Plantilla de mesas de trabajo de Illustrator…',
    // The item reads as for one glyph while it is disabled (no existing glyph selected).
    delete_one: 'Eliminar glifo',
    delete_many: 'Eliminar {{count, number}} de glifos',
    delete_other: 'Eliminar {{count, number}} glifos'
  },
  // Context menu of kerning pairs (the pair views).
  pair: {
    goTo: 'Ir a {{glyph}}',
    applySuggested_one: 'Aplicar el valor sugerido ({{value}})',
    applySuggested_many: 'Aplicar {{count, number}} de valores sugeridos',
    applySuggested_other: 'Aplicar {{count, number}} valores sugeridos',
    applySuggestedHint: 'Medido en los contornos: un punto de partida que hay que comprobar a ojo',
    noKerning: 'Sin kerning (mantener en 0)',
    noKerningHint: 'El par se revisó y no necesita kerning: se conserva, pero no se exporta',
    // The item reads as for one pair while it is disabled (no kerned pair selected).
    remove_one: 'Quitar par',
    remove_many: 'Quitar {{count, number}} de pares',
    remove_other: 'Quitar {{count, number}} pares'
  }
} satisfies Catalog<typeof en>
