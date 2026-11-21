// Kerning vocabulary shared by the Browse panel, the viewport and the inspector.
import type en from '../en/kerning'
import type { Catalog } from '../catalog'

export default {
  /** Sub-lists of the common pairs (core/common-pairs.ts COMMON_GROUPS). */
  commonGroups: {
    all: { name: '全部字偶对', tip: '所有常用字偶对，含空格的除外（它们有单独的列表）' },
    upper: { name: '大写', tip: '两个大写字母：AV、TA…' },
    mixed: { name: '大小写混合', tip: '一个大写字母与一个小写字母：To、Va…' },
    lower: { name: '小写', tip: '两个小写字母：ry、ve…' },
    punct: { name: '标点与数字', tip: '标点、数字或符号与另一个字符：T.、“A、17…' },
    space: { name: '含空格', tip: '字符与空格相邻：调整这些字偶距会改变词间距' }
  }
} satisfies Catalog<typeof en>
