// Built-in text of UI primitives: fields, anchor picker, dialogs frame, toasts, tooltips.
import type en from '../en/ui'
import type { Catalog } from '../catalog'

export default {
  field: {
    // The link button of a field that can follow the font's default value.
    followDefault: 'Seguir el valor predeterminado de la fuente',
    linkedTip: 'Sigue el valor predeterminado de la fuente; haz clic para cambiarlo',
    overriddenTip: 'Valor propio; haz clic para seguir el valor predeterminado de la fuente',
    // A select whose selected items hold different values.
    mixed: '— mixto —'
  },
  // The 3×3 anchor picker's positions.
  anchor: {
    topLeft: 'Arriba a la izquierda',
    top: 'Arriba',
    topRight: 'Arriba a la derecha',
    left: 'Izquierda',
    center: 'Centro',
    right: 'Derecha',
    bottomLeft: 'Abajo a la izquierda',
    bottom: 'Abajo',
    bottomRight: 'Abajo a la derecha',
    // A position's tooltip after the picker's own ("Rotation pivot: Top left").
    tip: '{{tip}}: {{name}}'
  },
  dialog: {
    close: 'Cerrar (Esc)'
  },
  toast: {
    dismiss: 'Descartar'
  }
} satisfies Catalog<typeof en>
