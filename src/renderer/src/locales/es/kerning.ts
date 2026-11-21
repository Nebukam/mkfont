// Kerning vocabulary shared by the Browse panel, the viewport and the inspector.
import type en from '../en/kerning'
import type { Catalog } from '../catalog'

export default {
  /** Sub-lists of the common pairs (core/common-pairs.ts COMMON_GROUPS). */
  commonGroups: {
    all: { name: 'Todos los pares', tip: 'Todos los pares comunes, salvo los que llevan un espacio (tienen su propia lista)' },
    upper: { name: 'Mayúsculas', tip: 'Dos letras mayúsculas: AV, TA…' },
    mixed: { name: 'Mayúscula y minúscula', tip: 'Una letra mayúscula y una minúscula: To, Va…' },
    lower: { name: 'Minúsculas', tip: 'Dos letras minúsculas: ry, ve…' },
    punct: { name: 'Puntuación y cifras', tip: 'Un signo de puntuación, cifra o símbolo y otro carácter: T., «A, 17…' },
    space: { name: 'Con un espacio', tip: 'Un carácter junto a un espacio: su kerning cambia el espaciado entre palabras' }
  }
} satisfies Catalog<typeof en>
