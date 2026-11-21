// Unicode general categories, as the Browse panel, the view's title and the inspector
// name them.
import type en from '../en/unicode'
import type { Catalog } from '../catalog'

export default {
  categoryGroups: {
    Letter: '字母',
    Mark: '标记',
    Number: '数字',
    Separator: '分隔符',
    Other: '其他',
    Punctuation: '标点',
    Symbol: '符号'
  },
  categories: {
    Lu: '大写',
    Ll: '小写',
    Lt: '词首大写',
    Lm: '修饰字母',
    Lo: '其他字母',
    Mn: '非间距',
    Mc: '间距组合',
    Me: '包围',
    Nd: '十进制数字',
    Nl: '字母数字',
    No: '其他数字',
    Zs: '空格',
    Zl: '行',
    Zp: '段落',
    Cc: '控制',
    Cf: '格式',
    Cs: '代理',
    Co: '私用',
    Cn: '未分配',
    Pc: '连接符',
    Pd: '连接号',
    Ps: '开始',
    Pe: '结束',
    Pi: '前引号',
    Pf: '后引号',
    Po: '其他标点',
    Sm: '数学',
    Sc: '货币',
    Sk: '修饰符号',
    So: '其他符号'
  }
} satisfies Catalog<typeof en>
