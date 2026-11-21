// Window shell: title, toolbar, status bar, tabs, welcome screen, crash screen, file dialog filters, updates.
export default {
  // Window title ("●" marks unsaved changes).
  windowTitle: '{{name}} — MkFont',
  windowTitleUnsaved: '● {{name}} — MkFont',
  // A button's tooltip with its shortcut.
  withShortcut: '{{label}} ({{shortcut}})',
  // Activity bar (left edge): the sidebar panels and the buttons below them.
  panels: {
    browse: 'Browse glyphs',
    preview: 'Text preview',
    history: 'History',
    font: 'Font info & metrics'
  },
  sidebar: 'Sidebar',
  inspector: 'Inspector',
  hideInspector: 'Hide inspector',
  showInspector: 'Show inspector',
  darkTheme: 'Dark theme',
  lightTheme: 'Light theme',
  preferences: 'Preferences',
  // Panel resize handles.
  resizeSidebar: 'Resize sidebar',
  resizeInspector: 'Resize inspector',
  pixels: '{{value}} pixels',
  status: {
    glyphs_one: '<n>{{count, number}}</n> glyph',
    glyphs_other: '<n>{{count, number}}</n> glyphs',
    selected_one: '{{count, number}} selected',
    selected_other: '{{count, number}} selected',
    // After a hovered pair's name and code points.
    kerning: '· kerning {{value}}',
    metrics: 'EM {{em}} · base {{baseline}} · asc {{ascent}} · desc {{descent}}',
    metricsTip: 'EM · baseline · ascender · descender',
    toggleLabels: 'Toggle slot labels',
    labelsOn: 'Labels on',
    labelsOff: 'Labels off',
    cellSize: 'Glyph cell size',
    cellSizeTip: 'Glyph cell size (Ctrl+wheel on the grid)',
    ucd: 'UCD {{version}}',
    ucdTip: 'Unicode Character Database version'
  },
  // Open fonts, one tab each in the header.
  tabs: {
    openFonts: 'Open fonts',
    unsaved: '{{name}}, unsaved changes',
    notSaved: '{{fileName}} (not saved yet)',
    closeFont: 'Close {{name}}',
    close: 'Close ({{shortcut}})',
    closePlain: 'Close'
  },
  // Dropping files on the window.
  drop: {
    hint: 'Drop .mkfont, font files or SVGs (drop an SVG on a slot to import it there)',
    closeDialog: 'Close the dialog first',
    closeDialogDetail: 'Then drop the files again.'
  },
  welcome: {
    tagline: 'Compose fonts from SVGs and reusable components.',
    newFont: 'New font',
    newFontDetail: 'Start from an empty font',
    open: 'Open…',
    openDetail: 'Open a .mkfont project',
    fromFontFile: 'New from font file…',
    fromFontFileDetail: 'Start from an existing TTF, OTF or WOFF',
    fromSvgs: 'New from SVG files…',
    fromSvgsDetail: 'Start a font and import a folder of SVGs',
    sample: 'Open the sample font',
    sampleDetail: 'Basic Latin built from components, with kerning',
    dropHint: 'You can also drop a .mkfont, a font file or SVG files anywhere on this window.',
    recent: 'Recent',
    noRecent: 'Fonts you open appear here.',
    recentNeedsDesktop: 'Recent files are available in the desktop app.',
    recentFiles: 'Recent files',
    removeRecent: 'Remove {{name}} from recent files',
    removeRecentTip: 'Remove from recent',
    appVersion: 'MkFont {{version}}',
    unicodeVersion: 'Unicode {{version}}',
    checkUpdates: 'Check for updates',
    shortcuts: 'Shortcuts',
    preferences: 'Preferences'
  },
  // Shown when the interface crashes.
  crash: {
    title: 'Something went wrong',
    message_one: 'The editor hit an unexpected error. Your font is still in memory.',
    message_other: 'The editor hit an unexpected error. Your fonts are still in memory.',
    retry: 'Try again',
    rescue_one: 'Save a rescue copy…',
    rescue_other: 'Save {{count, number}} rescue copies…',
    rescueTitle: 'Save a rescue copy of {{name}}',
    rescueFailed: 'Could not save a rescue copy of {{name}}',
    // One panel failed (sidebar, glyph grid, inspector); the rest of the window still works.
    region: 'This panel ran into an unexpected error.',
    // A dialog or a context menu failed while showing: it was closed as if cancelled.
    dialogClosed: 'A dialog ran into an unexpected error and was closed',
    menuClosed: 'A menu ran into an unexpected error and was closed'
  },
  // File type names in open and save dialogs.
  filters: {
    mkfont: 'MkFont project',
    svg: 'SVG files',
    font: 'Font files',
    ttf: 'TrueType font',
    otf: 'OpenType font (CFF)',
    woff: 'WOFF web font',
    woff2: 'WOFF2 web font',
    jsx: 'Illustrator script'
  },
  updates: {
    available: 'MkFont {{latest}} is available (you have {{current}})',
    openReleases: 'Open the releases page',
    upToDate: 'You’re up to date ({{current}})',
    failed: 'Could not check for updates',
    httpError: 'GitHub answered {{status}}'
  },
  errors: {
    couldNotRead: 'Could not read {{path}}'
  }
} as const
