// Enum options in v1 order and wording. Built when shown, so they follow the language.

import type { SegmentOption, SelectOption } from '../ui/fields'
import type inspector from '../../locales/en/inspector'
import { t } from '../../i18n'

type FieldKey = keyof typeof inspector.fields

/** Readable names of editable fields (history labels), by field id. */
const FIELD_KEYS: Record<string, FieldKey> = {
  bounds: 'bounds',
  scale: 'scale',
  'scale-factor': 'scaleFactor',
  'nrm-factor': 'nrmFactor',
  valign: 'valign',
  halign: 'halign',
  anchor: 'anchor',
  xshift: 'xshift',
  xpush: 'xpush',
  'auto-w': 'autoW',
  yoffset: 'yoffset',
  mirror: 'mirror',
  'skew-rot-order': 'skewRotOrder',
  rot: 'rot',
  'rot-anchor': 'rotAnchor',
  'skew-x': 'skewX',
  'skew-y': 'skewY',
  characterRef: 'characterRef',
  contextAnchor: 'contextAnchor',
  contextBounds: 'contextBounds',
  layerAnchor: 'anchor',
  layerBounds: 'bounds',
  layerScaleFactor: 'scale',
  xOffset: 'xOffset',
  yOffset: 'yOffset',
  rotation: 'rot',
  rotationAnchor: 'rotAnchor',
  skewX: 'skewX',
  skewY: 'skewY',
  skewRotOrder: 'skewRotOrder',
  customId: 'customId',
  inverted: 'inverted',
  inheritPreviousBounds: 'inheritPreviousBounds',
  isControlLayer: 'isControlLayer',
  doExport: 'doExport',
  // Glyph properties
  width: 'width',
  height: 'height',
  export: 'export',
  flatten: 'flatten',
  flattenMode: 'flattenMode'
}

/** The translated name of a field, for history entries ("Set {{field}} of A"). */
export function fieldLabel(field: string): string {
  const key = FIELD_KEYS[field]
  return key ? t(`inspector.fields.${key}`) : field
}

export function boundsOptions(): SelectOption<number>[] {
  return [
    { value: 0, label: t('inspector.options.bounds.imported') },
    { value: 1, label: t('inspector.options.bounds.mixedVertical') },
    { value: 3, label: t('inspector.options.bounds.mixedHorizontal') },
    { value: 2, label: t('inspector.options.bounds.glyph') }
  ]
}

export function boundsTips(): string {
  return t('inspector.options.bounds.tips')
}

export function scaleOptions(): SelectOption<number>[] {
  return [
    { value: 2, label: t('inspector.options.scale.baselineAscender') },
    { value: 3, label: t('inspector.options.scale.ascenderDescender') },
    { value: 4, label: t('inspector.options.scale.baselineXHeight') },
    { value: 5, label: t('inspector.options.scale.baselineCapHeight') },
    { value: 6, label: t('inspector.options.scale.height') },
    { value: 1, label: t('inspector.options.scale.em') },
    { value: 7, label: t('inspector.options.scale.manual') },
    { value: 8, label: t('inspector.options.scale.normalize') },
    { value: 0, label: t('inspector.options.scale.none') }
  ]
}

export function valignOptions(): SelectOption<number>[] {
  return [
    { value: 0, label: t('inspector.options.valign.top') },
    { value: 1, label: t('inspector.options.valign.baseline') },
    { value: 2, label: t('inspector.options.valign.descender') },
    { value: 3, label: t('inspector.options.valign.spread') },
    { value: 4, label: t('inspector.options.valign.em') }
  ]
}

export function halignOptions(): SegmentOption<number>[] {
  return [
    { value: 0, label: t('inspector.options.halign.min'), tip: t('inspector.options.halign.minTip') },
    { value: 2, label: t('inspector.options.halign.center'), tip: t('inspector.options.halign.centerTip') },
    { value: 1, label: t('inspector.options.halign.max'), tip: t('inspector.options.halign.maxTip') }
  ]
}

export function mirrorOptions(): SegmentOption<number>[] {
  return [
    { value: 0, label: t('inspector.options.mirror.none'), tip: t('inspector.options.mirror.noneTip') },
    { value: 1, label: t('inspector.options.mirror.h'), tip: t('inspector.options.mirror.hTip') },
    { value: 2, label: t('inspector.options.mirror.v'), tip: t('inspector.options.mirror.vTip') },
    { value: 3, label: t('inspector.options.mirror.both'), tip: t('inspector.options.mirror.bothTip') }
  ]
}

export function skewOrderOptions(): SelectOption<number>[] {
  return [
    { value: 0, label: t('inspector.options.skewOrder.rxy') },
    { value: 1, label: t('inspector.options.skewOrder.ryx') },
    { value: 2, label: t('inspector.options.skewOrder.xry') },
    { value: 3, label: t('inspector.options.skewOrder.yrx') },
    { value: 4, label: t('inspector.options.skewOrder.xyr') },
    { value: 5, label: t('inspector.options.skewOrder.yxr') }
  ]
}

export function flattenOptions(): SegmentOption<number>[] {
  return [
    { value: 1, label: t('inspector.options.flatten.smart'), tip: t('inspector.options.flatten.smartTip') },
    { value: 0, label: t('inspector.options.flatten.fit'), tip: t('inspector.options.flatten.fitTip') }
  ]
}
