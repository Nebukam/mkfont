// Kerning vocabulary shared by the Browse panel, the viewport and the inspector.
import type en from '../en/kerning'
import type { Catalog } from '../catalog'

export default {
  /** Sub-lists of the common pairs (core/common-pairs.ts COMMON_GROUPS). */
  commonGroups: {
    all: { name: 'Toutes les paires', tip: 'Toutes les paires courantes, sauf celles avec une espace (elles ont leur propre liste)' },
    upper: { name: 'Capitales', tip: 'Deux lettres capitales : AV, TA…' },
    mixed: { name: 'Casse mixte', tip: 'Une capitale et une minuscule : To, Va…' },
    lower: { name: 'Minuscules', tip: 'Deux lettres minuscules : ry, ve…' },
    punct: { name: 'Ponctuation et chiffres', tip: 'Un signe de ponctuation, un chiffre ou un symbole et un autre caractère : T., “A, 17…' },
    space: { name: 'Avec une espace', tip: 'Un caractère à côté d’une espace : les créner change l’espacement des mots' }
  }
} satisfies Catalog<typeof en>
