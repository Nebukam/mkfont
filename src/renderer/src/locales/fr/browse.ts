// Browse panel (left sidebar): the ranges a font can be browsed by.
import type en from '../en/browse'
import type { Catalog } from '../catalog'

export default {
  title: 'Parcourir',
  groups: {
    font: 'Police',
    pairs: 'Paires de crénage',
    categories: 'Catégories',
    blocks: 'Blocs Unicode'
  },
  myGlyphs: 'Mes glyphes',
  ligatures: 'Ligatures',
  kerning: 'Crénage',
  allCharacters: 'Tous les caractères',
  detected: 'Détectées',
  commonPairs: 'Paires courantes',
  filterBlocks: 'Filtrer les blocs',
  clearFilter: 'Effacer le filtre',
  onlyUsedBlocks: 'Seulement les blocs avec des glyphes',
  noBlockMatch: 'Aucun bloc ne correspond à « {{filter}} ».'
} satisfies Catalog<typeof en>
