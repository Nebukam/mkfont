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
    browse: 'Explorar glifos',
    preview: 'Vista previa de texto',
    history: 'Historial',
    font: 'Información y métricas de la fuente'
  },
  sidebar: 'Barra lateral',
  inspector: 'Inspector',
  hideInspector: 'Ocultar el inspector',
  showInspector: 'Mostrar el inspector',
  darkTheme: 'Tema oscuro',
  lightTheme: 'Tema claro',
  preferences: 'Preferencias',
  // Panel resize handles.
  resizeSidebar: 'Cambiar el tamaño de la barra lateral',
  resizeInspector: 'Cambiar el tamaño del inspector',
  pixels: '{{value}} píxeles',
  status: {
    glyphs_one: '<n>{{count, number}}</n> glifo',
    glyphs_many: '<n>{{count, number}}</n> de glifos',
    glyphs_other: '<n>{{count, number}}</n> glifos',
    selected_one: '{{count, number}} seleccionado',
    selected_many: '{{count, number}} seleccionados',
    selected_other: '{{count, number}} seleccionados',
    // After a hovered pair's name and code points.
    kerning: '· kerning {{value}}',
    metrics: 'EM {{em}} · base {{baseline}} · asc {{ascent}} · desc {{descent}}',
    metricsTip: 'EM · línea de base · ascendente · descendente',
    toggleLabels: 'Mostrar u ocultar las etiquetas de las casillas',
    labelsOn: 'Etiquetas visibles',
    labelsOff: 'Etiquetas ocultas',
    cellSize: 'Tamaño de las celdas de glifo',
    cellSizeTip: 'Tamaño de las celdas de glifo (Ctrl+rueda en la cuadrícula)',
    ucd: 'UCD {{version}}',
    ucdTip: 'Versión de la base de datos de caracteres Unicode (UCD)'
  },
  // Open fonts, one tab each in the header.
  tabs: {
    openFonts: 'Fuentes abiertas',
    unsaved: '{{name}}, cambios sin guardar',
    notSaved: '{{fileName}} (aún sin guardar)',
    closeFont: 'Cerrar {{name}}',
    close: 'Cerrar ({{shortcut}})',
    closePlain: 'Cerrar'
  },
  // Dropping files on the window.
  drop: {
    hint: 'Suelta archivos .mkfont, de fuente o SVG (suelta un SVG en una casilla para importarlo en ella)',
    closeDialog: 'Cierra antes el cuadro de diálogo',
    closeDialogDetail: 'Después vuelve a soltar los archivos.'
  },
  welcome: {
    tagline: 'Compón fuentes a partir de SVG y componentes reutilizables.',
    newFont: 'Nueva fuente',
    newFontDetail: 'Empezar con una fuente vacía',
    open: 'Abrir…',
    openDetail: 'Abrir un proyecto .mkfont',
    fromFontFile: 'Nueva a partir de un archivo de fuente…',
    fromFontFileDetail: 'Empezar a partir de un TTF, OTF o WOFF existente',
    fromSvgs: 'Nueva a partir de archivos SVG…',
    fromSvgsDetail: 'Crear una fuente e importar una carpeta de SVG',
    sample: 'Abrir la fuente de ejemplo',
    sampleDetail: 'Latín básico hecho de componentes, con kerning',
    dropHint: 'También puedes soltar un .mkfont, un archivo de fuente o archivos SVG en cualquier parte de esta ventana.',
    recent: 'Recientes',
    noRecent: 'Las fuentes que abras aparecerán aquí.',
    recentNeedsDesktop: 'Los archivos recientes están disponibles en la aplicación de escritorio.',
    recentFiles: 'Archivos recientes',
    removeRecent: 'Quitar {{name}} de los archivos recientes',
    removeRecentTip: 'Quitar de recientes',
    appVersion: 'MkFont {{version}}',
    unicodeVersion: 'Unicode {{version}}',
    checkUpdates: 'Buscar actualizaciones',
    shortcuts: 'Atajos',
    preferences: 'Preferencias'
  },
  // Shown when the interface crashes.
  crash: {
    title: 'Algo salió mal',
    message_one: 'El editor encontró un error inesperado. Tu fuente sigue en memoria.',
    message_many: 'El editor encontró un error inesperado. Tus fuentes siguen en memoria.',
    message_other: 'El editor encontró un error inesperado. Tus fuentes siguen en memoria.',
    retry: 'Reintentar',
    rescue_one: 'Guardar una copia de rescate…',
    rescue_many: 'Guardar {{count, number}} de copias de rescate…',
    rescue_other: 'Guardar {{count, number}} copias de rescate…',
    rescueTitle: 'Guardar una copia de rescate de {{name}}',
    rescueFailed: 'No se pudo guardar una copia de rescate de {{name}}',
    // One panel failed (sidebar, glyph grid, inspector); the rest of the window still works.
    region: 'Este panel encontró un error inesperado.',
    // A dialog or a context menu failed while showing: it was closed as if cancelled.
    dialogClosed: 'Un cuadro de diálogo encontró un error inesperado y se cerró',
    menuClosed: 'Un menú encontró un error inesperado y se cerró'
  },
  // File type names in open and save dialogs.
  filters: {
    mkfont: 'Proyecto de MkFont',
    svg: 'Archivos SVG',
    font: 'Archivos de fuente',
    ttf: 'Fuente TrueType',
    otf: 'Fuente OpenType (CFF)',
    woff: 'Fuente web WOFF',
    woff2: 'Fuente web WOFF2',
    jsx: 'Script de Illustrator'
  },
  updates: {
    available: 'MkFont {{latest}} está disponible (tienes la {{current}})',
    openReleases: 'Abrir la página de versiones',
    upToDate: 'Tienes la versión más reciente ({{current}})',
    failed: 'No se pudo buscar actualizaciones',
    httpError: 'GitHub respondió {{status}}'
  },
  errors: {
    couldNotRead: 'No se pudo leer {{path}}'
  }
} satisfies Catalog<typeof en>
