// Unicode general categories, as the Browse panel, the view's title and the inspector
// name them.
import type en from '../en/unicode'
import type { Catalog } from '../catalog'

export default {
  categoryGroups: {
    Letter: 'Letra',
    Mark: 'Marca',
    Number: 'Número',
    Separator: 'Separador',
    Other: 'Otro',
    Punctuation: 'Puntuación',
    Symbol: 'Símbolo'
  },
  categories: {
    Lu: 'Mayúscula',
    Ll: 'Minúscula',
    Lt: 'Tipo título',
    Lm: 'Modificadora',
    Lo: 'Otra letra',
    Mn: 'Sin espaciado',
    Mc: 'Combinable con espaciado',
    Me: 'Envolvente',
    Nd: 'Dígito decimal',
    Nl: 'Número letra',
    No: 'Otro número',
    Zs: 'Espacio',
    Zl: 'Línea',
    Zp: 'Párrafo',
    Cc: 'Control',
    Cf: 'Formato',
    Cs: 'Subrogado',
    Co: 'Uso privado',
    Cn: 'Sin asignar',
    Pc: 'Conector',
    Pd: 'Guion',
    Ps: 'Apertura',
    Pe: 'Cierre',
    Pi: 'Comilla inicial',
    Pf: 'Comilla final',
    Po: 'Otra puntuación',
    Sm: 'Matemático',
    Sc: 'Moneda',
    Sk: 'Símbolo modificador',
    So: 'Otro símbolo'
  }
} satisfies Catalog<typeof en>
