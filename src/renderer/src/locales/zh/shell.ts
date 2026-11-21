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
    browse: '浏览字形',
    preview: '文本预览',
    history: '历史记录',
    font: '字体信息与度量'
  },
  sidebar: '侧边栏',
  inspector: '检查器',
  hideInspector: '隐藏检查器',
  showInspector: '显示检查器',
  darkTheme: '深色主题',
  lightTheme: '浅色主题',
  preferences: '偏好设置',
  // Panel resize handles.
  resizeSidebar: '调整侧边栏大小',
  resizeInspector: '调整检查器大小',
  pixels: '{{value}} 像素',
  status: {
    glyphs_other: '<n>{{count, number}}</n> 个字形',
    selected_other: '已选 {{count, number}} 个',
    // After a hovered pair's name and code points.
    kerning: '· 字偶距 {{value}}',
    metrics: 'EM {{em}} · 基线 {{baseline}} · 上伸 {{ascent}} · 下伸 {{descent}}',
    metricsTip: 'EM · 基线 · 上伸部 · 下伸部',
    toggleLabels: '切换槽位标签',
    labelsOn: '标签：开',
    labelsOff: '标签：关',
    cellSize: '字形单元格大小',
    cellSizeTip: '字形单元格大小（在网格上按 Ctrl+滚轮）',
    ucd: 'UCD {{version}}',
    ucdTip: 'Unicode 字符数据库版本'
  },
  // Open fonts, one tab each in the header.
  tabs: {
    openFonts: '已打开的字体',
    unsaved: '{{name}}，有未保存的更改',
    notSaved: '{{fileName}}（尚未保存）',
    closeFont: '关闭 {{name}}',
    close: '关闭 ({{shortcut}})',
    closePlain: '关闭'
  },
  // Dropping files on the window.
  drop: {
    hint: '拖放 .mkfont、字体文件或 SVG（将 SVG 拖放到槽位上可导入到该处）',
    closeDialog: '请先关闭对话框',
    closeDialogDetail: '然后再次拖放文件。'
  },
  welcome: {
    tagline: '用 SVG 和可复用的组件组合字体。',
    newFont: '新建字体',
    newFontDetail: '从空白字体开始',
    open: '打开…',
    openDetail: '打开 .mkfont 项目',
    fromFontFile: '从字体文件新建…',
    fromFontFileDetail: '从现有的 TTF、OTF 或 WOFF 开始',
    fromSvgs: '从 SVG 文件新建…',
    fromSvgsDetail: '新建字体并导入一个 SVG 文件夹',
    sample: '打开示例字体',
    sampleDetail: '由组件构成的基本拉丁字母，带字偶距',
    dropHint: '你也可以将 .mkfont、字体文件或 SVG 文件拖放到此窗口的任意位置。',
    recent: '最近使用',
    noRecent: '你打开的字体会显示在这里。',
    recentNeedsDesktop: '最近使用的文件仅在桌面应用中可用。',
    recentFiles: '最近使用的文件',
    removeRecent: '从最近使用的文件中移除 {{name}}',
    removeRecentTip: '从最近使用中移除',
    appVersion: 'MkFont {{version}}',
    unicodeVersion: 'Unicode {{version}}',
    checkUpdates: '检查更新',
    shortcuts: '快捷键',
    preferences: '偏好设置'
  },
  // Shown when the interface crashes.
  crash: {
    title: '出了点问题',
    message_other: '编辑器遇到意外错误。你的字体仍在内存中。',
    retry: '重试',
    rescue_other: '保存 {{count, number}} 个应急副本…',
    rescueTitle: '保存 {{name}} 的应急副本',
    rescueFailed: '无法保存 {{name}} 的应急副本',
    // One panel failed (sidebar, glyph grid, inspector); the rest of the window still works.
    region: '此面板遇到意外错误。',
    // A dialog or a context menu failed while showing: it was closed as if cancelled.
    dialogClosed: '对话框遇到意外错误，已关闭',
    menuClosed: '菜单遇到意外错误，已关闭'
  },
  // File type names in open and save dialogs.
  filters: {
    mkfont: 'MkFont 项目',
    svg: 'SVG 文件',
    font: '字体文件',
    ttf: 'TrueType 字体',
    otf: 'OpenType 字体 (CFF)',
    woff: 'WOFF Web 字体',
    woff2: 'WOFF2 Web 字体',
    jsx: 'Illustrator 脚本'
  },
  updates: {
    available: 'MkFont {{latest}} 已发布（当前版本 {{current}}）',
    openReleases: '打开发布页面',
    upToDate: '已是最新版本 ({{current}})',
    failed: '无法检查更新',
    httpError: 'GitHub 返回了 {{status}}'
  },
  errors: {
    couldNotRead: '无法读取 {{path}}'
  }
} satisfies Catalog<typeof en>
