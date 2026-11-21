// Browse panel (left sidebar): the ranges a font can be browsed by.
import type en from '../en/browse'
import type { Catalog } from '../catalog'

export default {
  title: '浏览',
  groups: {
    font: '字体',
    pairs: '字偶对',
    categories: '类别',
    blocks: 'Unicode 区块'
  },
  myGlyphs: '我的字形',
  ligatures: '连字',
  kerning: '字偶距',
  allCharacters: '所有字符',
  detected: '检测到的',
  commonPairs: '常用字偶对',
  filterBlocks: '筛选区块',
  clearFilter: '清除筛选',
  onlyUsedBlocks: '仅显示含字形的区块',
  noBlockMatch: '没有与“{{filter}}”匹配的区块。'
} satisfies Catalog<typeof en>
