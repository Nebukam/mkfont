// Command labels, by command id nested at its dots ("file.saveAs" → file.saveAs): menu bar,
// command palette, shortcuts dialog, toolbar tips.
import type en from '../en/commands'
import type { Catalog } from '../catalog'

export default {
  groups: {
    File: '文件',
    Edit: '编辑',
    Select: '选择',
    Glyph: '字形',
    View: '视图',
    Help: '帮助'
  },
  // A command's tooltip: "Undo (Ctrl+Z)".
  withShortcut: '{{label}} ({{shortcut}})',
  file: {
    new: '新建字体',
    open: '打开…',
    save: '保存',
    saveAs: '另存为…',
    importSvg: '导入 SVG…',
    importFont: '从字体文件导入字形…',
    importMkfont: '从另一个 .mkfont 导入字形…',
    newFromFont: '从字体文件新建字体…',
    newFromSvgs: '从 SVG 文件新建字体…',
    export: '导出字体',
    exportTtf: '导出为 TTF',
    exportOtf: '导出为 OTF (CFF)',
    exportWoff: '导出为 WOFF',
    exportWoff2: '导出为 WOFF2',
    exportBatch: '批量导出…',
    close: '关闭字体'
  },
  app: {
    prefs: '偏好设置…'
  },
  edit: {
    undo: '撤销',
    redo: '重做',
    copy: '复制字形',
    paste: '粘贴',
    pasteInPlace: '原位粘贴（相同槽位）',
    pasteTransforms: '粘贴变换',
    delete: '删除'
  },
  select: {
    all: '全选视图中的内容',
    none: '取消选择',
    invert: '反选视图中的内容',
    existing: '仅保留已有字形'
  },
  glyph: {
    create: '创建空字形',
    reset: '重置字形（清除轮廓和组件）',
    resetKeep: '重置轮廓，保留组件',
    compose: '按分解创建组件',
    ligature: '用所选内容创建连字',
    ligatureComp: '创建带组件的连字',
    kern: '调整所选两个字形的字偶距',
    ligatureFinder: '连字查找器…',
    editOutline: '编辑轮廓',
    editExternal: '在外部编辑器中编辑',
    copyChars: '将所选内容复制为字符',
    copyHex: '将所选内容复制为 Unicode 码位'
  },
  view: {
    search: '查找字形…',
    palette: '命令面板…',
    back: '后退',
    forward: '前进',
    nextTab: '下一个字体',
    prevTab: '上一个字体',
    left: '显示/隐藏侧边栏',
    right: '显示/隐藏检查器',
    panel: {
      browse: '字形浏览器',
      preview: '文本预览',
      history: '历史记录',
      font: '字体信息与度量'
    },
    kerning: '字偶对',
    commonPairs: '常用字偶对',
    detected: '检测到的字偶对',
    zoomIn: '放大字形单元格',
    zoomOut: '缩小字形单元格',
    uiBigger: '放大界面',
    uiSmaller: '缩小界面',
    uiReset: '界面实际大小',
    theme: '切换浅色 / 深色主题'
  },
  help: {
    shortcuts: '键盘快捷键',
    updates: '检查更新',
    about: '关于 MkFont'
  },
  // preset.<kind>.<slot> (hidden from the menus and the palette).
  preset: {
    restore: '恢复选区槽位 {{slot}}',
    store: '将选区存入槽位 {{slot}}',
    append: '添加选区槽位 {{slot}}'
  },
  palette: {
    title: '命令面板',
    input: '命令或字符',
    placeholder: '输入命令，或输入字符 / U+XXXX 以跳转',
    list: '命令',
    // First entry when the query is a character or a code point: "Go to A U+0041".
    goTo: '转到 {{glyph}} {{code}}',
    noMatch: '没有匹配的命令。'
  }
} satisfies Catalog<typeof en>
