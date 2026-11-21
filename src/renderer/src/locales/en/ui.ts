// Built-in text of UI primitives: fields, anchor picker, dialogs frame, toasts, tooltips.
export default {
  field: {
    // The link button of a field that can follow the font's default value.
    followDefault: 'Follow the font default',
    linkedTip: 'Following the font default — click to override',
    overriddenTip: 'Overridden — click to follow the font default',
    // A select whose selected items hold different values.
    mixed: '— mixed —'
  },
  // The 3×3 anchor picker's positions.
  anchor: {
    topLeft: 'Top left',
    top: 'Top',
    topRight: 'Top right',
    left: 'Left',
    center: 'Center',
    right: 'Right',
    bottomLeft: 'Bottom left',
    bottom: 'Bottom',
    bottomRight: 'Bottom right',
    // A position's tooltip after the picker's own ("Rotation pivot: Top left").
    tip: '{{tip}}: {{name}}'
  },
  dialog: {
    close: 'Close (Esc)'
  },
  toast: {
    dismiss: 'Dismiss'
  }
} as const
