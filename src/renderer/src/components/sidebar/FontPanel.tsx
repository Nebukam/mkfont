// ============================================================
// Font settings: info, metrics (v1 Font Infos + Metrics dialogs),
// default transforms.
// ============================================================

import { BookType, FoldHorizontal, Move, Ruler } from 'lucide-react'
import { setInheritance } from '../../app/kerning'
import type { FamilyValues, ResolvedTransforms } from '../../types/font'
import { useDocStore, transact } from '../../stores/doc-store'
import { Section } from '../ui/Section'
import { NumberField, Row, Select, TextField, Toggle, type NumberMeta } from '../ui/fields'
import { TransformsEditor } from '../inspector/TransformsEditor'
import { fieldLabel } from '../inspector/options'
import { setFamilyTransforms, setFamilyValues } from '../../core/ops'
import { PanelHeader } from './PanelHeader'
import { msg, t as translate, tm, useTranslation, type MessageKey } from '../../i18n'

const WEIGHT_NAMES = ['thin', 'extraLight', 'light', 'regular', 'medium', 'semiBold', 'bold', 'extraBold', 'black'] as const

/** usWeightClass values with their names ("400 · Regular"). */
const weightOptions = (): { value: number; label: string }[] =>
  WEIGHT_NAMES.map((name, i) => ({
    value: (i + 1) * 100,
    label: translate('sidebar.font.weightOption', { value: (i + 1) * 100, name: translate(`sidebar.font.weights.${name}`) })
  }))

/** History entry names, one per field. */
const SET_LABELS: Partial<Record<keyof FamilyValues, MessageKey>> = {
  'font-family': 'sidebar.font.set.family',
  style: 'sidebar.font.set.style',
  weight: 'sidebar.font.set.weight',
  version: 'sidebar.font.set.version',
  copyright: 'sidebar.font.set.copyright',
  url: 'sidebar.font.set.url',
  description: 'sidebar.font.set.description',
  em: 'sidebar.font.set.em',
  'em-resample': 'sidebar.font.set.emResample',
  baseline: 'sidebar.font.set.baseline',
  ascent: 'sidebar.font.set.ascent',
  'asc-resample': 'sidebar.font.set.ascResample',
  descent: 'sidebar.font.set.descent',
  'cap-height': 'sidebar.font.set.capHeight',
  'x-height': 'sidebar.font.set.xHeight',
  width: 'sidebar.font.set.width',
  height: 'sidebar.font.set.height',
  monospace: 'sidebar.font.set.monospace',
  'u-position': 'sidebar.font.set.underlinePosition',
  'u-thickness': 'sidebar.font.set.underlineThickness'
}

function setValue<K extends keyof FamilyValues>(key: K, value: FamilyValues[K], meta?: NumberMeta): void {
  const label = SET_LABELS[key]
  transact(label ? tm(msg(label)) : translate('sidebar.font.set.other', { field: key }), (d) => setFamilyValues(d, { [key]: value } as Partial<FamilyValues>), {
    mergeKey: meta?.interactive ? `fam:${key}` : undefined
  })
}

export function FontPanel(): React.ReactElement {
  const { t } = useTranslation()
  const v = useDocStore((s) => s.data!.family.values)
  const tr = useDocStore((s) => s.data!.family.transforms)
  const inheritKerning = useDocStore((s) => s.data!.inheritKerning)
  const num = (key: keyof FamilyValues, opts: { min?: number } = {}) => (val: number | null, meta: NumberMeta) => {
    if (val === null) return
    setValue(key, (opts.min !== undefined ? Math.max(opts.min, val) : val) as never, meta)
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader title={t('sidebar.font.title')} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section id="font.info" title={t('sidebar.font.info')} icon={BookType}>
          <Row label={t('sidebar.font.family')}>
            <TextField value={v['font-family']} onChange={(x) => setValue('font-family', x)} />
          </Row>
          <Row label={t('sidebar.font.style')}>
            <TextField value={v.style} onChange={(x) => setValue('style', x)} placeholder={t('sidebar.font.stylePlaceholder')} />
          </Row>
          <Row label={t('sidebar.font.weight')}>
            <Select value={v.weight} options={weightOptions()} onChange={(x) => setValue('weight', x)} />
          </Row>
          <Row label={t('sidebar.font.version')}>
            <TextField value={v.version} onChange={(x) => setValue('version', x)} placeholder="1.0" />
          </Row>
          <Row label={t('sidebar.font.copyright')}>
            <TextField value={v.copyright} onChange={(x) => setValue('copyright', x)} />
          </Row>
          <Row label={t('sidebar.font.url')}>
            <TextField value={v.url} onChange={(x) => setValue('url', x)} placeholder="https://" />
          </Row>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t('sidebar.font.description')}</span>
            <TextField value={v.description} onChange={(x) => setValue('description', x)} multiline rows={2} maxLength={255} ariaLabel={t('sidebar.font.description')} />
          </div>
        </Section>

        <Section id="font.metrics" title={t('sidebar.font.metrics')} icon={Ruler} badge={t('sidebar.font.allGlyphs')}>
          <Row label={t('sidebar.font.em')} tip={t('sidebar.font.emTip')}>
            <NumberField value={v.em} min={16} step={10} onChange={num('em', { min: 16 })} />
          </Row>
          <Row label="" className="-mt-1">
            {/* The Row label is empty: the text beside the switch names it. */}
            <Toggle checked={v['em-resample']} onChange={(x) => setValue('em-resample', x)} ariaLabel={t('sidebar.font.emResample')} />
            <span className="text-xs text-muted">{t('sidebar.font.emResample')}</span>
          </Row>
          <Row label={t('sidebar.font.baseline')} tip={t('sidebar.font.baselineTip')}>
            <NumberField value={v.baseline} onChange={num('baseline')} />
          </Row>
          <Row label={t('sidebar.font.ascender')} tip={t('sidebar.font.ascenderTip')}>
            <NumberField value={v.ascent} onChange={num('ascent')} />
          </Row>
          <Row label="" className="-mt-1">
            <Toggle checked={v['asc-resample']} onChange={(x) => setValue('asc-resample', x)} ariaLabel={t('sidebar.font.ascResample')} />
            <span className="text-xs text-muted">{t('sidebar.font.ascResample')}</span>
          </Row>
          <Row label={t('sidebar.font.descender')} tip={t('sidebar.font.descenderTip')}>
            <NumberField value={v.descent} onChange={num('descent')} />
          </Row>
          <Row label={t('sidebar.font.capHeight')}>
            <NumberField value={v['cap-height']} onChange={num('cap-height')} />
          </Row>
          <Row label={t('sidebar.font.xHeight')}>
            <NumberField value={v['x-height']} onChange={num('x-height')} />
          </Row>
          <Row label={t('sidebar.font.width')} tip={t('sidebar.font.widthTip')}>
            <NumberField value={v.width} min={0} onChange={num('width', { min: 0 })} />
          </Row>
          <Row label={t('sidebar.font.height')} tip={t('sidebar.font.heightTip')}>
            <NumberField value={v.height} min={0} onChange={num('height', { min: 0 })} />
          </Row>
          <Row label={t('sidebar.font.monospace')} tip={t('sidebar.font.monospaceTip')}>
            <Toggle checked={v.monospace} onChange={(x) => setValue('monospace', x)} />
          </Row>
          <div className="grid grid-cols-2 gap-1.5">
            <NumberField label={t('sidebar.font.underline')} value={v['u-position']} nullable onChange={(x) => setValue('u-position', x)} tip={t('sidebar.font.underlineTip')} />
            <NumberField label={t('sidebar.font.thickness')} value={v['u-thickness']} nullable onChange={(x) => setValue('u-thickness', x)} tip={t('sidebar.font.thicknessTip')} />
          </div>
        </Section>

        <Section id="font.kerning" title={t('sidebar.font.kerning')} icon={FoldHorizontal}>
          <Row label="" className="-mt-1">
            {/* The Row label is empty: the text beside the switch names it. */}
            <Toggle checked={inheritKerning} onChange={setInheritance} ariaLabel={t('sidebar.font.inheritKerning')} />
            <span className="text-xs text-muted">{t('sidebar.font.inheritKerning')}</span>
          </Row>
          <p className="text-xs leading-relaxed text-subtle">{t('sidebar.font.inheritKerningHelp')}</p>
        </Section>

        <Section id="font.transforms" title={t('sidebar.font.transforms')} icon={Move} defaultOpen={false}>
          <p className="text-xs leading-relaxed text-subtle">{t('sidebar.font.transformsHelp')}</p>
          <TransformsEditor
            values={tr}
            onChange={(p, m) =>
              transact(t('sidebar.font.setDefault', { field: fieldLabel(m.field) }), (d) => setFamilyTransforms(d, p as Partial<ResolvedTransforms>), {
                mergeKey: m.interactive ? `famtr:${m.field}` : undefined
              })
            }
          />
        </Section>
      </div>
    </div>
  )
}
