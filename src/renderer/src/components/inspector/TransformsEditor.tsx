// ============================================================
// Transform settings editor — variant (single / multi) or family defaults.
// `undefined` values render as mixed; `null` values follow the family.
// ============================================================

import { useState } from 'react'
import type { ResolvedTransforms, TransformSettings } from '../../types/font'
import { ScaleMode } from '../../types/font'
import { AnchorPicker, NumberField, Row, Segmented, Select, Toggle, type NumberMeta } from '../ui/fields'
import { Disclosure, SubHeader } from '../ui/Section'
import { commonValues } from './common'
import { boundsOptions, boundsTips, halignOptions, mirrorOptions, scaleOptions, skewOrderOptions, valignOptions } from './options'
import { useTranslation } from '../../i18n'

export type TransformValues = { [K in keyof TransformSettings]?: TransformSettings[K] }

export interface TransformsEditorProps {
  values: TransformValues
  /** Family defaults; enables link toggles on inheritable fields. */
  family?: ResolvedTransforms
  onChange: (partial: Partial<TransformSettings>, meta: NumberMeta & { field: string }) => void
}

export function TransformsEditor({ values: v, family, onChange }: TransformsEditorProps): React.ReactElement {
  const { t } = useTranslation()
  const [advanced, setAdvanced] = useState(false)
  const set = <K extends keyof TransformSettings>(key: K, value: TransformSettings[K], interactive = false): void =>
    onChange({ [key]: value } as Partial<TransformSettings>, { interactive, field: key })
  const num = (key: keyof TransformSettings) => (val: number | null, meta: NumberMeta) =>
    onChange({ [key]: val } as Partial<TransformSettings>, { ...meta, field: key })
  const linkable = !!family
  const normalize = v.scale === ScaleMode.Normalize
  const resolved = <K extends keyof ResolvedTransforms>(k: K): ResolvedTransforms[K] | undefined =>
    (v[k] ?? (v[k] === null ? family?.[k] : undefined)) as ResolvedTransforms[K] | undefined
  const hasAdvanced = !!(v.rot || v['skew-x'] || v['skew-y'] || v.mirror)

  return (
    <div className="flex flex-col gap-1.5">
      <SubHeader>{t('inspector.transforms.fit')}</SubHeader>
      <Row label={t('inspector.transforms.bounds')} tip={boundsTips()}>
        <Select value={v.bounds} options={boundsOptions()} onChange={(x) => set('bounds', x)} />
      </Row>
      <Row label={t('inspector.transform.scale')}>
        <Select value={v.scale} options={scaleOptions()} onChange={(x) => set('scale', x)} />
      </Row>
      {v.scale === ScaleMode.Manual && (
        <Row label={t('inspector.transforms.factor')}>
          <NumberField value={v['scale-factor']} step={0.01} precision={4} suffix="×" onChange={num('scale-factor')} />
        </Row>
      )}
      {normalize && (
        <Row label={t('inspector.transforms.margin')} tip={t('inspector.transforms.marginTip')}>
          <NumberField value={v['nrm-factor']} step={0.01} precision={3} onChange={num('nrm-factor')} />
        </Row>
      )}

      <SubHeader>{t('inspector.transforms.position')}</SubHeader>
      <div className="flex items-start gap-2">
        {/* As tall as the alignment fields beside it: the picker is centred under its label. */}
        <div className="flex w-[76px] shrink-0 flex-col gap-1 self-stretch">
          <span className="text-xs text-muted">{t('inspector.transforms.anchor')}</span>
          <div className="flex flex-1 items-center justify-center">
            <AnchorPicker value={v.anchor} onChange={(x) => set('anchor', x)} tip={t('inspector.transforms.anchor')} />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t('inspector.transforms.vertical')}</span>
            {/* Stacked labels are not a Row: the fields need their own names. */}
            <Select value={v.valign} options={valignOptions()} onChange={(x) => set('valign', x)} ariaLabel={t('inspector.transforms.verticalAlignment')} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t('inspector.transforms.horizontal')}</span>
            <Segmented value={v.halign} options={halignOptions()} onChange={(x) => set('halign', x)} stretch ariaLabel={t('inspector.transforms.horizontalAlignment')} />
          </div>
        </div>
      </div>

      <SubHeader>{t('inspector.transforms.spacing')}</SubHeader>
      {/* Disabled fields dim themselves and let the pointer through to this tooltip. */}
      <div className="grid grid-cols-2 gap-1.5" data-tip={normalize ? t('inspector.transforms.notWithNormalize') : undefined}>
        <NumberField label={t('inspector.transforms.shift')} value={v.xshift} inherited={family?.xshift} linkable={linkable} disabled={normalize} onChange={num('xshift')} tip={t('inspector.transforms.shiftTip')} />
        <NumberField label={t('inspector.transforms.push')} value={v.xpush} inherited={family?.xpush} linkable={linkable} disabled={normalize} onChange={num('xpush')} tip={t('inspector.transforms.pushTip')} />
      </div>
      <Row label={t('inspector.transforms.autoWidth')} tip={t('inspector.transforms.autoWidthTip')}>
        <Toggle checked={v['auto-w']} disabled={normalize} onChange={(x) => set('auto-w', x)} />
      </Row>
      <Row label={t('inspector.transforms.yOffset')}>
        <NumberField value={v.yoffset} inherited={family?.yoffset} linkable={linkable} onChange={num('yoffset')} />
      </Row>

      <Disclosure open={advanced} onToggle={() => setAdvanced(!advanced)} dot={hasAdvanced} className="mt-1">
        {t('inspector.transform.mirrorRotateSkew')}
      </Disclosure>
      {advanced && (
        <div className="flex flex-col gap-1.5">
          <Row label={t('inspector.transform.mirror')}>
            <Segmented value={v.mirror} options={mirrorOptions()} onChange={(x) => set('mirror', x)} stretch />
          </Row>
          <Row label={t('inspector.transform.rotation')}>
            <NumberField value={v.rot} inherited={family?.rot} linkable={linkable} step={1} suffix="°" onChange={num('rot')} />
            <AnchorPicker size="sm" value={resolved('rot-anchor')} onChange={(x) => set('rot-anchor', x)} tip={t('inspector.transform.rotationPivot')} />
          </Row>
          <div className="grid grid-cols-2 gap-1.5">
            <NumberField label={t('inspector.transform.skewX')} value={v['skew-x']} inherited={family?.['skew-x']} linkable={linkable} suffix="°" onChange={num('skew-x')} />
            <NumberField label={t('inspector.transform.skewY')} value={v['skew-y']} inherited={family?.['skew-y']} linkable={linkable} suffix="°" onChange={num('skew-y')} />
          </div>
          <Row label={t('inspector.transform.order')}>
            <Select value={resolved('skew-rot-order')} options={skewOrderOptions()} onChange={(x) => set('skew-rot-order', x)} />
          </Row>
        </div>
      )}
    </div>
  )
}

/** Common values across several transform objects (undefined where they differ). */
export function commonTransforms(list: TransformSettings[]): TransformValues {
  return commonValues(list)
}
