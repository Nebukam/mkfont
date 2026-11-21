// Built-in text of UI primitives: fields, anchor picker, dialogs frame, toasts, tooltips.
import type en from '../en/ui'
import type { Catalog } from '../catalog'

export default {
  field: {
    // The link button of a field that can follow the font's default value.
    followDefault: '跟随字体默认值',
    linkedTip: '正在跟随字体默认值 — 点击以覆盖',
    overriddenTip: '已覆盖 — 点击以跟随字体默认值',
    // A select whose selected items hold different values.
    mixed: '— 混合 —'
  },
  // The 3×3 anchor picker's positions.
  anchor: {
    topLeft: '左上',
    top: '上',
    topRight: '右上',
    left: '左',
    center: '中',
    right: '右',
    bottomLeft: '左下',
    bottom: '下',
    bottomRight: '右下',
    // A position's tooltip after the picker's own ("Rotation pivot: Top left").
    tip: '{{tip}}：{{name}}'
  },
  dialog: {
    close: '关闭 (Esc)'
  },
  toast: {
    dismiss: '关闭'
  }
} satisfies Catalog<typeof en>
