// Glyph and pair inspectors: sections, fields, options, components, kerning.
import type en from '../en/inspector'
import type { Catalog } from '../catalog'

export default {
  // Shared by several parts of the inspector.
  goTo: 'Ir a {{glyph}}',
  more: '+{{n, number}} más',
  noSvgInClipboard: 'No hay código SVG en el portapapeles',
  details: 'Detalles',
  kerning: 'Kerning',
  components: 'Componentes',

  /** Field names inside history entry names ("Set {{field}} of A"), by field id (options.ts). */
  fields: {
    bounds: 'límites',
    scale: 'escala',
    scaleFactor: 'factor de escala',
    nrmFactor: 'margen de normalización',
    valign: 'alineación vertical',
    halign: 'alineación horizontal',
    anchor: 'anclaje',
    xshift: 'desplazamiento',
    xpush: 'empuje',
    autoW: 'ancho automático',
    yoffset: 'desfase Y',
    mirror: 'reflejo',
    skewRotOrder: 'orden de transformación',
    rot: 'rotación',
    rotAnchor: 'pivote de rotación',
    skewX: 'sesgo X',
    skewY: 'sesgo Y',
    characterRef: 'glifo',
    contextAnchor: 'anclaje de contexto',
    contextBounds: 'límites de contexto',
    xOffset: 'desfase X',
    yOffset: 'desfase Y',
    customId: 'ID personalizado',
    inverted: 'inversión',
    inheritPreviousBounds: 'contexto',
    isControlLayer: 'control',
    doExport: 'visibilidad',
    width: 'ancho',
    height: 'alto',
    export: 'exportación',
    flatten: 'aplanado',
    flattenMode: 'modo de aplanado'
  },

  /** History entry names. */
  history: {
    setFieldOfGlyph: 'Definir {{field}} de {{glyph}}',
    setFieldOfGlyphs_one: 'Definir {{field}} de {{count, number}} glifo',
    setFieldOfGlyphs_many: 'Definir {{field}} de {{count, number}} de glifos',
    setFieldOfGlyphs_other: 'Definir {{field}} de {{count, number}} glifos',
    rename: 'Cambiar el nombre de {{glyph}}',
    setFieldOfComponent: 'Definir {{field}} del componente {{component}}',
    setFieldOfComponents_one: 'Definir {{field}} de {{component}} en {{count, number}} glifo',
    setFieldOfComponents_many: 'Definir {{field}} de {{component}} en {{count, number}} de glifos',
    setFieldOfComponents_other: 'Definir {{field}} de {{component}} en {{count, number}} glifos',
    addComponent: 'Añadir componente',
    reorderComponents: 'Reordenar componentes',
    moveComponent: 'Mover componente',
    // Dragged in the glyph view.
    dragComponent: 'Recolocar componente {{component}}',
    scaleComponent: 'Escalar componente {{component}}',
    rotateComponent: 'Girar componente {{component}}',
    removeComponent: 'Quitar componente {{component}}',
    removeComponents_one: 'Quitar {{component}} de {{count, number}} glifo',
    removeComponents_many: 'Quitar {{component}} de {{count, number}} de glifos',
    removeComponents_other: 'Quitar {{component}} de {{count, number}} glifos',
    // Not kept in the history (view state).
    toggleComponent: 'Mostrar u ocultar componente',
    collapseComponents: 'Contraer componentes',
    addPair: 'Añadir par de kerning {{pair}}'
  },

  /** Option lists (options.ts). */
  options: {
    bounds: {
      imported: 'Límites importados',
      mixedVertical: 'Límites mixtos, vertical',
      mixedHorizontal: 'Límites mixtos, horizontal',
      glyph: 'Límites del glifo',
      tips: 'Qué caja se ajusta:\n• Límites importados: el viewBox del SVG / la caja marcada\n• Límites del glifo: la caja ajustada al contorno\n• Mixtos: la caja del contorno en un eje y la caja importada en el otro'
    },
    scale: {
      baselineAscender: 'Línea de base a ascendente',
      ascenderDescender: 'Ascendente a descendente',
      baselineXHeight: 'Línea de base a altura de x',
      baselineCapHeight: 'Línea de base a altura de mayúsculas',
      height: 'Altura (métricas de la fuente)',
      em: 'EM (métricas de la fuente)',
      manual: 'Manual',
      normalize: 'Normalizar (ajustar a las métricas)',
      none: 'Ninguna'
    },
    valign: {
      top: 'Arriba (ascendente)',
      baseline: 'Línea de base',
      descender: 'Descendente',
      spread: 'Extensión vertical',
      em: 'EM'
    },
    halign: {
      min: 'X mín.',
      minTip: 'Alinear el borde izquierdo de los límites (más el desplazamiento)',
      center: 'Centro',
      centerTip: 'Centrar en el ancho de avance',
      max: 'X máx.',
      maxTip: 'Alinear el borde derecho de los límites (menos el empuje)'
    },
    mirror: {
      none: 'Ninguno',
      noneTip: 'Sin reflejo',
      h: 'H',
      hTip: 'Reflejar horizontalmente',
      v: 'V',
      vTip: 'Reflejar verticalmente',
      both: 'Ambos',
      bothTip: 'Reflejar horizontal y verticalmente'
    },
    skewOrder: {
      rxy: 'Rotar → Sesgar X → Sesgar Y',
      ryx: 'Rotar → Sesgar Y → Sesgar X',
      xry: 'Sesgar X → Rotar → Sesgar Y',
      yrx: 'Sesgar Y → Rotar → Sesgar X',
      xyr: 'Sesgar X → Sesgar Y → Rotar',
      yxr: 'Sesgar Y → Sesgar X → Rotar'
    },
    flatten: {
      smart: 'Inteligente',
      smartTip: 'Tomar como referencia el ajuste vertical del glifo',
      fit: 'Ajustar',
      fitTip: 'Ajustar el contorno combinado'
    }
  },

  /** Field labels shared by the glyph transforms and the component fields. */
  transform: {
    scale: 'Escala',
    mirrorRotateSkew: 'Reflejar, rotar y sesgar',
    mirror: 'Reflejo',
    rotation: 'Rotación',
    rotationPivot: 'Pivote de rotación',
    skewX: 'Sesgo X',
    skewY: 'Sesgo Y',
    order: 'Orden'
  },

  /** Transforms section (TransformsEditor; also the font's defaults). */
  transforms: {
    title: 'Transformaciones',
    fit: 'Ajuste',
    bounds: 'Límites',
    factor: 'Factor',
    margin: 'Margen',
    marginTip: 'Margen de normalización (0,1 = 10 % de espacio extra alrededor de la caja ajustada)',
    position: 'Posición',
    anchor: 'Anclaje',
    vertical: 'Vertical',
    verticalAlignment: 'Alineación vertical',
    horizontal: 'Horizontal',
    horizontalAlignment: 'Alineación horizontal',
    spacing: 'Espaciado',
    notWithNormalize: 'No se usa al escalar con Normalizar',
    shift: 'Desplazamiento',
    shiftTip: 'Margen lateral izquierdo',
    push: 'Empuje',
    pushTip: 'Margen lateral derecho',
    autoWidth: 'Ancho automático',
    autoWidthTip: 'Avance = ancho ajustado + desplazamiento + empuje',
    yOffset: 'Desfase Y',
    // The notice above the fields when a control component drives the spacing.
    controlled: 'El espaciado sigue al componente de control <ref>{{glyph}}</ref>: su ancho de avance y su marco colocan los componentes.',
    controlledNoRef: 'El espaciado sigue al glifo del componente de control: su ancho de avance y su marco colocan los componentes.',
    goToThisGlyph: 'Ir a este glifo',
    controlledOwnEmpty: 'Estas transformaciones no tienen efecto si Aplanar no está activado.',
    controlledOwnOutline: 'Estas transformaciones solo colocan el contorno propio de este glifo.',
    controlledSome_one:
      '{{count, number}} de estos glifos toma su espaciado de un componente de control; estas transformaciones no cambian su ancho de avance.',
    controlledSome_many:
      '{{count, number}} de estos glifos toman su espaciado de un componente de control; estas transformaciones no cambian su ancho de avance.',
    controlledSome_other:
      '{{count, number}} de estos glifos toman su espaciado de un componente de control; estas transformaciones no cambian su ancho de avance.'
  },

  /** Glyph section. */
  glyph: {
    title: 'Glifo',
    name: 'Nombre',
    nameTip: 'Nombre PostScript del glifo que se escribe en la fuente (opcional)',
    nameAuto: 'automático',
    width: 'Ancho',
    widthAuto: 'Calculado a partir del contorno (ancho automático activado)',
    widthTip: 'Ancho de avance: déjalo vinculado para usar el ancho de la fuente',
    height: 'Alto',
    heightTip: 'Altura de referencia: déjala vinculada para usar la altura de la fuente',
    export: 'Exportar',
    exportTip: 'Incluir en las fuentes exportadas',
    flatten: 'Aplanar',
    flattenTip: 'Ajustar el contorno combinado (glifo + componentes) como un todo',
    flattenMode: 'Modo de aplanado'
  },

  /** The frame of the component selected in the glyph view (ComponentFrame). */
  frame: {
    label: 'Componente {{component}}',
    description: 'Arrástrelo para moverlo (con Mayús, a lo largo de un solo eje), una esquina para escalarlo, el tirador para girarlo. Las flechas lo mueven 1 unidad, 10 con Mayús. Escape lo deselecciona.',
    scaleTip: 'Escalar desde el anclaje del componente (con Alt, desde la esquina opuesta)',
    rotateTip: 'Girar alrededor del pivote de rotación (con Mayús, en pasos de 15°)'
  },

  /** Glyph view and identity at the top of the inspector (GlyphHeader). */
  header: {
    zoomOut: 'Alejar',
    zoomIn: 'Acercar',
    resizeView: 'Cambiar el tamaño de la vista del glifo',
    pixels: '{{value}} píxeles',
    copyCharacter: 'Copiar carácter',
    copyCharacterName: 'Copiar el carácter {{glyph}}',
    ligature: 'Ligadura',
    // A character's general category in the header: its name and the standard's code.
    category: '{{name}} ({{gc}})',
    unknownCharacter: 'Carácter desconocido',
    copyUnicode: 'Copiar valor Unicode',
    copyCode: 'Copiar {{code}}',
    notInFont: 'no está en la fuente',
    live: 'En vivo: {{file}}',
    unbind: 'Desvincular',
    importSvg: 'Importar un SVG en este glifo',
    pasteSvg: 'Pegar código SVG del portapapeles',
    copyGlyph: 'Copiar glifo (Ctrl+C)',
    externalEditor: 'Editar en un editor externo (recarga en vivo)',
    moreActions: 'Más acciones'
  },

  /** A selected slot with no glyph yet. */
  emptySlot: {
    createEmpty: 'Crear glifo vacío',
    createFromComponents: 'Crear a partir de componentes',
    createFromComponentsTip: 'Crea el glifo con componentes a partir de su descomposición Unicode (crea también las partes que faltan)',
    importSvg: 'Importar SVG…',
    pasteSvg: 'Pegar SVG',
    noSvgHint: 'Copia antes trazados desde tu editor vectorial.',
    dropTip: 'Consejo: suelta un archivo SVG en cualquier casilla para importarlo en ella.'
  },

  /** Several glyphs selected. */
  multi: {
    selected: '{{count, number}} seleccionados',
    existing: '{{n, number}} existentes',
    existingAndEmpty_one: '{{n, number}} existentes · {{count, number}} casilla vacía',
    existingAndEmpty_many: '{{n, number}} existentes · {{count, number}} de casillas vacías',
    existingAndEmpty_other: '{{n, number}} existentes · {{count, number}} casillas vacías',
    create: 'Crear {{n, number}}',
    ligature: 'Ligadura',
    ligatureTip: 'Crear la ligadura «{{chars}}» (orden de selección)',
    kernPair: 'Par de kerning',
    kernPairTip: 'Ajustar el kerning de «{{chars}}» (orden de selección)',
    compose: 'Componer',
    composeTip: 'Crear componentes a partir de las descomposiciones Unicode',
    reset: 'Restablecer',
    clearAll: 'Borrar contorno y componentes',
    clearKeepComponents: 'Borrar contorno, conservar componentes',
    rebuild: 'Reconstruir a partir de la descomposición',
    delete: 'Eliminar',
    createFirst: 'Crea los glifos seleccionados para editar sus propiedades a la vez.'
  },

  /** Nothing selected. */
  placeholder: {
    title: 'Selecciona uno o varios glifos para editarlos aquí.',
    multiSelect: '<k>Ctrl</k> / <k>Mayús</k> + clic para selección múltiple',
    storeSelection: '<k>Ctrl</k>+<k>0-9</k> guarda una selección, <k>0-9</k> la restaura',
    dropSvg: 'Suelta archivos SVG en una casilla para importarlos',
    palette: '<k>Ctrl</k>+<k>P</k> abre la paleta de comandos'
  },

  /** Details section. */
  detailsSection: {
    notListed: '{{code}} no aparece en la lista',
    notListedHint: 'No está en la fuente, y ninguna vista muestra caracteres sin asignar o de control.',
    advance: 'Avance',
    exported: 'Exportado',
    exportedYes: 'sí',
    exportedSkipped: 'omitido (fuera de límites)',
    outlineWidth: 'Ancho del contorno',
    outlineHeight: 'Alto del contorno',
    leftBearing: 'Margen izquierdo',
    rightBearing: 'Margen derecho',
    usedAsComponent: 'Usado como componente ×{{n, number}}',
    selectAll: 'Seleccionar todo',
    decomposition: 'Descomposición ({{n, number}})',
    decompositionTagged: 'Descomposición · {{tag}} ({{n, number}})',
    relatives: 'Relacionados ({{n, number}})'
  },

  /** Components section, single glyph and multi-selection. */
  componentsSection: {
    empty: '(vacío)',
    replace: 'Reemplazar componentes',
    add: 'Añadir componentes',
    copyTransforms: 'Copiar transformaciones de componentes',
    copyTransformsHint: 'Aplica los ajustes copiados a los componentes con el mismo glifo',
    pasteTip: 'Pegar componentes de los glifos copiados',
    addEmpty: 'Añadir un componente vacío',
    searchAdd: 'Buscar y añadir componentes',
    decompose: 'Crear componentes a partir de la descomposición Unicode',
    noDecomposition: 'Este carácter no tiene descomposición',
    showAll: 'Mostrar todos',
    hideAll: 'Ocultar todos',
    collapseAll: 'Contraer todos',
    visibilityFolding: 'Visibilidad y plegado',
    none: 'Los componentes colocan otros glifos dentro de este (acentos, partes de ligaduras…). Añade uno con + o créalos a partir de la descomposición Unicode.',
    move: 'Mover {{component}}',
    moveDescription: 'Arrastra o usa las flechas arriba y abajo',
    moveTip: 'Arrastrar para reordenar (o enfocar y usar ↑ ↓)',
    expand: 'Expandir {{component}}',
    control: 'control',
    controlTip: 'Componente de control: determina el ancho y el contexto',
    controlInactive: 'control (inactivo)',
    controlInactiveTip: 'Marcado como control, pero su glifo falta o es circular',
    circular: 'circular',
    circularTip: 'Este glifo usa el glifo anfitrión: se ignora el componente',
    missing: 'falta',
    missingTip: 'Aún no existe ningún glifo para este carácter',
    inverted: 'invertido',
    hide: 'Ocultar componente',
    show: 'Mostrar componente',
    moveUp: 'Subir',
    moveDown: 'Bajar',
    remove: 'Quitar componente',
    // Multi-selection
    addToAll: 'Añadir componentes a todos los glifos seleccionados',
    decomposeAll: 'Crear componentes a partir de las descomposiciones',
    showAllComponents: 'Mostrar todos los componentes',
    hideAllComponents: 'Ocultar todos los componentes',
    noneInSelection: 'Ninguno de los glifos seleccionados tiene componentes.',
    inGlyphs_one: 'en {{n, number}} de {{count, number}} glifo',
    inGlyphs_many: 'en {{n, number}} de {{count, number}} de glifos',
    inGlyphs_other: 'en {{n, number}} de {{count, number}} glifos',
    toggleVisibility: 'Mostrar u ocultar',
    removeFromAll: 'Quitar de todos los glifos seleccionados'
  },

  /** Component fields (LayerFields). */
  layer: {
    glyph: 'Glifo',
    glyphTip: 'Carácter, ligadura o U+XXXX del glifo que se usa como este componente',
    glyphPlaceholder: 'p. ej. A, U+0301',
    pickGlyph: 'Elegir un glifo',
    pickTitle: 'Elegir el glifo del componente',
    context: 'Contexto',
    contextTip: 'Dónde se fija el componente en el glifo anfitrión',
    contextAnchor: 'Anclaje de contexto',
    contextBounds: 'Cómo se miden los límites del anfitrión',
    component: 'Componente',
    componentTip: 'Qué punto del componente se fija',
    componentAnchor: 'Anclaje del componente',
    componentBounds: 'Cómo se miden los límites del componente',
    xOffset: 'Desfase horizontal',
    yOffset: 'Desfase vertical',
    special: 'Especial',
    customId: 'ID personalizado',
    customIdTip: 'Nombre compartido por componentes de varios glifos, para editarlos en lote y buscarlos',
    customIdNone: 'ninguno',
    invert: 'Invertir (invierte el sentido para recortar huecos)',
    previousContext: 'Usar el componente anterior como contexto',
    control: 'Componente de control (determina el ancho y el contexto)',
    controlTip: 'El anfitrión toma el ancho de avance de este componente, y los demás componentes se fijan a él'
  },

  /** Kerning section of the glyph inspector. */
  kerningSection: {
    showPairs: 'Mostrar estos pares en la vista Kerning',
    asLeft: '{{glyph}} + …',
    asRight: '… + {{glyph}}',
    inheritedFrom: 'Heredados de {{glyph}} ({{n, number}})',
    none: 'Aún no hay pares de kerning con {{glyph}}.',
    suggested: 'Sugeridos a partir de los contornos ({{n, number}})',
    applySuggestedTip: 'Dar a estos pares los valores medidos en los contornos (un solo paso de deshacer)',
    applyIt: 'Aplicarlo',
    applyAll: 'Aplicar los {{n, number}}',
    showInDetected: 'Mostrar en Pares detectados',
    showPairInDetected: 'Mostrar {{pair}} en Pares detectados',
    notInFont: '{{glyph}} no está en la fuente',
    replacedByLigature: 'Sustituido por la ligadura {{glyph}}',
    showInKerning: 'Mostrar en la vista Kerning',
    showPairInKerning: 'Mostrar {{pair}} en la vista Kerning',
    alsoApplies: 'También se aplica a {{pairs}} (las letras acentuadas siguen a su letra base)',
    alsoAppliesCount_one: 'También se aplica a {{count, number}} par acentuado',
    alsoAppliesCount_many: 'También se aplica a {{count, number}} de pares acentuados',
    alsoAppliesCount_other: 'También se aplica a {{count, number}} pares acentuados',
    kerningOf: 'Kerning de {{pair}}',
    followsBase: '{{pair}} sigue al par de sus letras base',
    remove: 'Quitar {{pair}}',
    giveMeasured: 'Dar a {{pair}} el valor medido en los contornos',
    applyTo: 'Aplicar {{value}} a {{pair}}',
    apply: 'Aplicar',
    typeOther: 'Escribe el otro glifo',
    typeOtherHint: 'Un carácter, un código U+ o una ligadura como fi.',
    alreadyPair: '{{pair}} ya es un par',
    side: 'Lado de {{glyph}} en el nuevo par',
    first: '{{glyph}} +',
    firstTip: '{{glyph}} primero',
    second: '+ {{glyph}}',
    secondTip: '{{glyph}} segundo',
    otherPlaceholder: 'Otro glifo, p. ej. A',
    glyphAfter: 'Glifo después de {{glyph}}',
    glyphBefore: 'Glifo antes de {{glyph}}',
    addPair: 'Añadir el par'
  },

  /** Inspector of the pair views (PairInspector). */
  pair: {
    tighten_one: 'Acercar {{count, number}} unidad',
    tighten_many: 'Acercar {{count, number}} de unidades',
    tighten_other: 'Acercar {{count, number}} unidades',
    loosen_one: 'Separar {{count, number}} unidad',
    loosen_many: 'Separar {{count, number}} de unidades',
    loosen_other: 'Separar {{count, number}} unidades',
    state: {
      kerned: 'Con kerning',
      zero: 'Sin kerning',
      inherited: 'Heredado',
      none: 'Sin ajustar'
    },
    // "Exported" in the Details section.
    exportedYes: 'sí',
    exportedNotKerned: 'no: sin ajustar',
    exportedNotInFont: 'no: {{glyph}} no está en la fuente',
    exportedNotInFontBoth: 'no: {{first}} y {{second}} no están en la fuente',
    exportedNotExported: 'no: {{glyph}} no se exporta',
    exportedNotExportedBoth: 'no: {{first}} y {{second}} no se exportan',
    exportedZero: 'no: no hay kerning que aplicar',
    exportedInherited: 'sí, heredado de {{pair}}',
    // Under the value field.
    follows: 'Sigue a {{pair}}: {{base}} es la letra base de {{accented}}. Escribe un valor para dar a este par uno propio.',
    ownValue: 'Valor propio; {{pair}} daría {{value}}.',
    follow: 'Seguir a {{pair}}',
    measured: 'Aún sin ajustar. Medido en los contornos, un valor de unos {{value}} igualaría su espaciado: compruébalo a ojo.',
    notKernedYet: 'Aún sin ajustar: un valor añade el par a la fuente.',
    title: 'Par de kerning {{pair}}',
    rank: 'Par común n.º {{n, number}}',
    rankTip: 'Su puesto en la lista de pares comunes (1 es el más relevante)',
    missing: '{{glyph}} no está en la fuente. El par se conserva y se exportará cuando exista.',
    missingBoth: '{{first}} y {{second}} no están en la fuente. El par se conserva y se exportará cuando existan.',
    createIt: 'Crearlo',
    createThem: 'Crearlos',
    ligature:
      'Nunca se aplica con las ligaduras activadas: la ligadura {{ligature}} sustituye a {{left}} seguida de {{right}}. Ajusta en su lugar el kerning de la ligadura con sus vecinos.',
    goToLigature: 'Ir a la ligadura',
    value: 'Valor',
    valueTip: 'Se suma al espacio entre los dos glifos, en unidades de la fuente: los valores negativos los acercan',
    units: 'unidades',
    applyTip: 'Dar al par el valor medido en los contornos',
    apply: 'Aplicar {{value}}',
    noKerning: 'Sin kerning',
    noKerningTip: 'Mantener el par en 0: revisado, no necesita kerning (no se exporta)',
    remove: 'Quitar',
    removeTip: 'Quitar su valor propio: vuelve a seguir a {{pair}}',
    exported: 'Exportado',
    advanceOf: 'Avance de {{glyph}}',
    rankLabel: 'Puesto en pares comunes',
    rankValue: 'N.º {{n, number}} de {{total, number}}',
    notListed: 'no está en la lista',
    measuredLabel: 'Medido en los contornos',
    // Several pairs selected.
    selected_one: '{{count, number}} par seleccionado',
    selected_many: '{{count, number}} de pares seleccionados',
    selected_other: '{{count, number}} pares seleccionados',
    notKerned: '{{n, number}} sin ajustar',
    valueAllTip: 'Asigna este valor a todos los pares seleccionados',
    applySuggestedTip: 'Dar a los pares aún sin ajustar los valores medidos en sus contornos',
    applySuggested: 'Aplicar {{n, number}} sugeridos',
    noKerningAllTip: 'Mantener los pares en 0: revisados, no necesitan kerning (no se exportan)',
    inherit: 'Heredar {{n, number}}',
    inheritTip: 'Descartar sus valores propios: vuelven a seguir a los pares de sus letras base',
    removeCount: 'Quitar {{n, number}}',
    // Nothing selected.
    placeholder: 'Selecciona un par para editar su kerning.',
    typePair: 'Escribe un par en la vista Kerning (AV)',
    selectTwo: 'Selecciona dos glifos y luego Par de kerning',
    selectInPreview: 'Selecciona dos caracteres en la vista previa de texto',
    doubleClick: 'Doble clic en un par para escribir su valor'
  }
} satisfies Catalog<typeof en>
