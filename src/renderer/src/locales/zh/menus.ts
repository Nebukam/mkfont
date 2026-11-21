// Menu bar (beside the command menus, whose items are command labels) and the context
// menus of glyphs and kerning pairs.
import type en from '../en/menus'
import type { Catalog } from '../catalog'

export default {
  bar: {
    label: '主菜单',
    // File menu, after Open…
    openRecent: '打开最近使用的文件',
    noRecent: '没有最近使用的文件',
    recentNeedsDesktop: '最近使用的文件需要桌面应用',
    openSample: '打开示例字体',
    // Help menu, last item.
    github: 'GitHub 上的 MkFont',
    // Import button and its menu.
    import: '导入',
    importSvg: 'SVG 文件…',
    importFont: '字体文件中的字形 (TTF, OTF, WOFF)…',
    importMkfont: '另一个 .mkfont 中的字形…',
    // Export button and its menu.
    export: '导出',
    exportTtf: '导出 TTF',
    exportTtfHint: 'TrueType 轮廓（与 MkFont 1 相同的流程）',
    exportOtf: '导出 OTF',
    exportOtfHint: 'CFF 轮廓，保持曲线精确',
    exportWoff: '导出 WOFF',
    exportWoffHint: 'Web 字体：TrueType 轮廓，已压缩',
    exportWoff2: '导出 WOFF2',
    exportWoff2Hint: 'Web 字体：TrueType 轮廓，文件最小',
    exportOptions: '导出选项…',
    // The arrow button that opens the export menu.
    exportMenu: '导出选项'
  },
  // Submenu of the glyph and pair menus.
  copyText: {
    title: '复制为文本',
    characters: '字符',
    unicodeValues: 'Unicode 码位'
  },
  // Context menu of glyph slots (grid, inspector).
  glyph: {
    createEmpty_other: '创建 {{count, number}} 个空字形',
    importSvg: '导入 SVG…',
    copy: '复制',
    pasteSpecial: '选择性粘贴',
    pasteTransformsOnly: '仅粘贴变换',
    replaceComponents: '替换组件',
    addComponents: '添加组件',
    copyComponentTransforms: '复制组件变换',
    outlineSvg: '轮廓 SVG',
    outlineSvgHint: '最终轮廓，包含组件',
    components: '组件',
    fromDecomposition: '按分解创建',
    fromDecompositionHint: '同时创建缺失的组件字形',
    noDecomposition: '所选内容没有 Unicode 分解',
    fromDecompositionExisting: '按分解创建（仅使用已有字形）',
    addComponentsPick: '添加组件…',
    showComponents: '显示所有组件',
    hideComponents: '隐藏所有组件',
    createLigature: '创建连字',
    // "Kern A V": the two selected glyphs.
    kern: '调整 {{left}} {{right}} 的字偶距',
    reset: '重置',
    clearAll: '清除轮廓和组件',
    clearOutline: '清除轮廓，保留组件',
    rebuild: '按分解重建',
    unbind_other: '解除绑定 {{count, number}} 个文件',
    storeInSlot: '将选区存入槽位',
    slot: '槽位 {{slot}}',
    artboardTemplate: 'Illustrator 画板模板…',
    // The item reads as for one glyph while it is disabled (no existing glyph selected).
    delete_other: '删除 {{count, number}} 个字形'
  },
  // Context menu of kerning pairs (the pair views).
  pair: {
    goTo: '转到 {{glyph}}',
    applySuggested_other: '应用 {{count, number}} 个建议值',
    applySuggestedHint: '根据轮廓测得：作为起点，请用眼睛检查',
    noKerning: '无字偶距（保持为 0）',
    noKerningHint: '该字偶对已检查，无需调整：会保留，但不导出',
    // The item reads as for one pair while it is disabled (no kerned pair selected).
    remove_other: '移除 {{count, number}} 个字偶对'
  }
} satisfies Catalog<typeof en>
