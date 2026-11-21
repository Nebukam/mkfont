// Browse panel (left sidebar): the ranges a font can be browsed by.
import type en from '../en/browse'
import type { Catalog } from '../catalog'

export default {
  title: 'Explorar',
  groups: {
    font: 'Fuente',
    pairs: 'Pares de kerning',
    categories: 'Categorías',
    blocks: 'Bloques Unicode'
  },
  myGlyphs: 'Mis glifos',
  ligatures: 'Ligaduras',
  kerning: 'Kerning',
  allCharacters: 'Todos los caracteres',
  detected: 'Detectados',
  commonPairs: 'Pares comunes',
  filterBlocks: 'Filtrar bloques',
  clearFilter: 'Borrar filtro',
  onlyUsedBlocks: 'Solo bloques con glifos',
  noBlockMatch: 'Ningún bloque coincide con «{{filter}}».'
} satisfies Catalog<typeof en>
