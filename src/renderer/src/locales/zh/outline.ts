// Outline editor: the floating window that edits a glyph's imported shape in place.
import type en from '../en/outline'
import type { Catalog } from '../catalog'

export default {
  // Window title, with the glyph's character or code.
  title: '轮廓：{{glyph}}',
  titleNone: '轮廓编辑器',
  // Shown when the window fails; it closes.
  failed: '轮廓编辑器遇到问题，已关闭',
  window: {
    close: '关闭',
    // Keyboard handles of the window: arrow keys move it / resize it.
    move: '移动窗口（方向键）',
    resize: '调整窗口大小（方向键）'
  },
  lock: {
    on: '停留在此字形',
    off: '重新跟随所选字形',
    // Spoken after the title while the window stays on its glyph.
    locked: '已锁定'
  },
  tools: {
    select: '选择并移动节点',
    transform: '缩放和旋转所选节点 (T)',
    smooth: '角点或平滑点 (Enter)',
    deletePoints: '删除所选节点 (Delete)',
    selectContour: '选择整条路径 (C)',
    reverseContour: '反转路径方向 (R)',
    deleteContour: '删除路径',
    snapMetrics: '吸附到字体度量线',
    snapPoints: '吸附到其他节点',
    zoomIn: '放大',
    zoomOut: '缩小',
    fit: '使字形适合视图 (F)',
    // Names of the toolbar's groups, for screen readers.
    groupMode: '工具',
    groupPoints: '节点',
    groupContours: '路径',
    groupSnap: '吸附',
    groupView: '视图'
  },
  position: {
    x: 'X',
    y: 'Y',
    xTip: '所选节点的水平位置，从字形原点算起',
    yTip: '所选节点在基线以上的高度'
  },
  // The drawing area's name, for screen readers.
  canvas: '{{glyph}} 的轮廓',
  // Bottom line of the window.
  status: {
    points: '已选择 {{selected, number}} / {{total, number}} 个节点',
    hint: '双击轮廓可添加节点，双击节点可在平滑点和角点之间切换',
    // The glyph's bounds setting places it by its outline's extent.
    refit: '此字形按其轮廓范围定位：移动最外侧的节点后，松开时整个形状会移位'
  },
  states: {
    none: '选择一个字形以编辑其轮廓。',
    missing: '{{glyph}} 尚未加入字体。',
    empty: '此字形没有轮廓。请导入 SVG，然后在此调整。',
    components: '此字形仅由组件绘制。请编辑它所使用的字形。',
    unfit: '此轮廓被缩放为零。请检查字形的缩放。'
  },
  // Under the `components` state: a tile for each glyph the glyph is drawn with.
  components: {
    // The tiles' name as a group, for screen readers.
    list: '它所使用的字形',
    // A tile: pressing it shows that glyph in the editor.
    edit: '编辑 {{glyph}}',
    missing: '编辑 {{glyph}}（尚未加入字体）'
  },
  // History entries.
  history: {
    move: '移动 {{glyph}} 的节点',
    handle: '调整 {{glyph}} 的曲线',
    insert: '为 {{glyph}} 添加节点',
    delete: '删除 {{glyph}} 的节点',
    convert: '转换 {{glyph}} 的节点',
    transform: '变换 {{glyph}} 的节点',
    reverse: '反转 {{glyph}} 的路径',
    deleteContour: '删除 {{glyph}} 的路径'
  },
  // Toast after the first edit of a glyph linked to an SVG file.
  unlinked: '已解除 {{glyph}} 与 {{fileName}} 的绑定',
  unlinkedDetail: '其轮廓已在此编辑：该文件不再替换它。'
} satisfies Catalog<typeof en>
