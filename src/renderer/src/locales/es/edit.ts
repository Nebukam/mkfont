// Edits: glyph actions, clipboard, kerning edits, external editing; toasts and history entry names.
// One glyph or pair is named ("…Glyph", "…Pair"), several are counted ("…Glyphs", "…Pairs").
import type en from '../en/edit'
import type { Catalog } from '../catalog'

export default {
  // History entry names (History panel, undo notices).
  history: {
    createGlyph: 'Crear {{glyph}}',
    createGlyphs_one: 'Crear {{count, number}} glifo',
    createGlyphs_many: 'Crear {{count, number}} de glifos',
    createGlyphs_other: 'Crear {{count, number}} glifos',
    deleteGlyph: 'Eliminar {{glyph}}',
    deleteGlyphs_one: 'Eliminar {{count, number}} glifo',
    deleteGlyphs_many: 'Eliminar {{count, number}} de glifos',
    deleteGlyphs_other: 'Eliminar {{count, number}} glifos',
    resetGlyph: 'Restablecer {{glyph}}',
    resetGlyphs_one: 'Restablecer {{count, number}} glifo',
    resetGlyphs_many: 'Restablecer {{count, number}} de glifos',
    resetGlyphs_other: 'Restablecer {{count, number}} glifos',
    rebuildGlyph: 'Reconstruir {{glyph}}',
    rebuildGlyphs_one: 'Reconstruir {{count, number}} glifo',
    rebuildGlyphs_many: 'Reconstruir {{count, number}} de glifos',
    rebuildGlyphs_other: 'Reconstruir {{count, number}} glifos',
    composeGlyph: 'Componer {{glyph}}',
    composeGlyphs_one: 'Componer {{count, number}} glifo',
    composeGlyphs_many: 'Componer {{count, number}} de glifos',
    composeGlyphs_other: 'Componer {{count, number}} glifos',
    addComponent: 'Añadir componente {{glyph}}',
    addComponents_one: 'Añadir {{count, number}} componente',
    addComponents_many: 'Añadir {{count, number}} de componentes',
    addComponents_other: 'Añadir {{count, number}} componentes',
    showAllComponents: 'Mostrar todos los componentes',
    hideAllComponents: 'Ocultar todos los componentes',
    createLigature: 'Crear ligadura {{chars}}',
    reloadGlyph: 'Recargar {{glyph}} desde el archivo',
    reloadGlyphs_one: 'Recargar {{count, number}} glifo desde el archivo',
    reloadGlyphs_many: 'Recargar {{count, number}} de glifos desde los archivos',
    reloadGlyphs_other: 'Recargar {{count, number}} glifos desde los archivos',
    pasteOntoGlyph: 'Pegar sobre {{glyph}}',
    pasteOntoGlyphs_one: 'Pegar sobre {{count, number}} glifo',
    pasteOntoGlyphs_many: 'Pegar sobre {{count, number}} de glifos',
    pasteOntoGlyphs_other: 'Pegar sobre {{count, number}} glifos',
    pasteSvgInto: 'Pegar SVG en {{glyph}}',
    pasteInPlace_one: 'Pegar {{count, number}} glifo en el mismo lugar',
    pasteInPlace_many: 'Pegar {{count, number}} de glifos en el mismo lugar',
    pasteInPlace_other: 'Pegar {{count, number}} glifos en el mismo lugar',
    pasteTransforms_one: 'Pegar transformaciones sobre {{count, number}} glifo',
    pasteTransforms_many: 'Pegar transformaciones sobre {{count, number}} de glifos',
    pasteTransforms_other: 'Pegar transformaciones sobre {{count, number}} glifos',
    replaceComponents: 'Reemplazar componentes',
    pasteComponents: 'Pegar componentes',
    pasteComponentTransforms: 'Pegar transformaciones de componentes',
    addPair: 'Añadir par de kerning {{pair}}',
    setKerningPair: 'Definir kerning de {{pair}}',
    setKerningPairs_one: 'Definir kerning de {{count, number}} par',
    setKerningPairs_many: 'Definir kerning de {{count, number}} de pares',
    setKerningPairs_other: 'Definir kerning de {{count, number}} pares',
    applySuggestionPair: 'Aplicar el kerning sugerido a {{pair}}',
    applySuggestionPairs_one: 'Aplicar {{count, number}} valor de kerning sugerido',
    applySuggestionPairs_many: 'Aplicar {{count, number}} de valores de kerning sugeridos',
    applySuggestionPairs_other: 'Aplicar {{count, number}} valores de kerning sugeridos',
    inheritPair: 'Heredar kerning para {{pair}}',
    inheritPairs_one: 'Heredar kerning para {{count, number}} par',
    inheritPairs_many: 'Heredar kerning para {{count, number}} de pares',
    inheritPairs_other: 'Heredar kerning para {{count, number}} pares',
    inheritOn: 'Las letras acentuadas siguen a su letra base',
    inheritOff: 'Las letras acentuadas tienen su propio kerning',
    removePair: 'Quitar par de kerning {{pair}}',
    removePairs_one: 'Quitar {{count, number}} par de kerning',
    removePairs_many: 'Quitar {{count, number}} de pares de kerning',
    removePairs_other: 'Quitar {{count, number}} pares de kerning'
  },

  // Undo notice after an edit (actions.ts offerUndo).
  undo: {
    action: 'Deshacer',
    fontClosed: 'La fuente se cerró',
    /** By kind of edit. */
    alreadyUndone: {
      delete: 'La eliminación ya está deshecha',
      change: 'El cambio ya está deshecho',
      removal: 'La supresión ya está deshecha'
    },
    notUndone: {
      delete: 'No se deshizo la eliminación',
      change: 'No se deshizo el cambio',
      removal: 'No se deshizo la supresión'
    },
    notUndoneDetail: 'Hubo otros cambios después. Usa el panel Historial para volver atrás.'
  },

  // Glyph actions (app/actions.ts).
  allSlotsHaveGlyphs: 'Todas las casillas seleccionadas ya tienen glifo',
  createMany: {
    title_one: '¿Crear {{count, number}} glifo?',
    title_many: '¿Crear {{count, number}} de glifos?',
    title_other: '¿Crear {{count, number}} glifos?',
    message: 'Crear tantos glifos a la vez puede ralentizar el editor.',
    confirm: 'Crear'
  },
  deletedGlyph: '{{glyph}} eliminado',
  deletedGlyphs_one: '{{count, number}} glifo eliminado',
  deletedGlyphs_many: '{{count, number}} de glifos eliminados',
  deletedGlyphs_other: '{{count, number}} glifos eliminados',
  noDecomposition: 'No hay descomposición disponible',
  noDecompositionDetail: 'Solo los caracteres con una descomposición Unicode (como é = e + ◌́) pueden componerse automáticamente.',
  alsoCreatedComponents_one: 'También se creó {{count, number}} glifo de componente que faltaba',
  alsoCreatedComponents_many: 'También se crearon {{count, number}} de glifos de componente que faltaban',
  alsoCreatedComponents_other: 'También se crearon {{count, number}} glifos de componente que faltaban',
  alsoCreatedComponentsDetail: 'Están vacíos: impórtalos o dibújalos para completar la composición.',
  /** Glyph picker opened to add components (title and button). */
  addComponents: 'Añadir componentes',
  ligatureNeedsTwo: 'Selecciona al menos dos caracteres para crear una ligadura',
  ligatureExists: 'Esa ligadura ya existe; se ha seleccionado',
  copiedCharacters_one: '{{count, number}} carácter copiado',
  copiedCharacters_many: '{{count, number}} de caracteres copiados',
  copiedCharacters_other: '{{count, number}} caracteres copiados',
  copiedUnicodeValues_one: '{{count, number}} valor Unicode copiado',
  copiedUnicodeValues_many: '{{count, number}} de valores Unicode copiados',
  copiedUnicodeValues_other: '{{count, number}} valores Unicode copiados',
  copiedOutline: 'Contorno de {{glyph}} copiado como SVG',

  // Selection slots 0–9.
  presets: {
    stored: 'Selección guardada en la memoria {{slot}}',
    cleared: 'Memoria de selección {{slot}} vaciada',
    glyphs_one: '{{count, number}} glifo',
    glyphs_many: '{{count, number}} de glifos',
    glyphs_other: '{{count, number}} glifos',
    empty: 'La memoria de selección {{slot}} está vacía',
    emptyDetail: 'Usa Ctrl+{{slot}} para guardar la selección actual.'
  },

  // Illustrator artboard template.
  artboards: {
    tooMany: 'Illustrator admite hasta {{max, number}} mesas de trabajo',
    tooManyDetail_one: 'Solo se incluyen los primeros {{max, number}} de {{count, number}} glifo.',
    tooManyDetail_many: 'Solo se incluyen los primeros {{max, number}} de {{count, number}} de glifos.',
    tooManyDetail_other: 'Solo se incluyen los primeros {{max, number}} de {{count, number}} glifos.',
    /** Save dialog title. */
    saveTitle: 'Guardar script de Illustrator',
    saved: 'Script de Illustrator guardado',
    savedDetail: 'Ejecútalo desde Archivo › Scripts › Otro script… para crear una mesa de trabajo por glifo.'
  },

  // Bound files and external editing (app/bindings.ts).
  bindings: {
    unbound: '{{fileName}} desvinculado',
    unboundDetail: 'Se eliminó el archivo.',
    couldNotReloadGlyph: 'No se pudo recargar {{glyph}}',
    couldNotReloadGlyphs_one: 'No se pudo recargar {{count, number}} glifo',
    couldNotReloadGlyphs_many: 'No se pudieron recargar {{count, number}} de glifos',
    couldNotReloadGlyphs_other: 'No se pudieron recargar {{count, number}} glifos',
    couldNotReloadFile: 'No se pudo recargar {{fileName}}',
    pickEditor: {
      title: '¿Con qué aplicación editar los SVG?',
      message: 'Elige tu editor vectorial (Illustrator, Inkscape, Affinity…). Puedes cambiarlo más tarde en Preferencias.',
      choose: 'Elegir aplicación…',
      systemDefault: 'Usar la predeterminada del sistema',
      /** File dialog title. */
      dialogTitle: 'Selecciona tu editor de SVG'
    },
    needsDesktop: 'La edición externa requiere la aplicación de escritorio',
    couldNotOpenEditor: 'No se pudo abrir el editor',
    editing: 'Editando {{glyph}} externamente',
    editingDetail: 'Los cambios guardados en el editor actualizan el glifo.'
  },

  // Copy and paste (app/clipboard.ts).
  clipboard: {
    nothingToCopy: 'Nada que copiar',
    nothingToCopyDetail: 'Selecciona antes glifos existentes.',
    copiedGlyph: '{{glyph}} copiado',
    copiedGlyphs_one: '{{count, number}} glifo copiado',
    copiedGlyphs_many: '{{count, number}} de glifos copiados',
    copiedGlyphs_other: '{{count, number}} glifos copiados',
    selectWhere: 'Selecciona dónde pegar',
    selectWhereDetail: 'Los glifos pegados se reparten por la selección.',
    selectSvgTarget: 'Selecciona un glifo en el que pegar el SVG',
    nothingToPaste: 'Nada que pegar',
    nothingToPasteDetail: 'Copia glifos, o código SVG desde un editor vectorial.',
    nothingToPasteInPlaceDetail: 'Copia antes algunos glifos.',
    couldNotPasteSvg: 'No se pudo pegar el SVG',
    svgNoPaths: 'No tiene trazados utilizables.',
    inPlaceSameFont: 'Pegar en el mismo lugar copia glifos entre fuentes',
    inPlaceSameFontDetail: 'Abre otra fuente y pega allí en el mismo lugar.',
    selectTransformsTarget: 'Selecciona glifos existentes sobre los que pegar las transformaciones',
    copyGlyphFirst: 'Copia antes un glifo',
    selectExisting: 'Selecciona antes glifos existentes',
    copyComponentsFirst: 'Copia antes un glifo con componentes'
  },

  // Kerning edits (app/kerning.ts).
  kerning: {
    pairExists: 'Ese par ya existe; se ha seleccionado',
    typeTwo: 'Escribe dos caracteres para añadir un par',
    typeTwoDetail: 'O dos glifos separados por un espacio, como «fi x» para una ligadura seguida de x.',
    appliedSuggestions_one: '{{count, number}} valor de kerning sugerido aplicado',
    appliedSuggestions_many: '{{count, number}} de valores de kerning sugeridos aplicados',
    appliedSuggestions_other: '{{count, number}} valores de kerning sugeridos aplicados',
    removedPair: 'Par de kerning {{pair}} quitado',
    removedPairs_one: '{{count, number}} par de kerning quitado',
    removedPairs_many: '{{count, number}} de pares de kerning quitados',
    removedPairs_other: '{{count, number}} pares de kerning quitados',
    copiedPairs_one: '{{count, number}} par copiado',
    copiedPairs_many: '{{count, number}} de pares copiados',
    copiedPairs_other: '{{count, number}} pares copiados'
  }
} satisfies Catalog<typeof en>
