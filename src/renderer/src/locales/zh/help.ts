// Shortcuts and About dialogs; display names of keys.
import type en from '../en/help'
import type { Catalog } from '../catalog'

export default {
  // Key names in shortcuts ("Ctrl+Shift+S"), as shown; arrows show as symbols. On macOS
  // the modifiers show as symbols (⌘⇧S) and these names serve the other keys.
  // Chinese keyboards and software keep the English key names.
  keys: {
    Ctrl: 'Ctrl',
    Shift: 'Shift',
    Alt: 'Alt',
    Delete: 'Delete',
    Backspace: 'Backspace',
    Escape: 'Esc',
    Tab: 'Tab',
    Enter: 'Enter',
    // Short form, in context menus.
    Del: 'Del'
  },
  close: '关闭',
  shortcuts: {
    title: '键盘快捷键',
    // Groups after the command shortcuts: keys (right column) and what they do (left).
    extra: {
      grid: {
        title: '网格',
        click: { keys: '单击 / Ctrl+单击 / Shift+单击', does: '选择、切换选择、选择范围' },
        drag: { keys: '在空白处拖动 (+Ctrl)', does: '框选（添加到选区）' },
        arrows: { keys: '方向键 (+Shift)', does: '移动（扩展）选区' },
        cursor: { keys: 'Ctrl+方向键，然后按空格键', does: '移动但不选择，添加或移除字形' },
        menu: { keys: '菜单键 / Shift+F10', does: '打开字形菜单' },
        create: { keys: '双击空槽位', does: '创建字形' },
        zoom: { keys: 'Ctrl+滚轮', does: '调整字形单元格大小' },
        drop: { keys: '将 SVG 拖放到槽位上', does: '导入到该字形' }
      },
      slots: {
        title: '选区槽位',
        store: { keys: 'Ctrl+0…9', does: '将选区存入槽位' },
        restore: { keys: '0…9', does: '恢复槽位' },
        append: { keys: 'Shift+0…9', does: '将槽位添加到选区' }
      },
      fields: {
        title: '数值字段',
        scrub: { keys: '拖动字段或其标签', does: '拖动调整数值（Shift ×10，Alt ×0.1）' },
        step: { keys: '↑ / ↓，聚焦时滚动滚轮', does: '步进数值' },
        expression: { keys: '输入表达式', does: '例如 120*1.5 或 800-25' }
      },
      mouse: {
        title: '鼠标',
        sideButtons: { keys: '后退 / 前进侧键', does: '后退 / 前进' }
      },
      outline: {
        title: '轮廓编辑器',
        open: { keys: '双击字形 / Enter', does: '编辑其轮廓' },
        select: { keys: '单击 / Shift+单击 / 拖动', does: '选择节点、加入选择、框选' },
        move: { keys: '拖动 / 方向键 (+Shift)', does: '移动所选节点（单轴 / 每次 10）' },
        handle: { keys: '拖动手柄 (+Alt)', does: '调整曲线（断开平滑点）' },
        insert: { keys: '双击轮廓', does: '添加节点' },
        convert: { keys: '双击节点 / Enter', does: '角点或平滑点' },
        remove: { keys: 'Delete', does: '删除所选节点' },
        contour: { keys: 'C / R', does: '选择路径 / 反转其方向' },
        transform: { keys: 'T', does: '缩放和旋转所选节点' },
        snap: { keys: '拖动时按住 Ctrl', does: '不吸附' },
        view: { keys: '滚轮 / 空格+拖动 / F', does: '缩放 / 平移 / 使字形适合视图' }
      }
    }
  },
  about: {
    title: '关于 MkFont',
    name: 'MkFont {{version}}',
    tagline: 'Nebukam 出品的模块化字体编辑器',
    description:
      '用 SVG 文件和可复用的组件构建字体，然后导出 TrueType 或 OpenType 字体。文件与 MkFont 1 兼容。',
    // "Unicode data 16.0.0. Shortcuts: F1."
    data: 'Unicode 数据 {{version}}。快捷键：{{shortcut}}。',
    credits: '常用字偶对：André Fuchs 的 kerning-pairs（MIT 许可证）。'
  }
} satisfies Catalog<typeof en>
