// Confirm, Glyph picker, Ligature finder and Preferences dialogs.
import type en from '../en/dialogs'
import type { Catalog } from '../catalog'

export default {
  // Default buttons of a confirmation.
  ok: '确定',
  cancel: '取消',
  glyphPicker: {
    title: '选取字形',
    choose: '选择',
    // The confirm button with how many glyphs are picked: "Choose (3)".
    confirmCount_other: '{{label}} ({{count, number}})',
    hint: '双击以选择',
    hintMulti: '单击以选取，Shift+单击选取范围',
    search: '字符、名称或 U+XXXX',
    inFont: '字体中',
    allCharacters: '所有字符',
    glyphs: '字形',
    noMatch: '没有匹配的字形。',
    truncated_other: '显示 {{count, number}} 个中的 {{shown, number}} 个 — 请细化搜索。'
  },
  ligatures: {
    title: '连字查找器',
    subtitle: '粘贴一段文本以查找常见的字符序列，或每行列出一个连字。',
    results_other: '{{count, number}} 个结果',
    // The result list stops at {{max}}.
    resultsCapped_other: '{{count, number}} 个结果（前 {{max, number}} 个）',
    selected_other: '已选 {{count, number}} 个',
    createAll: '全部创建 ({{count, number}})',
    createSelected: '创建所选 ({{count, number}})',
    placeholderLines: '每行一个连字，例如：\nfi\nffl\nTh',
    placeholderText: '在此粘贴文本示例…',
    eachLine: '每行为一个连字',
    minLength: '最小长度',
    maxLength: '最大长度',
    minCount: '最少次数',
    found: '找到的连字',
    exists: '字体中已有',
    // A result's accessible name: the ligature, its code points, how often it occurs.
    chip: '{{ligature}} {{code}}',
    chipExists: '{{ligature}} {{code}}，字体中已有',
    chipCount_other: '{{ligature}} {{code}}，出现 {{count, number}} 次',
    chipCountExists_other: '{{ligature}} {{code}}，出现 {{count, number}} 次，字体中已有',
    noResults: '这些设置没有找到结果。',
    noText: '请添加要分析的文本。',
    // History entry and toast.
    create_other: '创建 {{count, number}} 个连字',
    created_other: '已创建 {{count, number}} 个连字',
    allExist: '这些连字已存在'
  },
  // Batch export: several formats at once, into one folder.
  batchExport: {
    title: '批量导出',
    subtitle: '一次将字体导出为多种格式',
    formats: '格式',
    needsDesktopApp: '此浏览器不支持：请使用桌面应用',
    fileName: '文件名',
    fileNameTip: '每个文件使用此名称和对应格式的扩展名',
    folder: '文件夹',
    noFolder: '尚未选择',
    choose: '选择…',
    pickFolder: '导出文件夹',
    downloads: '文件将保存为下载内容。',
    export_other: '导出 {{count, number}} 个文件'
  },
  prefs: {
    title: '偏好设置',
    done: '完成',
    appearance: '外观',
    language: '语言',
    // {{language}}: the system's language, named in itself ("Français").
    systemLanguage: '跟随系统（{{language}}）',
    theme: '主题',
    dark: '深色',
    light: '浅色',
    system: '跟随系统',
    uiScale: '界面大小',
    uiScaleTip: '缩放整个窗口 (Ctrl+Shift+= / Ctrl+Shift+-)',
    cellSize: '单元格大小',
    slotLabels: '槽位标签',
    import: '导入',
    markColor: '标记颜色',
    markColorTip: '导入的 SVG 中以此颜色绘制的路径定义字形框',
    export: '导出',
    format: '格式',
    formatTip: '“导出”的默认格式 (Ctrl+E)',
    ttfTip: 'TrueType（二次曲线）— 与 MkFont 1 相同的流程',
    otfTip: 'OpenType CFF（三次曲线）— 保持曲线精确',
    woffTip: 'WOFF — Web 字体，TrueType 轮廓，已压缩',
    woff2Tip: 'WOFF2 — Web 字体，TrueType 轮廓，文件最小',
    folder: '文件夹',
    folderTip: '字体首次导出前的导出位置；此后，每个字体都会打开其上次的导出文件夹',
    projectFolder: '字体的项目文件夹',
    pickExportFolder: '默认导出文件夹',
    choose: '选择…',
    useProjectFolder: '使用字体的项目文件夹',
    saving: '保存',
    autosave: '自动保存',
    autosaveTip: '仅限已保存过的字体',
    autosaveEvery: '自动保存间隔（分钟）',
    // Unit after the autosave interval.
    minutes: '分钟',
    externalEditor: '外部编辑器',
    svgEditor: 'SVG 编辑器',
    svgEditorTip: '用于“在外部编辑器中编辑”',
    systemApp: '系统默认应用',
    askFirst: '首次使用时询问',
    pickEditor: '选择你的 SVG 编辑器',
    // Button: use the system's default app for SVG files.
    systemButton: '系统默认'
  }
} satisfies Catalog<typeof en>
