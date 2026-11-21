// Documents: new, open, save, export, autosave, close; their toasts, confirmations and errors.
import type en from '../en/document'
import type { Catalog } from '../catalog'

export default {
  /** A new font's file name, in its tab and the save dialog. */
  untitled: '未命名',
  untitledFile: '未命名.mkfont',
  untitledFileNumbered: '未命名 {{n}}.mkfont',
  /** Suggested save / export file name (before the extension) of an untitled font with no family name. */
  fallbackFileName: '字体',
  /** A new font's family name (Font panel; written into the exported font unless changed). */
  untitledFamily: '未命名',

  // First History entry of a document.
  history: {
    newFont: '新建字体',
    opened: '已打开',
    openedFile: '已打开 {{fileName}}'
  },

  // Closing a document with unsaved changes.
  unsaved: {
    title: '是否保存对“{{fileName}}”的更改？',
    message: '如果不保存，你的更改将会丢失。',
    save: '保存',
    dontSave: '不保存',
    cancel: '取消'
  },

  // Opening.
  /** File dialog title. */
  openTitle: '打开字体项目',
  opened: '已打开 {{fileName}}',
  openedDetail_other: '{{count, number}} 个字形，用时 {{seconds}} 秒',
  couldNotOpen: '无法打开 {{fileName}}',
  couldNotLoadSample: '无法加载示例字体',
  /** Reasons a .mkfont file cannot be read (core/deserialize); `reason` is the parser's own text. */
  parse: {
    invalid: '不是有效的 .mkfont 文件 ({{reason}})',
    missingData: '不是有效的 .mkfont 文件（缺少字体数据）'
  },

  // Saving.
  /** File dialog title. */
  saveTitle: '保存字体项目',
  saveFailed: '保存失败',
  saved: '已保存 {{fileName}}',
  savedReplacedTab: '显示被替换文件的标签页已关闭。',
  openInOtherTab: '{{fileName}} 已在另一个标签页中打开',
  openInOtherTabDetail: '它有未保存的更改。请先保存或关闭该标签页。',
  autosaved: '已自动保存',

  // Exporting.
  export: {
    /** File dialog title; `format` is OTF or TTF. */
    title: '导出 {{format}}',
    failed: '导出失败',
    exported: '已导出 {{fileName}}',
    exportedWithWarnings_other: '已导出 {{fileName}}，有 {{count, number}} 条警告',
    showInFolder: '在文件夹中显示',
    /** Notice details, joined by ", ". */
    glyphs_other: '{{count, number}} 个字形',
    ligatures_other: '{{count, number}} 个连字',
    kerningPairs_other: '{{count, number}} 个字偶对',
    /** Errors and warnings from core/export-font. */
    noGlyphs: '没有可导出的字形。',
    notSfnt: '不是 TrueType 或 OpenType 字体。',
    noBrotli: '此浏览器无法写入 WOFF2（没有 Brotli 压缩）。请使用桌面应用。',
    /** Batch export: the prompt before files are replaced, and the notice. {{files}}: names joined by ", ". */
    batch: {
      replaceTitle_other: '替换 {{count, number}} 个现有文件？',
      replaceMessage_other: '此文件夹中已有这些文件：{{files}}。',
      replace: '替换',
      exported_other: '已将 {{count, number}} 个文件导出到 {{folder}}',
      downloaded_other: '已导出 {{count, number}} 个文件'
    },
    warnings: {
      outOfBounds: '已跳过 {{glyph}}：轮廓超出范围',
      ligatureMissing: '连字“{{chars}}”不会生效：缺少 {{missing}}',
      kerningSkipped_other: '已跳过 {{count, number}} 个字偶对：缺少字形或字形未导出'
    }
  }
} satisfies Catalog<typeof en>
