// ============================================================
// Component (layer) property editor. `undefined` = mixed values.
// ============================================================

import { useState } from 'react'
import { Search } from 'lucide-react'
import type { Layer } from '../../types/font'
import { AnchorPicker, Checkbox, NumberField, Row, Segmented, Select, TextField, type NumberMeta } from '../ui/fields'
import { IconButton } from '../ui/Button'
import { boundsOptions, mirrorOptions, skewOrderOptions } from './options'
import { Disclosure } from '../ui/Section'
import { commonValues } from './common'
import { pickGlyphs } from '../../app/dialogs'
import { keyToChars } from '../../core/unicode-keys'
import { useTranslation } from '../../i18n'

export type LayerValues = { [K in keyof Layer]?: Layer[K] }

export function LayerFields({
  values: v,
  onChange,
  showReference = true
}: {
  values: LayerValues
  onChange: (values: Partial<Layer>, meta: NumberMeta & { field: string }) => void
  showReference?: boolean
}): React.ReactElement {
  const { t } = useTranslation()
  const [advanced, setAdvanced] = useState(false)
  const [special, setSpecial] = useState(false)
  const set = <K extends keyof Layer>(k: K, value: Layer[K], interactive = false): void =>
    onChange({ [k]: value } as Partial<Layer>, { interactive, field: k })
  const num = (k: keyof Layer) => (val: number | null, meta: NumberMeta) =>
    onChange({ [k]: val ?? 0 } as Partial<Layer>, { ...meta, field: k })

  return (
    <div className="flex flex-col gap-1.5 pt-1">
      {showReference && (
        <Row label={t('inspector.layer.glyph')} tip={t('inspector.layer.glyphTip')}>
          <TextField value={v.characterRef} onChange={(x) => set('characterRef', x)} placeholder={t('inspector.layer.glyphPlaceholder')} />
          <IconButton
            icon={Search}
            tip={t('inspector.layer.pickGlyph')}
            variant="default"
            onClick={async () => {
              const picked = await pickGlyphs({ title: t('inspector.layer.pickTitle') })
              if (picked?.[0]) set('characterRef', keyToChars(picked[0]))
            }}
          />
        </Row>
      )}

      <div className="grid grid-cols-[76px_1fr] items-start gap-x-2 gap-y-1.5">
        <span className="pt-1 text-xs text-muted" data-tip={t('inspector.layer.contextTip')}>
          {t('inspector.layer.context')}
        </span>
        <div className="flex items-center gap-1.5">
          <AnchorPicker size="sm" value={v.contextAnchor} onChange={(x) => set('contextAnchor', x)} tip={t('inspector.layer.contextAnchor')} />
          <Select value={v.contextBounds} options={boundsOptions()} onChange={(x) => set('contextBounds', x)} tip={t('inspector.layer.contextBounds')} />
        </div>
        <span className="pt-1 text-xs text-muted" data-tip={t('inspector.layer.componentTip')}>
          {t('inspector.layer.component')}
        </span>
        <div className="flex items-center gap-1.5">
          <AnchorPicker size="sm" value={v.layerAnchor} onChange={(x) => set('layerAnchor', x)} tip={t('inspector.layer.componentAnchor')} />
          <Select value={v.layerBounds} options={boundsOptions()} onChange={(x) => set('layerBounds', x)} tip={t('inspector.layer.componentBounds')} />
        </div>
      </div>

      <Row label={t('inspector.transform.scale')}>
        <NumberField value={v.layerScaleFactor} step={0.01} precision={4} suffix="×" onChange={num('layerScaleFactor')} />
      </Row>
      <div className="grid grid-cols-2 gap-1.5">
        <NumberField label="X" value={v.xOffset} onChange={num('xOffset')} tip={t('inspector.layer.xOffset')} />
        <NumberField label="Y" value={v.yOffset} onChange={num('yOffset')} tip={t('inspector.layer.yOffset')} />
      </div>

      <Disclosure open={advanced} onToggle={() => setAdvanced(!advanced)} dot={!!(v.rotation || v.skewX || v.skewY || v.mirror)}>
        {t('inspector.transform.mirrorRotateSkew')}
      </Disclosure>
      {advanced && (
        <div className="flex flex-col gap-1.5">
          <Row label={t('inspector.transform.mirror')}>
            <Segmented value={v.mirror} options={mirrorOptions()} onChange={(x) => set('mirror', x)} stretch />
          </Row>
          <Row label={t('inspector.transform.rotation')}>
            <NumberField value={v.rotation} suffix="°" onChange={num('rotation')} />
            <AnchorPicker size="sm" value={v.rotationAnchor} onChange={(x) => set('rotationAnchor', x)} tip={t('inspector.transform.rotationPivot')} />
          </Row>
          <div className="grid grid-cols-2 gap-1.5">
            <NumberField label={t('inspector.transform.skewX')} value={v.skewX} suffix="°" onChange={num('skewX')} />
            <NumberField label={t('inspector.transform.skewY')} value={v.skewY} suffix="°" onChange={num('skewY')} />
          </div>
          <Row label={t('inspector.transform.order')}>
            <Select value={v.skewRotOrder} options={skewOrderOptions()} onChange={(x) => set('skewRotOrder', x)} />
          </Row>
        </div>
      )}

      <Disclosure open={special} onToggle={() => setSpecial(!special)} dot={!!(v.customId || v.inverted || v.inheritPreviousBounds || v.isControlLayer)}>
        {t('inspector.layer.special')}
      </Disclosure>
      {special && (
        <div className="flex flex-col gap-1.5">
          <Row label={t('inspector.layer.customId')} tip={t('inspector.layer.customIdTip')}>
            <TextField value={v.customId === undefined ? undefined : v.customId ?? ''} onChange={(x) => set('customId', x.trim() || null)} placeholder={t('inspector.layer.customIdNone')} />
          </Row>
          <Checkbox checked={v.inverted} onChange={(x) => set('inverted', x)} label={t('inspector.layer.invert')} />
          <Checkbox checked={v.inheritPreviousBounds} onChange={(x) => set('inheritPreviousBounds', x)} label={t('inspector.layer.previousContext')} />
          <Checkbox
            checked={v.isControlLayer}
            onChange={(x) => set('isControlLayer', x)}
            label={t('inspector.layer.control')}
            tip={t('inspector.layer.controlTip')}
          />
        </div>
      )}
    </div>
  )
}

/** Values shared by several layers (undefined where they differ). */
export function commonLayerValues(layers: Layer[]): LayerValues {
  return commonValues(layers, ['path'])
}
