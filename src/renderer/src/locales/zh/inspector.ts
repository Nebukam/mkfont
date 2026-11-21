// Glyph and pair inspectors: sections, fields, options, components, kerning.
import type en from '../en/inspector'
import type { Catalog } from '../catalog'

export default {
  // Shared by several parts of the inspector.
  goTo: '转到 {{glyph}}',
  more: '还有 {{n, number}} 个',
  noSvgInClipboard: '剪贴板中没有 SVG 代码',
  details: '详细信息',
  kerning: '字偶距',
  components: '组件',

  /** Field names inside history entry names ("Set {{field}} of A"), by field id (options.ts). */
  fields: {
    bounds: '边界',
    scale: '缩放',
    scaleFactor: '缩放系数',
    nrmFactor: '归一化边距',
    valign: '垂直对齐',
    halign: '水平对齐',
    anchor: '锚点',
    xshift: '左距',
    xpush: '右距',
    autoW: '自动宽度',
    yoffset: 'Y 偏移',
    mirror: '镜像',
    skewRotOrder: '变换顺序',
    rot: '旋转',
    rotAnchor: '旋转中心',
    skewX: 'X 倾斜',
    skewY: 'Y 倾斜',
    characterRef: '字形',
    contextAnchor: '上下文锚点',
    contextBounds: '上下文边界',
    xOffset: 'X 偏移',
    yOffset: 'Y 偏移',
    customId: '自定义 ID',
    inverted: '反转',
    inheritPreviousBounds: '上下文',
    isControlLayer: '控制',
    doExport: '可见性',
    width: '宽度',
    height: '高度',
    export: '导出',
    flatten: '拼合',
    flattenMode: '拼合模式'
  },

  /** History entry names. */
  history: {
    setFieldOfGlyph: '设置 {{glyph}} 的{{field}}',
    setFieldOfGlyphs_other: '设置 {{count, number}} 个字形的{{field}}',
    rename: '重命名 {{glyph}}',
    setFieldOfComponent: '设置组件 {{component}} 的{{field}}',
    setFieldOfComponents_other: '设置 {{count, number}} 个字形中 {{component}} 的{{field}}',
    addComponent: '添加组件',
    reorderComponents: '重新排序组件',
    moveComponent: '移动组件',
    // Dragged in the glyph view.
    dragComponent: '重新定位组件 {{component}}',
    scaleComponent: '缩放组件 {{component}}',
    rotateComponent: '旋转组件 {{component}}',
    removeComponent: '移除组件 {{component}}',
    removeComponents_other: '从 {{count, number}} 个字形中移除 {{component}}',
    // Not kept in the history (view state).
    toggleComponent: '展开/折叠组件',
    collapseComponents: '折叠组件',
    addPair: '添加字偶对 {{pair}}'
  },

  /** Option lists (options.ts). */
  options: {
    bounds: {
      imported: '导入边界',
      mixedVertical: '混合边界（垂直）',
      mixedHorizontal: '混合边界（水平）',
      glyph: '字形边界',
      tips: '要适配的框：\n• 导入边界 — SVG viewBox / 标记框\n• 字形边界 — 紧贴轮廓的框\n• 混合 — 一个轴向用轮廓框，另一个轴向用导入框'
    },
    scale: {
      baselineAscender: '基线到上伸部',
      ascenderDescender: '上伸部到下伸部',
      baselineXHeight: '基线到 x 字高',
      baselineCapHeight: '基线到大写字高',
      height: '高度（字体度量）',
      em: 'EM（字体度量）',
      manual: '手动',
      normalize: '归一化（适配度量）',
      none: '无'
    },
    valign: {
      top: '顶部（上伸部）',
      baseline: '基线',
      descender: '下伸部',
      spread: '垂直拉伸',
      em: 'EM'
    },
    halign: {
      min: '最小 x',
      minTip: '对齐边界的左边缘（加上左距）',
      center: '居中',
      centerTip: '在步进宽度内居中',
      max: '最大 x',
      maxTip: '对齐边界的右边缘（减去右距）'
    },
    mirror: {
      none: '无',
      noneTip: '不镜像',
      h: '水平',
      hTip: '水平镜像',
      v: '垂直',
      vTip: '垂直镜像',
      both: '双向',
      bothTip: '水平和垂直镜像'
    },
    skewOrder: {
      rxy: '旋转 → X 倾斜 → Y 倾斜',
      ryx: '旋转 → Y 倾斜 → X 倾斜',
      xry: 'X 倾斜 → 旋转 → Y 倾斜',
      yrx: 'Y 倾斜 → 旋转 → X 倾斜',
      xyr: 'X 倾斜 → Y 倾斜 → 旋转',
      yxr: 'Y 倾斜 → X 倾斜 → 旋转'
    },
    flatten: {
      smart: '智能',
      smartTip: '以字形的垂直适配作为参照',
      fit: '适配',
      fitTip: '适配合并后的轮廓'
    }
  },

  /** Field labels shared by the glyph transforms and the component fields. */
  transform: {
    scale: '缩放',
    mirrorRotateSkew: '镜像、旋转与倾斜',
    mirror: '镜像',
    rotation: '旋转',
    rotationPivot: '旋转中心',
    skewX: 'X 倾斜',
    skewY: 'Y 倾斜',
    order: '顺序'
  },

  /** Transforms section (TransformsEditor; also the font's defaults). */
  transforms: {
    title: '变换',
    fit: '适配',
    bounds: '边界',
    factor: '系数',
    margin: '边距',
    marginTip: '归一化边距（0.1 = 在适配框周围多留 10% 空间）',
    position: '位置',
    anchor: '锚点',
    vertical: '垂直',
    verticalAlignment: '垂直对齐',
    horizontal: '水平',
    horizontalAlignment: '水平对齐',
    spacing: '间距',
    notWithNormalize: '使用“归一化”缩放时不生效',
    shift: '左距',
    shiftTip: '左侧边距',
    push: '右距',
    pushTip: '右侧边距',
    autoWidth: '自动宽度',
    autoWidthTip: '步进宽度 = 适配宽度 + 左距 + 右距',
    yOffset: 'Y 偏移',
    // The notice above the fields when a control component drives the spacing.
    controlled: '间距跟随控制组件 <ref>{{glyph}}</ref>：由它的步进宽度和框架来放置组件。',
    controlledNoRef: '间距跟随控制组件字形：由它的步进宽度和框架来放置组件。',
    goToThisGlyph: '转到此字形',
    controlledOwnEmpty: '除非开启“拼合”，否则这些变换不起作用。',
    controlledOwnOutline: '这些变换只放置此字形自身的轮廓。',
    controlledSome_other:
      '这些字形中有 {{count, number}} 个的间距取自控制组件；这些变换不会改变其步进宽度。'
  },

  /** Glyph section. */
  glyph: {
    title: '字形',
    name: '名称',
    nameTip: '写入字体的 PostScript 字形名称（可选）',
    nameAuto: '自动',
    width: '宽度',
    widthAuto: '根据轮廓计算（已开启自动宽度）',
    widthTip: '步进宽度 — 保持链接以使用字体宽度',
    height: '高度',
    heightTip: '参考高度 — 保持链接以使用字体高度',
    export: '导出',
    exportTip: '包含在导出的字体中',
    flatten: '拼合',
    flattenTip: '将合并后的轮廓（字形 + 组件）作为整体适配',
    flattenMode: '拼合模式'
  },

  /** The frame of the component selected in the glyph view (ComponentFrame). */
  frame: {
    label: '组件 {{component}}',
    description: '拖动组件可移动（按住 Shift 仅沿一个轴），拖动角点可缩放，拖动旋钮可旋转。方向键移动 1 个单位，按住 Shift 移动 10 个单位。按 Esc 取消选择。',
    scaleTip: '以组件锚点为基准缩放（按住 Alt 以对角为基准）',
    rotateTip: '绕旋转中心旋转（按住 Shift 以 15° 为步长）'
  },

  /** Glyph view and identity at the top of the inspector (GlyphHeader). */
  header: {
    zoomOut: '缩小',
    zoomIn: '放大',
    resizeView: '调整字形视图大小',
    pixels: '{{value}} 像素',
    copyCharacter: '复制字符',
    copyCharacterName: '复制字符 {{glyph}}',
    ligature: '连字',
    // A character's general category in the header: its name and the standard's code.
    category: '{{name}} ({{gc}})',
    unknownCharacter: '未知字符',
    copyUnicode: '复制 Unicode 码位',
    copyCode: '复制 {{code}}',
    notInFont: '不在字体中',
    live: '实时：{{file}}',
    unbind: '解除绑定',
    importSvg: '将 SVG 导入此字形',
    pasteSvg: '从剪贴板粘贴 SVG 代码',
    copyGlyph: '复制字形 (Ctrl+C)',
    externalEditor: '在外部编辑器中编辑（实时重载）',
    moreActions: '更多操作'
  },

  /** A selected slot with no glyph yet. */
  emptySlot: {
    createEmpty: '创建空字形',
    createFromComponents: '用组件创建',
    createFromComponentsTip: '按 Unicode 分解用组件创建字形（同时创建缺失的部件）',
    importSvg: '导入 SVG…',
    pasteSvg: '粘贴 SVG',
    noSvgHint: '请先从矢量编辑器中复制路径。',
    dropTip: '提示：将 SVG 文件拖放到任意槽位即可导入到该处。'
  },

  /** Several glyphs selected. */
  multi: {
    selected: '已选 {{count, number}} 个',
    existing: '{{n, number}} 个已有',
    existingAndEmpty_other: '{{n, number}} 个已有 · {{count, number}} 个空槽位',
    create: '创建 {{n, number}} 个',
    ligature: '连字',
    ligatureTip: '创建连字“{{chars}}”（按选择顺序）',
    kernPair: '调整字偶距',
    kernPairTip: '调整“{{chars}}”的字偶距（按选择顺序）',
    compose: '组合',
    composeTip: '按 Unicode 分解创建组件',
    reset: '重置',
    clearAll: '清除轮廓和组件',
    clearKeepComponents: '清除轮廓，保留组件',
    rebuild: '按分解重建',
    delete: '删除',
    createFirst: '先创建所选字形，才能一起编辑它们的属性。'
  },

  /** Nothing selected. */
  placeholder: {
    title: '选择一个或多个字形，在此处编辑。',
    multiSelect: '<k>Ctrl</k> / <k>Shift</k> + 单击可多选',
    storeSelection: '<k>Ctrl</k>+<k>0-9</k> 存储选区，<k>0-9</k> 恢复选区',
    dropSvg: '将 SVG 文件拖放到槽位上即可导入',
    palette: '<k>Ctrl</k>+<k>P</k> 打开命令面板'
  },

  /** Details section. */
  detailsSection: {
    notListed: '{{code}} 未列出',
    notListedHint: '它不在字体中，并且没有视图会列出未分配字符或控制字符。',
    advance: '步进宽度',
    exported: '已导出',
    exportedYes: '是',
    exportedSkipped: '已跳过（超出范围）',
    outlineWidth: '轮廓宽度',
    outlineHeight: '轮廓高度',
    leftBearing: '左侧边距',
    rightBearing: '右侧边距',
    usedAsComponent: '用作组件 ×{{n, number}}',
    selectAll: '全选',
    decomposition: '分解 ({{n, number}})',
    decompositionTagged: '分解 · {{tag}} ({{n, number}})',
    relatives: '相关字符 ({{n, number}})'
  },

  /** Components section, single glyph and multi-selection. */
  componentsSection: {
    empty: '（空）',
    replace: '替换组件',
    add: '添加组件',
    copyTransforms: '复制组件变换',
    copyTransformsHint: '将复制的设置应用到使用相同字形的组件',
    pasteTip: '粘贴所复制字形中的组件',
    addEmpty: '添加空组件',
    searchAdd: '搜索并添加组件',
    decompose: '按 Unicode 分解创建组件',
    noDecomposition: '此字符没有分解',
    showAll: '全部显示',
    hideAll: '全部隐藏',
    collapseAll: '全部折叠',
    visibilityFolding: '可见性与折叠',
    none: '组件会将其他字形放入此字形中（变音符号、连字部件…）。点击 + 添加，或按 Unicode 分解构建组件。',
    move: '移动 {{component}}',
    moveDescription: '拖动，或使用上下方向键',
    moveTip: '拖动以重新排序（或聚焦后使用 ↑ ↓）',
    expand: '展开 {{component}}',
    control: '控制',
    controlTip: '控制组件：决定宽度和上下文',
    controlInactive: '控制（未生效）',
    controlInactiveTip: '已标记为控制组件，但其字形缺失或存在循环引用',
    circular: '循环',
    circularTip: '此字形引用了宿主字形：该组件被忽略',
    missing: '缺失',
    missingTip: '此字符尚无字形',
    inverted: '反转',
    hide: '隐藏组件',
    show: '显示组件',
    moveUp: '上移',
    moveDown: '下移',
    remove: '移除组件',
    // Multi-selection
    addToAll: '为每个所选字形添加组件',
    decomposeAll: '按分解创建组件',
    showAllComponents: '显示所有组件',
    hideAllComponents: '隐藏所有组件',
    noneInSelection: '所选字形都没有组件。',
    inGlyphs_other: '位于 {{count, number}} 个字形中的 {{n, number}} 个',
    toggleVisibility: '切换可见性',
    removeFromAll: '从所有所选字形中移除'
  },

  /** Component fields (LayerFields). */
  layer: {
    glyph: '字形',
    glyphTip: '用作此组件的字形的字符、连字或 U+XXXX',
    glyphPlaceholder: '例如 A、U+0301',
    pickGlyph: '选取字形',
    pickTitle: '选择组件字形',
    context: '上下文',
    contextTip: '组件附着在宿主字形中的位置',
    contextAnchor: '上下文锚点',
    contextBounds: '宿主边界的测量方式',
    component: '组件',
    componentTip: '组件上用于附着的点',
    componentAnchor: '组件锚点',
    componentBounds: '组件边界的测量方式',
    xOffset: '水平偏移',
    yOffset: '垂直偏移',
    special: '特殊',
    customId: '自定义 ID',
    customIdTip: '各字形中组件共用的名称，用于批量编辑和搜索',
    customIdNone: '无',
    invert: '反转（反向绕排以挖空）',
    previousContext: '使用上一个组件作为上下文',
    control: '控制组件（决定宽度和上下文）',
    controlTip: '宿主字形采用此组件的步进宽度，其他组件附着于它'
  },

  /** Kerning section of the glyph inspector. */
  kerningSection: {
    showPairs: '在“字偶距”视图中显示这些字偶对',
    asLeft: '{{glyph}} + …',
    asRight: '… + {{glyph}}',
    inheritedFrom: '继承自 {{glyph}} ({{n, number}})',
    none: '还没有包含 {{glyph}} 的字偶对。',
    suggested: '根据轮廓建议 ({{n, number}})',
    applySuggestedTip: '为这些字偶对设置根据轮廓测得的值（一步撤销）',
    applyIt: '应用',
    applyAll: '全部应用 ({{n, number}})',
    showInDetected: '在“检测到的字偶对”中显示',
    showPairInDetected: '在“检测到的字偶对”中显示 {{pair}}',
    notInFont: '{{glyph}} 不在字体中',
    replacedByLigature: '被连字 {{glyph}} 替换',
    showInKerning: '在“字偶距”视图中显示',
    showPairInKerning: '在“字偶距”视图中显示 {{pair}}',
    alsoApplies: '也适用于 {{pairs}}（带变音符号的字母跟随其基本字母）',
    alsoAppliesCount_other: '也适用于 {{count, number}} 个带变音符号的字偶对',
    kerningOf: '{{pair}} 的字偶距',
    followsBase: '{{pair}} 跟随其基本字母的字偶对',
    remove: '移除 {{pair}}',
    giveMeasured: '为 {{pair}} 设置根据轮廓测得的值',
    applyTo: '将 {{value}} 应用到 {{pair}}',
    apply: '应用',
    typeOther: '输入另一个字形',
    typeOtherHint: '一个字符、一个 U+ 码位，或像 fi 这样的连字。',
    alreadyPair: '{{pair}} 已是字偶对',
    side: '{{glyph}} 在新字偶对中的位置',
    first: '{{glyph}} +',
    firstTip: '{{glyph}} 在前',
    second: '+ {{glyph}}',
    secondTip: '{{glyph}} 在后',
    otherPlaceholder: '另一个字形，例如 A',
    glyphAfter: '{{glyph}} 之后的字形',
    glyphBefore: '{{glyph}} 之前的字形',
    addPair: '添加字偶对'
  },

  /** Inspector of the pair views (PairInspector). */
  pair: {
    tighten_other: '收紧 {{count, number}} 个单位',
    loosen_other: '放宽 {{count, number}} 个单位',
    state: {
      kerned: '已调整',
      zero: '无字偶距',
      inherited: '已继承',
      none: '未调整'
    },
    // "Exported" in the Details section.
    exportedYes: '是',
    exportedNotKerned: '否：未调整',
    exportedNotInFont: '否：{{glyph}} 不在字体中',
    exportedNotInFontBoth: '否：{{first}} 和 {{second}} 不在字体中',
    exportedNotExported: '否：{{glyph}} 未导出',
    exportedNotExportedBoth: '否：{{first}} 和 {{second}} 未导出',
    exportedZero: '否：无需调整',
    exportedInherited: '是，继承自 {{pair}}',
    // Under the value field.
    follows: '跟随 {{pair}}：{{base}} 是 {{accented}} 的基本字母。输入一个值，可为此字偶对单独设置。',
    ownValue: '使用自己的值；{{pair}} 会给出 {{value}}。',
    follow: '跟随 {{pair}}',
    measured: '尚未调整。根据轮廓测量，约 {{value}} 可使间距均匀：请用眼睛检查。',
    notKernedYet: '尚未调整：输入一个值即可将此字偶对加入字体。',
    title: '字偶对 {{pair}}',
    rank: '常用字偶对第 {{n, number}} 位',
    rankTip: '它在常用字偶对列表中的排名（1 为最相关）',
    missing: '{{glyph}} 不在字体中。该字偶对会保留，并在字形存在后导出。',
    missingBoth: '{{first}} 和 {{second}} 不在字体中。该字偶对会保留，并在它们存在后导出。',
    createIt: '创建它',
    createThem: '创建它们',
    ligature:
      '开启连字时永远不会生效：连字 {{ligature}} 会替换 {{left}} 后接 {{right}}。请改为调整该连字与相邻字形的字偶距。',
    goToLigature: '转到该连字',
    value: '值',
    valueTip: '加到两个字形之间的间距上，以字体单位计：负值使它们靠近',
    units: '单位',
    applyTip: '为该字偶对设置根据轮廓测得的值',
    apply: '应用 {{value}}',
    noKerning: '无字偶距',
    noKerningTip: '保持为 0：已检查，无需调整（不导出）',
    remove: '移除',
    removeTip: '移除它自己的值：重新跟随 {{pair}}',
    exported: '已导出',
    advanceOf: '{{glyph}} 的步进宽度',
    rankLabel: '常用字偶对排名',
    rankValue: '第 {{n, number}} 位，共 {{total, number}} 位',
    notListed: '未列出',
    measuredLabel: '根据轮廓测得',
    // Several pairs selected.
    selected_other: '已选 {{count, number}} 个字偶对',
    notKerned: '{{n, number}} 个未调整',
    valueAllTip: '将所有所选字偶对设为此值',
    applySuggestedTip: '为尚未调整的字偶对设置根据其轮廓测得的值',
    applySuggested: '应用 {{n, number}} 个建议值',
    noKerningAllTip: '保持为 0：已检查，无需调整（不导出）',
    inherit: '继承 {{n, number}} 个',
    inheritTip: '去掉它们自己的值：重新跟随其基本字母的字偶对',
    removeCount: '移除 {{n, number}} 个',
    // Nothing selected.
    placeholder: '选择一个字偶对以编辑其字偶距。',
    typePair: '在“字偶距”视图中输入字偶对 (AV)',
    selectTwo: '选择两个字形，然后点击“调整字偶距”',
    selectInPreview: '在文本预览中选择两个字符',
    doubleClick: '双击字偶对以输入其值'
  }
} satisfies Catalog<typeof en>
