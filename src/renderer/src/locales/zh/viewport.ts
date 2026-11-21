// Viewport: range titles, toolbar, progress and empty states, glyph and pair slots.
import type en from '../en/viewport'
import type { Catalog } from '../catalog'

export default {
  // The view's title and the tag beside it (rangeTitle). Block names are Unicode data; category names are in ./unicode.
  titles: {
    myGlyphs: '我的字形',
    ligatures: '连字',
    kerning: '字偶距',
    commonPairs: '常用字偶对',
    commonPairsGroup: '常用字偶对 · {{group}}',
    detected: '检测到的字偶对',
    allCharacters: '所有字符',
    category: '{{group}} · {{name}}'
  },
  tags: {
    font: '字体',
    kerning: '字偶距',
    unicode: 'Unicode',
    block: '区块',
    category: '类别 {{gc}}'
  },
  // The line under the title. Segments are joined with `separator`; <n> and <s> are styled counts.
  status: {
    separator: ' · ',
    progress_other: '<n>{{kerned, number}}</n> 个已调整 · {{zero, number}} 个为 0 · {{inherited, number}} 个已继承 · <n>{{none, number}}</n> 个待调整，共 {{count, number}} 个字偶对',
    detected_other: '<n>{{count, number}}</n> 个字偶对可能需要调整 · 根据你的轮廓测得的粗略建议',
    pairs_other: '<n>{{count, number}}</n> 个字偶对',
    withGlyphMissing_other: '{{count, number}} 个缺少字形',
    moreInherited_other: '另有 {{count, number}} 个由带变音符号的字母继承',
    glyphs_other: '<n>{{count, number}}</n> 个字形',
    glyphsOfSlots_other: '{{slots, number}} 个槽位中有 <n>{{count, number}}</n> 个字形',
    shown_other: '显示 {{count, number}} 个',
    filteredFrom_other: '筛选自 {{count, number}} 个',
    selected_other: '<s>已选 {{count, number}} 个</s>'
  },
  // Header actions and their "more actions" menus.
  actions: {
    create: '创建',
    createTip: '为所选槽位创建空字形 (Ctrl+Shift+N)',
    more: '更多操作',
    selection: '所选内容',
    selectionCount: '所选内容 ({{count, number}})',
    everythingInView: '视图中的全部内容 ({{count, number}})',
    selectAll: '全选',
    copyCharacters: '复制字符',
    copyUnicodeValues: '复制 Unicode 码位',
    artboardTemplate: 'Illustrator 画板模板…',
    createAllMissing: '创建所有缺失的字形',
    deleteAllInView: '删除视图中的所有字形',
    newPairPlaceholder: '新字偶对，例如 AV',
    newPairLabel: '新字偶对：两个字符，或以空格分隔的两个字形',
    newPairTip: '两个字符 (AV)，或以空格分隔的两个字形 (fi x)',
    addPair: '添加字偶对',
    applyAll: '全部应用',
    applyAllTip_other: '为显示的 {{count, number}} 个字偶对设置建议值（一步撤销）',
    applySuggestions: '应用建议值',
    noKerning: '无字偶距（保持为 0）',
    copyAsCharacters: '复制为字符',
    removeAllPairs: '移除视图中的所有字偶对',
    removePairValues: '移除视图中字偶对的值'
  },
  search: {
    glyphsPlaceholder: '搜索字符、名称或 U+ 码位 — 例如 a、grave、U+00E9',
    pairsPlaceholder: '搜索字偶对中的任一字形，或字偶对本身 — 例如 T、U+0054、AV',
    clear: '清除搜索',
    relatives: '相关字符',
    relativesTip: '同时显示相关字符（共享分解），即使不在此范围内',
    existingOnly: '仅已有',
    existingGlyphsTip: '仅显示字体中已有的字形',
    existingPairsTip: '仅显示两个字形都在字体中的字偶对',
    todo: '待调整',
    todoTip: '仅显示尚未调整的字偶对：没有自己的值、没有继承值，也未设为无字偶距',
    rare: '罕见字偶对',
    rareTip: '同时显示常用字偶对列表之外的字偶对，建议最明显的排在前面',
    results_other: '{{count, number}} 个结果'
  },
  // The order of the common pairs views.
  sort: {
    header: '排序',
    tip: '字偶对的排序',
    label: '排序：{{order}}',
    rank: { label: '最常用的在前', hint: '常用字偶对列表的顺序' },
    detected: { label: '检测到的在前', hint: '先列出尚未调整、轮廓给出建议值的字偶对，再列出其他字偶对' }
  },
  // The view when nothing is listed.
  empty: {
    nothing: '这里没有可显示的内容。',
    noMatch: '此范围内没有与“{{text}}”匹配的内容。',
    measuring: '正在测量你的轮廓…',
    detectedNoGlyphs: '此字体还没有字形：字偶对是根据字形轮廓测量的。',
    detectedNothingRare: '没有明显的问题：你的字体绘制的每个字偶对都已调整，或保持正常间距。',
    detectedNothing: '没有明显的问题：你的字体绘制的每个常用字偶对都已调整，或保持正常间距。',
    todoDone: '这里已无待办：每个字偶对都已调整、已继承或设为无字偶距。',
    noExistingPairs: '没有两个字形都在字体中的字偶对。',
    noExistingGlyphs: '这些字符在字体中都还不存在。',
    noGlyphs: '此字体还没有字形。',
    noLigatures: '还没有连字。',
    noPairs: '还没有字偶对。在上方输入一个字偶对，或选择两个字形后使用“调整字偶距”，或在文本预览中选择两个字符。',
    goTo: '转到 {{block}} 中的 {{chars}} {{code}}',
    searchAllCharacters: '搜索所有字符',
    searchAllCommon: '搜索所有常用字偶对',
    includeRare: '包含罕见字偶对',
    browseBlock: '浏览 {{block}}',
    importSvgs: '导入 SVG…',
    importFont: '从字体文件导入…',
    findLigatures: '在文本中查找连字…'
  },
  // The grids' accessible names.
  grid: {
    glyphs: '字形',
    pairs: '字偶对',
    commonPairs: '常用字偶对'
  },
  // A glyph cell. Its accessible name is the glyph's name and its states, joined with `separator`.
  slot: {
    separator: '，',
    notInFont: '不在字体中',
    ligature: '连字',
    empty: '空',
    outOfBounds: '超出范围',
    notExported: '未导出',
    linked: '已链接到文件',
    ligaBadge: 'LIGA',
    createEmpty: '创建空字形',
    copyUnicode: '复制 Unicode 码位'
  },
  // A pair cell. Its accessible name: "T U+0054 Latin Capital Letter T, then …: <states>".
  pair: {
    label: '{{left}}，然后是 {{right}}：{{states}}',
    separator: '，',
    kerned: '字偶距 {{value}}',
    zero: '无字偶距',
    inherited: '字偶距 {{value}}，继承自 {{pair}}',
    none: '未调整',
    suggested: '建议值 {{value}}',
    commonRank: '常用字偶对第 {{rank}} 位',
    notInFont: '{{glyph}} 不在字体中',
    replacedByLigature: '被连字 {{glyph}} 替换',
    suggestedTip: '根据轮廓建议（未应用）',
    rank: '#{{rank, number}}',
    ligaBadge: 'LIGA'
  },
  // Metric line names drawn on the glyph canvas.
  canvas: {
    ascender: '上伸部',
    capHeight: '大写',
    xHeight: 'x',
    baseline: '基线',
    descender: '下伸部'
  }
} satisfies Catalog<typeof en>
