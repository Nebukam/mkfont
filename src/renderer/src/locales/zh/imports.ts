// Imports: SVG, font file and .mkfont import flows and dialogs; import errors.
import type en from '../en/imports'
import type { Catalog } from '../catalog'

export default {
  // Shared by the import dialogs.
  cancel: '取消',
  /** Import dialogs' confirm button. */
  importGlyphs_other: '导入 {{count, number}} 个字形',
  /** "Existing" row: what to do with glyphs the font already has. */
  existing: '已有字形',
  /** History entry, and the notice after it (font file and .mkfont imports). */
  importGlyphsFrom_other: '从 {{fileName}} 导入 {{count, number}} 个字形',
  importedGlyphsFrom_other: '已从 {{fileName}} 导入 {{count, number}} 个字形',

  // File dialog titles (app/imports.ts).
  pick: {
    svgFiles: '导入 SVG 文件',
    newFontFromSvgs: '从 SVG 文件新建字体',
    fontFile: '导入字体文件',
    mkfont: '从 .mkfont 导入字形',
    svg: '导入 SVG'
  },
  /** Dropping SVG files with no font open. */
  openFontFirst: '请先打开或新建一个字体',
  openFontFirstDetail: '然后拖放 SVG 文件以导入。',

  // SVG import: one file into a glyph, and the batch import dialog.
  svg: {
    couldNotImport: '无法导入 {{fileName}}',
    /** History entry: one file imported into a glyph. */
    intoGlyph: '将 {{fileName}} 导入到 {{glyph}}',
    fileNoPaths: '该文件没有可用的路径。',
    /** Reasons an SVG cannot be read (core/import-svg). */
    errors: {
      tooManyCopies: '此 SVG 通过 <use> 绘制的副本过多，无法导入。',
      tooMuchPathData: '此 SVG 的路径数据过多，无法导入。',
      malformed: '该 SVG 不完整或格式有误。'
    },

    // Batch import dialog.
    title: '导入 SVG 文件',
    history_other: '导入 {{count, number}} 个 SVG',
    imported_other: '已导入 {{count, number}} 个字形',
    /** Subtitle parts, joined by " · ". */
    summary: {
      files_other: '{{count, number}} 个文件',
      new_other: '{{count, number}} 个新建',
      replace_other: '{{count, number}} 个替换',
      skipped_other: '{{count, number}} 个跳过',
      unassigned_other: '{{count, number}} 个未分配',
      unusable_other: '{{count, number}} 个不可用'
    },
    assign: '分配到 Unicode',
    assignModes: {
      filename: '按文件名',
      selection: '到选区 ({{count, number}})',
      block: '到区块',
      blockConstrained: '到区块（在区块末尾停止）'
    },
    prefix: '前缀',
    prefixTip: '名称中字符部分之前的文本（例如 char_A.svg 中的 char）',
    prefixNone: '无',
    separator: '分隔符',
    separatorTip: '拆分名称各部分；各部分会连接成一个序列（f_i → fi 连字）',
    separators: {
      underscore: '_ 下划线',
      dash: '- 连字符',
      dot: '. 点',
      space: '␣ 空格',
      none: '无'
    },
    namesHint: '名称可以是字符（A、fi）、U+0041、uni0041 或十六进制值（如 00e9）。',
    selectionHint: '文件按选择顺序分配到所选槽位。',
    block: '区块',
    blockStart: '起始位置',
    blockStarts: {
      begin: '从区块开头开始',
      firstEmpty: '从第一个空槽位开始'
    },
    existingGlyphs: '已有字形',
    /** What to do with glyphs that exist (core/import-assign OverlapMode). */
    overlap: {
      overwrite: '替换路径和变换',
      overwriteEmpty: '仅替换空字形的变换',
      preserve: '替换路径，保留变换',
      ignore: '不导入'
    },
    options: '选项',
    keepLinked: '保持文件链接（保存时实时重载）',
    textLabels: 'SVG 中的文本标签转为组件',
    transforms: '导入字形的变换',
    importAll: '导入所有文件',
    /** File list column headers. */
    columns: {
      file: '文件',
      target: '目标',
      override: '覆盖'
    },
    importFile: '导入 {{fileName}}',
    noPaths: '没有可用的路径。',
    /** File details, joined by " · ". */
    size: '{{width}} × {{height}}',
    markedBox: '标记框',
    labels_other: '{{count, number}} 个标签',
    unassigned: '未分配',
    overrideFor: '覆盖 {{fileName}} 的 Unicode',
    overrideAuto: '自动',
    /** Status chips of the file rows. */
    status: {
      new: '新建',
      replace: '替换',
      skip: '跳过'
    }
  },

  // Font file import dialog (TTF, OTF, WOFF).
  font: {
    titleNew: '从字体文件新建字体',
    title: '从字体文件导入字形',
    /** First History entry of the new font. */
    imported: '已导入 {{fileName}}',
    created: '已从 {{fileName}} 创建字体',
    glyphs_other: '{{count, number}} 个字形',
    createFont_other: '创建字体（{{count, number}} 个字形）',
    unreadable: '无法读取此文件：{{error}}',
    family: '字体族',
    unitsPerEm: '每 EM 单位数',
    ascenderDescender: '上伸部 / 下伸部',
    glyphsLabel: '字形',
    /** "Glyphs" value parts, joined by ", ". */
    characters_other: '{{count, number}} 个字符',
    ligatures_other: '{{count, number}} 个连字',
    scaled: '轮廓会被缩放，使该字体的上伸部与你的一致（{{ascent}}）；侧边距转为左距和右距。',
    includeLigatures: '包含连字（来自 GSUB liga 特性）',
    keepExisting_other: '保留我的 {{count, number}} 个已有字形',
    replaceExisting_other: '替换 {{count, number}} 个已有字形'
  },

  // .mkfont import dialog (glyphs from another project).
  mkfont: {
    title: '从另一个字体项目导入字形',
    summary_other: '{{count, number}} 个字形 · EM {{em}}',
    summaryRescaled_other: '{{count, number}} 个字形 · EM {{em}}（已缩放 ×{{factor}}）',
    all: '全部',
    none: '无',
    onlyMissing: '仅此处缺少的',
    keepExisting: '保留此处已有的字形',
    replaceExisting: '替换此处已有的字形',
    withComponents: '同时导入此处缺少的组件字形',
    glyphsToImport: '要导入的字形',
    /** A glyph the open font has too: tooltip, and accessible name. */
    existsTip: '{{glyph}}（此处已有）',
    existsName: '{{name}}，此处已有'
  }
} satisfies Catalog<typeof en>
