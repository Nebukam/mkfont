// Edits: glyph actions, clipboard, kerning edits, external editing; toasts and history entry names.
// One glyph or pair is named ("…Glyph", "…Pair"), several are counted ("…Glyphs", "…Pairs").
import type en from '../en/edit'
import type { Catalog } from '../catalog'

export default {
  // History entry names (History panel, undo notices).
  history: {
    createGlyph: '创建 {{glyph}}',
    createGlyphs_other: '创建 {{count, number}} 个字形',
    deleteGlyph: '删除 {{glyph}}',
    deleteGlyphs_other: '删除 {{count, number}} 个字形',
    resetGlyph: '重置 {{glyph}}',
    resetGlyphs_other: '重置 {{count, number}} 个字形',
    rebuildGlyph: '重建 {{glyph}}',
    rebuildGlyphs_other: '重建 {{count, number}} 个字形',
    composeGlyph: '组合 {{glyph}}',
    composeGlyphs_other: '组合 {{count, number}} 个字形',
    addComponent: '添加组件 {{glyph}}',
    addComponents_other: '添加 {{count, number}} 个组件',
    showAllComponents: '显示所有组件',
    hideAllComponents: '隐藏所有组件',
    createLigature: '创建连字 {{chars}}',
    reloadGlyph: '从文件重新载入 {{glyph}}',
    reloadGlyphs_other: '从文件重新载入 {{count, number}} 个字形',
    pasteOntoGlyph: '粘贴到 {{glyph}}',
    pasteOntoGlyphs_other: '粘贴到 {{count, number}} 个字形',
    pasteSvgInto: '将 SVG 粘贴到 {{glyph}}',
    pasteInPlace_other: '原位粘贴 {{count, number}} 个字形',
    pasteTransforms_other: '将变换粘贴到 {{count, number}} 个字形',
    replaceComponents: '替换组件',
    pasteComponents: '粘贴组件',
    pasteComponentTransforms: '粘贴组件变换',
    addPair: '添加字偶对 {{pair}}',
    setKerningPair: '设置 {{pair}} 的字偶距',
    setKerningPairs_other: '设置 {{count, number}} 个字偶对的字偶距',
    applySuggestionPair: '为 {{pair}} 应用建议字偶距',
    applySuggestionPairs_other: '应用 {{count, number}} 个建议字偶距值',
    inheritPair: '为 {{pair}} 继承字偶距',
    inheritPairs_other: '为 {{count, number}} 个字偶对继承字偶距',
    inheritOn: '带变音符号的字母跟随其基本字母',
    inheritOff: '带变音符号的字母单独调整字偶距',
    removePair: '移除字偶对 {{pair}}',
    removePairs_other: '移除 {{count, number}} 个字偶对'
  },

  // Undo notice after an edit (actions.ts offerUndo).
  undo: {
    action: '撤销',
    fontClosed: '该字体已关闭',
    /** By kind of edit. */
    alreadyUndone: {
      delete: '删除操作已撤销',
      change: '更改已撤销',
      removal: '移除操作已撤销'
    },
    notUndone: {
      delete: '删除操作未撤销',
      change: '更改未撤销',
      removal: '移除操作未撤销'
    },
    notUndoneDetail: '此后还有其他更改。请使用“历史记录”面板返回。'
  },

  // Glyph actions (app/actions.ts).
  allSlotsHaveGlyphs: '所选槽位都已有字形',
  createMany: {
    title_other: '创建 {{count, number}} 个字形？',
    message: '一次创建这么多字形可能会使编辑器变慢。',
    confirm: '创建'
  },
  deletedGlyph: '已删除 {{glyph}}',
  deletedGlyphs_other: '已删除 {{count, number}} 个字形',
  noDecomposition: '没有可用的分解',
  noDecompositionDetail: '只有具有 Unicode 分解的字符（如 é = e + ◌́）才能自动组合。',
  alsoCreatedComponents_other: '同时创建了 {{count, number}} 个缺失的组件字形',
  alsoCreatedComponentsDetail: '它们是空的：导入或绘制它们以完成组合。',
  /** Glyph picker opened to add components (title and button). */
  addComponents: '添加组件',
  ligatureNeedsTwo: '请至少选择两个字符来构建连字',
  ligatureExists: '该连字已存在 — 已将其选中',
  copiedCharacters_other: '已复制 {{count, number}} 个字符',
  copiedUnicodeValues_other: '已复制 {{count, number}} 个 Unicode 码位',
  copiedOutline: '已将 {{glyph}} 的轮廓复制为 SVG',

  // Selection slots 0–9.
  presets: {
    stored: '已将选区存入槽位 {{slot}}',
    cleared: '已清空选区槽位 {{slot}}',
    glyphs_other: '{{count, number}} 个字形',
    empty: '选区槽位 {{slot}} 为空',
    emptyDetail: '按 Ctrl+{{slot}} 存储当前选区。'
  },

  // Illustrator artboard template.
  artboards: {
    tooMany: 'Illustrator 最多支持 {{max, number}} 个画板',
    tooManyDetail_other: '仅包含 {{count, number}} 个字形中的前 {{max, number}} 个。',
    /** Save dialog title. */
    saveTitle: '保存 Illustrator 脚本',
    saved: '已保存 Illustrator 脚本',
    savedDetail: '通过“文件 › 脚本 › 其他脚本…”运行它，为每个字形创建一个画板。'
  },

  // Bound files and external editing (app/bindings.ts).
  bindings: {
    unbound: '已解除绑定 {{fileName}}',
    unboundDetail: '该文件已被移除。',
    couldNotReloadGlyph: '无法重新载入 {{glyph}}',
    couldNotReloadGlyphs_other: '无法重新载入 {{count, number}} 个字形',
    couldNotReloadFile: '无法重新载入 {{fileName}}',
    pickEditor: {
      title: '用哪个应用编辑 SVG？',
      message: '选择你的矢量编辑器（Illustrator、Inkscape、Affinity…）。之后可以在“偏好设置”中更改。',
      choose: '选择应用…',
      systemDefault: '使用系统默认应用',
      /** File dialog title. */
      dialogTitle: '选择你的 SVG 编辑器'
    },
    needsDesktop: '外部编辑需要桌面应用',
    couldNotOpenEditor: '无法打开编辑器',
    editing: '正在外部编辑 {{glyph}}',
    editingDetail: '在编辑器中保存的更改会更新该字形。'
  },

  // Copy and paste (app/clipboard.ts).
  clipboard: {
    nothingToCopy: '没有可复制的内容',
    nothingToCopyDetail: '请先选择已有字形。',
    copiedGlyph: '已复制 {{glyph}}',
    copiedGlyphs_other: '已复制 {{count, number}} 个字形',
    selectWhere: '请选择粘贴位置',
    selectWhereDetail: '粘贴的字形会分布到选区中。',
    selectSvgTarget: '请选择要粘贴 SVG 的字形',
    nothingToPaste: '没有可粘贴的内容',
    nothingToPasteDetail: '请复制字形，或从矢量编辑器复制 SVG 代码。',
    nothingToPasteInPlaceDetail: '请先复制字形。',
    couldNotPasteSvg: '无法粘贴 SVG',
    svgNoPaths: '其中没有可用的路径。',
    inPlaceSameFont: '原位粘贴用于在字体之间复制字形',
    inPlaceSameFontDetail: '请打开另一个字体，然后原位粘贴。',
    selectTransformsTarget: '请选择要粘贴变换的已有字形',
    copyGlyphFirst: '请先复制一个字形',
    selectExisting: '请先选择已有字形',
    copyComponentsFirst: '请先复制一个带组件的字形'
  },

  // Kerning edits (app/kerning.ts).
  kerning: {
    pairExists: '该字偶对已存在 — 已将其选中',
    typeTwo: '输入两个字符以添加字偶对',
    typeTwoDetail: '或输入以空格分隔的两个字形，如“fi x”表示连字后接 x。',
    appliedSuggestions_other: '已应用 {{count, number}} 个建议字偶距值',
    removedPair: '已移除字偶对 {{pair}}',
    removedPairs_other: '已移除 {{count, number}} 个字偶对',
    copiedPairs_other: '已复制 {{count, number}} 个字偶对'
  }
} satisfies Catalog<typeof en>
