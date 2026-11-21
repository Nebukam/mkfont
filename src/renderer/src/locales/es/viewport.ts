// Viewport: range titles, toolbar, progress and empty states, glyph and pair slots.
import type en from '../en/viewport'
import type { Catalog } from '../catalog'

export default {
  // The view's title and the tag beside it (rangeTitle). Block names are Unicode data; category names are in ./unicode.
  titles: {
    myGlyphs: 'Mis glifos',
    ligatures: 'Ligaduras',
    kerning: 'Kerning',
    commonPairs: 'Pares comunes',
    commonPairsGroup: 'Pares comunes · {{group}}',
    detected: 'Pares detectados',
    allCharacters: 'Todos los caracteres',
    category: '{{group}} · {{name}}'
  },
  tags: {
    font: 'Fuente',
    kerning: 'Kerning',
    unicode: 'Unicode',
    block: 'Bloque',
    category: 'Categoría {{gc}}'
  },
  // The line under the title. Segments are joined with `separator`; <n> and <s> are styled counts.
  status: {
    separator: ' · ',
    progress_one: '<n>{{kerned, number}}</n> con kerning · {{zero, number}} en 0 · {{inherited, number}} heredados · <n>{{none, number}}</n> pendientes, de {{count, number}} par',
    progress_many: '<n>{{kerned, number}}</n> con kerning · {{zero, number}} en 0 · {{inherited, number}} heredados · <n>{{none, number}}</n> pendientes, de {{count, number}} de pares',
    progress_other: '<n>{{kerned, number}}</n> con kerning · {{zero, number}} en 0 · {{inherited, number}} heredados · <n>{{none, number}}</n> pendientes, de {{count, number}} pares',
    detected_one: '<n>{{count, number}}</n> par puede necesitar kerning · sugerencias aproximadas medidas en tus contornos',
    detected_many: '<n>{{count, number}}</n> de pares pueden necesitar kerning · sugerencias aproximadas medidas en tus contornos',
    detected_other: '<n>{{count, number}}</n> pares pueden necesitar kerning · sugerencias aproximadas medidas en tus contornos',
    pairs_one: '<n>{{count, number}}</n> par',
    pairs_many: '<n>{{count, number}}</n> de pares',
    pairs_other: '<n>{{count, number}}</n> pares',
    withGlyphMissing_one: '{{count, number}} con un glifo ausente',
    withGlyphMissing_many: '{{count, number}} con un glifo ausente',
    withGlyphMissing_other: '{{count, number}} con un glifo ausente',
    moreInherited_one: '{{count, number}} más heredado por letras acentuadas',
    moreInherited_many: '{{count, number}} más heredados por letras acentuadas',
    moreInherited_other: '{{count, number}} más heredados por letras acentuadas',
    glyphs_one: '<n>{{count, number}}</n> glifo',
    glyphs_many: '<n>{{count, number}}</n> de glifos',
    glyphs_other: '<n>{{count, number}}</n> glifos',
    glyphsOfSlots_one: '<n>{{count, number}}</n> glifo de {{slots, number}} casillas',
    glyphsOfSlots_many: '<n>{{count, number}}</n> de glifos de {{slots, number}} casillas',
    glyphsOfSlots_other: '<n>{{count, number}}</n> glifos de {{slots, number}} casillas',
    shown_one: '{{count, number}} visible',
    shown_many: '{{count, number}} visibles',
    shown_other: '{{count, number}} visibles',
    filteredFrom_one: 'filtrado de {{count, number}}',
    filteredFrom_many: 'filtrados de {{count, number}}',
    filteredFrom_other: 'filtrados de {{count, number}}',
    selected_one: '<s>{{count, number}} seleccionado</s>',
    selected_many: '<s>{{count, number}} seleccionados</s>',
    selected_other: '<s>{{count, number}} seleccionados</s>'
  },
  // Header actions and their "more actions" menus.
  actions: {
    create: 'Crear',
    createTip: 'Crear glifos vacíos en las casillas seleccionadas (Ctrl+Mayús+N)',
    more: 'Más acciones',
    selection: 'Selección',
    selectionCount: 'Selección ({{count, number}})',
    everythingInView: 'Todo lo de la vista ({{count, number}})',
    selectAll: 'Seleccionar todo',
    copyCharacters: 'Copiar caracteres',
    copyUnicodeValues: 'Copiar valores Unicode',
    artboardTemplate: 'Plantilla de mesas de trabajo de Illustrator…',
    createAllMissing: 'Crear todos los glifos que faltan',
    deleteAllInView: 'Eliminar todos los glifos de la vista',
    newPairPlaceholder: 'Nuevo par, p. ej. AV',
    newPairLabel: 'Nuevo par de kerning: dos caracteres, o dos glifos separados por un espacio',
    newPairTip: 'Dos caracteres (AV), o dos glifos separados por un espacio (fi x)',
    addPair: 'Añadir par',
    applyAll: 'Aplicar todo',
    applyAllTip_one: 'Dar al {{count, number}} par visible su valor sugerido (un solo paso de deshacer)',
    applyAllTip_many: 'Dar a los {{count, number}} de pares visibles sus valores sugeridos (un solo paso de deshacer)',
    applyAllTip_other: 'Dar a los {{count, number}} pares visibles sus valores sugeridos (un solo paso de deshacer)',
    applySuggestions: 'Aplicar sugerencias',
    noKerning: 'Sin kerning (mantener en 0)',
    copyAsCharacters: 'Copiar como caracteres',
    removeAllPairs: 'Quitar todos los pares de la vista',
    removePairValues: 'Quitar los valores de los pares de la vista'
  },
  search: {
    glyphsPlaceholder: 'Buscar caracteres, nombres o códigos U+ (p. ej. a, grave, U+00E9)',
    pairsPlaceholder: 'Buscar uno de los glifos de un par, o el par (p. ej. T, U+0054, AV)',
    clear: 'Borrar búsqueda',
    relatives: 'Relacionados',
    relativesTip: 'Mostrar también los caracteres relacionados (descomposiciones compartidas), incluso fuera de este intervalo',
    existingOnly: 'Solo existentes',
    existingGlyphsTip: 'Mostrar solo los glifos que existen en la fuente',
    existingPairsTip: 'Mostrar solo los pares cuyos dos glifos existen en la fuente',
    todo: 'Pendientes',
    todoTip: 'Solo los pares aún sin ajustar: sin valor propio, sin valor heredado y no marcados como sin kerning',
    rare: 'Pares poco comunes',
    rareTip: 'También pares fuera de la lista de pares comunes, primero las sugerencias más fuertes',
    results_one: '{{count, number}} resultado',
    results_many: '{{count, number}} de resultados',
    results_other: '{{count, number}} resultados'
  },
  // The order of the common pairs views.
  sort: {
    header: 'Orden',
    tip: 'Orden de los pares',
    label: 'Orden: {{order}}',
    rank: { label: 'Más comunes primero', hint: 'El orden de la lista de pares comunes' },
    detected: { label: 'Detectados primero', hint: 'Los pares aún sin ajustar para los que los contornos sugieren un valor, después los demás' }
  },
  // The view when nothing is listed.
  empty: {
    nothing: 'No hay nada que mostrar.',
    noMatch: 'No hay coincidencias para «{{text}}» en este intervalo.',
    measuring: 'Midiendo tus contornos…',
    detectedNoGlyphs: 'Esta fuente aún no tiene glifos: los pares se miden a partir de sus contornos.',
    detectedNothingRare: 'Nada destaca: todos los pares que dibuja tu fuente ya tienen kerning o están en su espaciado normal.',
    detectedNothing: 'Nada destaca: todos los pares comunes que dibuja tu fuente ya tienen kerning o están en su espaciado normal.',
    todoDone: 'No queda nada pendiente aquí: todos los pares tienen kerning, lo heredan o están marcados como sin kerning.',
    noExistingPairs: 'Ningún par tiene sus dos glifos en la fuente.',
    noExistingGlyphs: 'Ninguno de estos caracteres existe aún en la fuente.',
    noGlyphs: 'Esta fuente aún no tiene glifos.',
    noLigatures: 'Aún no hay ligaduras.',
    noPairs: 'Aún no hay pares de kerning. Escribe un par arriba, selecciona dos glifos y usa Par de kerning, o selecciona dos caracteres en la vista previa de texto.',
    goTo: 'Ir a {{chars}} {{code}} en {{block}}',
    searchAllCharacters: 'Buscar en todos los caracteres',
    searchAllCommon: 'Buscar en todos los pares comunes',
    includeRare: 'Incluir pares poco comunes',
    browseBlock: 'Explorar {{block}}',
    importSvgs: 'Importar SVG…',
    importFont: 'Importar de un archivo de fuente…',
    findLigatures: 'Buscar ligaduras en un texto…'
  },
  // The grids' accessible names.
  grid: {
    glyphs: 'Glifos',
    pairs: 'Pares de kerning',
    commonPairs: 'Pares de kerning comunes'
  },
  // A glyph cell. Its accessible name is the glyph's name and its states, joined with `separator`.
  slot: {
    separator: ', ',
    notInFont: 'no está en la fuente',
    ligature: 'ligadura',
    empty: 'vacío',
    outOfBounds: 'fuera de límites',
    notExported: 'no se exporta',
    linked: 'vinculado a un archivo',
    ligaBadge: 'LIGA',
    createEmpty: 'Crear glifo vacío',
    copyUnicode: 'Copiar valor Unicode'
  },
  // A pair cell. Its accessible name: "T U+0054 Latin Capital Letter T, then …: <states>".
  pair: {
    label: '{{left}}, luego {{right}}: {{states}}',
    separator: ', ',
    kerned: 'kerning {{value}}',
    zero: 'sin kerning',
    inherited: 'kerning {{value}}, heredado de {{pair}}',
    none: 'sin ajustar',
    suggested: 'sugerido {{value}}',
    commonRank: 'par común {{rank}}',
    notInFont: '{{glyph}} no está en la fuente',
    replacedByLigature: 'sustituido por la ligadura {{glyph}}',
    suggestedTip: 'Sugerido a partir de los contornos (no aplicado)',
    rank: '#{{rank, number}}',
    ligaBadge: 'LIGA'
  },
  // Metric line names drawn on the glyph canvas.
  canvas: {
    ascender: 'ascendente',
    capHeight: 'mayúsc.',
    xHeight: 'x',
    baseline: 'línea de base',
    descender: 'descendente'
  }
} satisfies Catalog<typeof en>
