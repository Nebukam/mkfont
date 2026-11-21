// Built-in text of UI primitives: fields, anchor picker, dialogs frame, toasts, tooltips.
import type en from '../en/ui'
import type { Catalog } from '../catalog'

export default {
  field: {
    // The link button of a field that can follow the font's default value.
    followDefault: 'Suivre la valeur par défaut de la police',
    linkedTip: 'Suit la valeur par défaut de la police — cliquer pour la remplacer',
    overriddenTip: 'Remplacée — cliquer pour suivre la valeur par défaut de la police',
    // A select whose selected items hold different values.
    mixed: '— mixte —'
  },
  // The 3×3 anchor picker's positions.
  anchor: {
    topLeft: 'En haut à gauche',
    top: 'En haut',
    topRight: 'En haut à droite',
    left: 'À gauche',
    center: 'Au centre',
    right: 'À droite',
    bottomLeft: 'En bas à gauche',
    bottom: 'En bas',
    bottomRight: 'En bas à droite',
    // A position's tooltip after the picker's own ("Rotation pivot: Top left").
    tip: '{{tip}} : {{name}}'
  },
  dialog: {
    close: 'Fermer (Échap)'
  },
  toast: {
    dismiss: 'Fermer'
  }
} satisfies Catalog<typeof en>
