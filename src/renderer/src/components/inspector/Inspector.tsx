// ============================================================
// Inspector — single glyph, multi-selection, empty slot, placeholder.
// ============================================================

import { useMemo } from 'react'
import { ClipboardPaste, Download, FoldHorizontal, Info, Ligature, Move, Plus, RotateCcw, SlidersHorizontal, Trash2, Wand2, Type } from 'lucide-react'
import type { TransformSettings, Variant } from '../../types/font'
import { ScaleMode } from '../../types/font'
import { useDocStore, transact } from '../../stores/doc-store'
import { useSelectionStore } from '../../stores/selection-store'
import { isPairRange, useUIStore } from '../../stores/ui-store'
import { PairInspector } from './PairInspector'
import { KerningSection } from './KerningSection'
import { addPair } from '../../app/kerning'
import { Section } from '../ui/Section'
import { Button } from '../ui/Button'
import { DropdownMenu } from '../ui/Menu'
import { NumberField, Row, Segmented, TextField, Toggle, type NumberMeta } from '../ui/fields'
import { TransformsEditor, commonTransforms } from './TransformsEditor'
import { commonValue } from './common'
import { ComponentsSection, MultiComponentsSection } from './ComponentsSection'
import { DetailsSection } from './DetailsSection'
import { GlyphActions, GlyphIdentity, GlyphPreview } from './GlyphHeader'
import { GlyphThumb } from '../common/GlyphThumb'
import { focusFallback } from '../ui/focus'
import { flattenOptions, fieldLabel } from './options'
import { renameGlyph, setTransforms, setVariantValues } from '../../core/ops'
import { isEmptyPathContent } from '../../core/model'
import { getComposition, glyphSpokenName } from '../../core/unicode'
import { glyphLabel, glyphsValues, keyToDisplayChars } from '../../core/unicode-keys'
import { bootstrapKeys, createLigature, createMissing, deleteKeys, resetKeys } from '../../app/actions'
import { pasteSvgInto } from '../../app/clipboard'
import { pickSvgForGlyph } from '../../app/imports'
import { readClipboardText } from '../../platform'
import { goToGlyph } from './DetailsSection'
import { toast } from '../ui/Overlays'
import { t, Trans, useTranslation } from '../../i18n'

export function Inspector(): React.ReactElement {
  const keys = useSelectionStore((s) => s.keys)
  const glyphs = useDocStore((s) => s.data!.glyphs)
  // The pair views select pairs: the inspector edits those.
  const pairView = useUIStore((s) => isPairRange(s.range))

  let body: React.ReactElement
  if (pairView) body = <PairInspector />
  else if (keys.length === 0) body = <Placeholder />
  else if (keys.length === 1) body = glyphs.has(keys[0]) ? <SingleInspector unicode={keys[0]} /> : <EmptySlotInspector unicode={keys[0]} />
  else body = <MultiInspector keys={keys} />

  return <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden">{body}</div>
}

// ---- Shared editing helpers ----

/** "Set scale of A", "Set scale of 3 glyphs". */
function setFieldLabel(keys: string[], field: string): string {
  const values = { ...glyphsValues(keys), field: fieldLabel(field) }
  return keys.length === 1 ? t('inspector.history.setFieldOfGlyph', values) : t('inspector.history.setFieldOfGlyphs', values)
}

function editTransforms(keys: string[], partial: Partial<TransformSettings>, meta: NumberMeta & { field: string }): void {
  transact(setFieldLabel(keys, meta.field), (d) => setTransforms(d, keys, partial), { mergeKey: meta.interactive ? `tr:${keys.join(',')}:${meta.field}` : undefined })
}

function editVariant(keys: string[], partial: Partial<Variant>, field: string, interactive = false): void {
  transact(setFieldLabel(keys, field), (d) => setVariantValues(d, keys, partial), { mergeKey: interactive ? `v:${keys.join(',')}:${field}` : undefined })
}

const common = commonValue

function GlyphProperties({ keys }: { keys: string[] }): React.ReactElement | null {
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const family = useDocStore((s) => s.data!.family)
  const variants = useMemo(() => keys.map((k) => glyphs.get(k)?.variants[0]).filter((v): v is Variant => !!v), [keys, glyphs])
  const { t } = useTranslation()
  if (!variants.length) return null
  const single = keys.length === 1 ? glyphs.get(keys[0]) : null
  const width = common(variants.map((v) => v.width))
  const height = common(variants.map((v) => v.height))
  const autoW = common(variants.map((v) => v.transforms['auto-w']))
  const normalize = common(variants.map((v) => v.transforms.scale)) === ScaleMode.Normalize
  const anyLayers = variants.some((v) => v.layers.length > 0)

  return (
    <Section id="inspector.glyph" title={t('inspector.glyph.title')} icon={Type}>
      {single && (
        <Row label={t('inspector.glyph.name')} tip={t('inspector.glyph.nameTip')}>
          <TextField
            value={single.name}
            placeholder={t('inspector.glyph.nameAuto')}
            onChange={(v) => transact(t('inspector.history.rename', { glyph: keyToDisplayChars(single.unicode) }), (d) => renameGlyph(d, single.unicode, v))}
          />
        </Row>
      )}
      <Row label={t('inspector.glyph.width')} tip={autoW && !normalize ? t('inspector.glyph.widthAuto') : t('inspector.glyph.widthTip')}>
        <NumberField
          value={width}
          inherited={family.values.width}
          linkable
          disabled={autoW === true && !normalize}
          onChange={(v, m) => editVariant(keys, { width: v }, 'width', m.interactive)}
        />
      </Row>
      <Row label={t('inspector.glyph.height')} tip={t('inspector.glyph.heightTip')}>
        <NumberField value={height} inherited={family.values.height} linkable onChange={(v, m) => editVariant(keys, { height: v }, 'height', m.interactive)} />
      </Row>
      <Row label={t('inspector.glyph.export')} tip={t('inspector.glyph.exportTip')}>
        <Toggle checked={common(variants.map((v) => v.doExport))} onChange={(v) => editVariant(keys, { doExport: v }, 'export')} />
      </Row>
      {anyLayers && (
        <Row label={t('inspector.glyph.flatten')} tip={t('inspector.glyph.flattenTip')}>
          <Toggle checked={common(variants.map((v) => v.flattenLayers))} onChange={(v) => editVariant(keys, { flattenLayers: v }, 'flatten')} />
          <Segmented
            // The Row label names the switch: the mode buttons need a name of their own.
            ariaLabel={t('inspector.glyph.flattenMode')}
            value={common(variants.map((v) => v.flattenMode))}
            options={flattenOptions()}
            onChange={(v) => editVariant(keys, { flattenMode: v }, 'flattenMode')}
            disabled={common(variants.map((v) => v.flattenLayers)) === false}
          />
        </Row>
      )}
    </Section>
  )
}

/**
 * A control component drives the glyph's spacing (as in v1): its advance width
 * and frame position every component, so the glyph's own transforms only move
 * its own outline. v1 never said so; the fields simply did nothing.
 */
function ControlNotice({ keys }: { keys: string[] }): React.ReactElement | null {
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const computed = useDocStore((s) => s.computed)
  const { t } = useTranslation()
  const controlled = keys.filter((k) => {
    const g = glyphs.get(k)
    // Flattening fits the whole composite with the glyph's own transforms again.
    return !!g && !g.variants[0].flattenLayers && (computed.get(k)?.[0]?.controlIndex ?? -1) >= 0
  })
  if (!controlled.length) return null

  let body: React.ReactNode
  if (keys.length === 1) {
    const c = computed.get(controlled[0])![0]
    const ref = c.layers[c.controlIndex]?.refKey
    const ownEmpty = isEmptyPathContent(glyphs.get(controlled[0])!.variants[0].pathData.path)
    body = (
      <>
        {ref ? (
          <Trans
            i18nKey="inspector.transforms.controlled"
            values={{ glyph: glyphLabel(ref) }}
            components={{
              ref: (
                <button
                  type="button"
                  className="font-medium text-accent hover:underline"
                  onClick={() => {
                    goToGlyph(ref)
                    focusFallback()
                  }}
                  data-tip={t('inspector.transforms.goToThisGlyph')}
                />
              )
            }}
          />
        ) : (
          t('inspector.transforms.controlledNoRef')
        )}{' '}
        {ownEmpty ? t('inspector.transforms.controlledOwnEmpty') : t('inspector.transforms.controlledOwnOutline')}
      </>
    )
  } else {
    body = t('inspector.transforms.controlledSome', { count: controlled.length })
  }
  return (
    <div className="flex gap-2 rounded-md border border-emphasis/30 bg-emphasis/10 px-2.5 py-2 text-xs leading-snug text-muted">
      <Info size={14} className="mt-px shrink-0 text-emphasis" />
      <p>{body}</p>
    </div>
  )
}

function TransformsSection({ keys }: { keys: string[] }): React.ReactElement | null {
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const familyTr = useDocStore((s) => s.data!.family.transforms)
  const { t } = useTranslation()
  const values = useMemo(
    () => commonTransforms(keys.map((k) => glyphs.get(k)?.variants[0].transforms).filter((t): t is TransformSettings => !!t)),
    [keys, glyphs]
  )
  if (!keys.some((k) => glyphs.has(k))) return null
  const existing = keys.filter((k) => glyphs.has(k))
  return (
    <Section id="inspector.transforms" title={t('inspector.transforms.title')} icon={Move}>
      <ControlNotice keys={existing} />
      <TransformsEditor values={values} family={familyTr} onChange={(p, m) => editTransforms(existing, p, m)} />
    </Section>
  )
}

// ---- Single ----

function SingleInspector({ unicode }: { unicode: string }): React.ReactElement {
  return (
    <>
      <GlyphPreview unicode={unicode} />
      <GlyphIdentity unicode={unicode} exists />
      <GlyphActions unicode={unicode} />
      <GlyphProperties keys={[unicode]} />
      <TransformsSection keys={[unicode]} />
      <ComponentsSection unicode={unicode} />
      <KerningSection unicode={unicode} />
      <DetailsSection unicode={unicode} />
    </>
  )
}

// ---- Empty slot ----

function EmptySlotInspector({ unicode }: { unicode: string }): React.ReactElement {
  const { t } = useTranslation()
  const composable = !!getComposition(unicode)
  // Each action creates the glyph, which swaps this panel for the glyph editor: the
  // button that was used goes away, so focus goes back to the grid.
  return (
    <>
      <div className="flex h-[180px] items-center justify-center border-b border-line bg-slot">
        <span className="select-none text-[96px] leading-none text-fg/15">{keyToDisplayChars(unicode) || '·'}</span>
      </div>
      <GlyphIdentity unicode={unicode} exists={false} />
      <div className="flex flex-col gap-1.5 border-b border-line px-3 pb-3">
        <Button variant="primary" icon={Plus} onClick={() => void createMissing([unicode]).then(() => focusFallback())}>
          {t('inspector.emptySlot.createEmpty')}
        </Button>
        {composable && (
          <Button
            icon={Wand2}
            onClick={() => {
              bootstrapKeys([unicode])
              focusFallback()
            }}
            tip={t('inspector.emptySlot.createFromComponentsTip')}
          >
            {t('inspector.emptySlot.createFromComponents')}
          </Button>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          <Button icon={Download} onClick={() => void pickSvgForGlyph(unicode).then(() => focusFallback())}>
            {t('inspector.emptySlot.importSvg')}
          </Button>
          <Button
            icon={ClipboardPaste}
            onClick={async () => {
              const text = await readClipboardText()
              if (text.includes('<svg')) {
                pasteSvgInto(unicode, text)
                focusFallback()
              } else toast.info(t('inspector.noSvgInClipboard'), t('inspector.emptySlot.noSvgHint'))
            }}
          >
            {t('inspector.emptySlot.pasteSvg')}
          </Button>
        </div>
        <p className="pt-1 text-xs leading-relaxed text-subtle">{t('inspector.emptySlot.dropTip')}</p>
      </div>
      <DetailsSection unicode={unicode} />
    </>
  )
}

// ---- Multi ----

function MultiInspector({ keys }: { keys: string[] }): React.ReactElement {
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const { t } = useTranslation()
  const existing = useMemo(() => keys.filter((k) => glyphs.has(k)), [keys, glyphs])
  const missing = keys.length - existing.length
  const preview = existing.slice(-12)
  return (
    <>
      <div className="border-b border-line px-3 py-3">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-fg">{t('inspector.multi.selected', { count: keys.length })}</span>
          <span className="text-xs text-muted">
            {missing
              ? t('inspector.multi.existingAndEmpty', { n: existing.length, count: missing })
              : t('inspector.multi.existing', { n: existing.length })}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {preview.map((k) => (
            <GlyphThumb
              key={k}
              unicode={k}
              size={40}
              className="w-full"
              onClick={() => {
                goToGlyph(k)
                focusFallback()
              }}
              tip={keyToDisplayChars(k)}
              ariaLabel={t('inspector.goTo', { glyph: glyphSpokenName(k) })}
            />
          ))}
        </div>
        {existing.length > preview.length && <div className="mt-1 text-2xs text-subtle">{t('inspector.more', { n: existing.length - preview.length })}</div>}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {/* Create and Ligature remove their own button (no slot left to create; the ligature gets selected). */}
          {missing > 0 && (
            <Button icon={Plus} onClick={() => void createMissing(keys).then(() => focusFallback())}>
              {t('inspector.multi.create', { n: missing })}
            </Button>
          )}
          <Button
            icon={Ligature}
            onClick={() => {
              createLigature(keys)
              focusFallback()
            }}
            tip={t('inspector.multi.ligatureTip', { chars: keys.map(keyToDisplayChars).join('') })}
          >
            {t('inspector.multi.ligature')}
          </Button>
          {keys.length === 2 && (
            // Shows the new pair in the Kerning view, its value field ready.
            <Button icon={FoldHorizontal} onClick={() => addPair(keys[0], keys[1])} tip={t('inspector.multi.kernPairTip', { chars: keys.map(keyToDisplayChars).join('') })}>
              {t('inspector.multi.kernPair')}
            </Button>
          )}
          <Button icon={Wand2} onClick={() => bootstrapKeys(keys)} tip={t('inspector.multi.composeTip')}>
            {t('inspector.multi.compose')}
          </Button>
          <DropdownMenu
            items={[
              { label: t('inspector.multi.clearAll'), onSelect: () => resetKeys(keys) },
              { label: t('inspector.multi.clearKeepComponents'), onSelect: () => resetKeys(keys, { keepLayers: true }) },
              { label: t('inspector.multi.rebuild'), onSelect: () => resetKeys(keys, { bootstrap: true }) }
            ]}
            trigger={({ toggle, open }) => (
              <Button icon={RotateCcw} onClick={toggle} active={open}>
                {t('inspector.multi.reset')}
              </Button>
            )}
          />
          <Button
            icon={Trash2}
            variant="danger"
            disabled={!existing.length}
            onClick={() => {
              deleteKeys(existing)
              // The button is disabled once nothing is left to delete.
              focusFallback()
            }}
          >
            {t('inspector.multi.delete')}
          </Button>
        </div>
      </div>
      {existing.length > 0 ? (
        <>
          <GlyphProperties keys={existing} />
          <TransformsSection keys={existing} />
          <MultiComponentsSection keys={existing} />
        </>
      ) : (
        <p className="px-4 py-6 text-center text-xs text-subtle">{t('inspector.multi.createFirst')}</p>
      )}
    </>
  )
}

// ---- Placeholder ----

function Placeholder(): React.ReactElement {
  const { t } = useTranslation()
  const kbd = { k: <Kbd /> }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <SlidersHorizontal size={28} strokeWidth={1.5} className="text-subtle" />
      <p className="text-sm text-muted">{t('inspector.placeholder.title')}</p>
      <ul className="space-y-1 text-left text-xs text-subtle">
        <li>
          <Trans i18nKey="inspector.placeholder.multiSelect" components={kbd} />
        </li>
        <li>
          <Trans i18nKey="inspector.placeholder.storeSelection" components={kbd} />
        </li>
        <li>{t('inspector.placeholder.dropSvg')}</li>
        <li>
          <Trans i18nKey="inspector.placeholder.palette" components={kbd} />
        </li>
      </ul>
    </div>
  )
}

export function Kbd({ children }: { children?: React.ReactNode }): React.ReactElement {
  return <kbd className="rounded border border-line bg-raised px-1 py-px font-mono text-2xs text-muted">{children}</kbd>
}
