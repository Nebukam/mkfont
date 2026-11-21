// Unicode general categories, as the Browse panel, the view's title and the inspector
// name them.
import type en from '../en/unicode'
import type { Catalog } from '../catalog'

export default {
  categoryGroups: {
    Letter: 'Lettre',
    Mark: 'Marque',
    Number: 'Nombre',
    Separator: 'Séparateur',
    Other: 'Autre',
    Punctuation: 'Ponctuation',
    Symbol: 'Symbole'
  },
  categories: {
    Lu: 'Majuscule',
    Ll: 'Minuscule',
    Lt: 'Casse de titre',
    Lm: 'Modificative',
    Lo: 'Autre lettre',
    Mn: 'À chasse nulle',
    Mc: 'Combinatoire avec chasse',
    Me: 'Englobante',
    Nd: 'Chiffre décimal',
    Nl: 'Nombre lettre',
    No: 'Autre nombre',
    Zs: 'Espace',
    Zl: 'Ligne',
    Zp: 'Paragraphe',
    Cc: 'Commande',
    Cf: 'Formatage',
    Cs: 'Seizet d’indirection',
    Co: 'Usage privé',
    Cn: 'Non attribué',
    Pc: 'Connecteur',
    Pd: 'Tiret',
    Ps: 'Ouvrante',
    Pe: 'Fermante',
    Pi: 'Guillemet initial',
    Pf: 'Guillemet final',
    Po: 'Autre ponctuation',
    Sm: 'Mathématique',
    Sc: 'Monétaire',
    Sk: 'Symbole modificateur',
    So: 'Autre symbole'
  }
} satisfies Catalog<typeof en>
