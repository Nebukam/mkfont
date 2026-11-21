import { useMemo } from 'react'
import { Info, MousePointerClick } from 'lucide-react'
import { useDocStore } from '../../stores/doc-store'
import { useSelectionStore } from '../../stores/selection-store'
import { useUIStore } from '../../stores/ui-store'
import { Section, SubHeader } from '../ui/Section'
import { Button } from '../ui/Button'
import { GlyphThumb } from '../common/GlyphThumb'
import { focusFallback } from '../ui/focus'
import {
  findBlock,
  getComposition,
  getDecomposition,
  getGeneralCategory,
  getKeyName,
  getRelatives,
  glyphSpokenName,
  isListedInAll,
  isListedInBlocks
} from '../../core/unicode'
import { toast } from '../ui/Overlays'
import { formatKey, keyToDisplayChars, isLigatureKey } from '../../core/unicode-keys'
import { advanceWidth } from '../../core/compute'
import { pathBBox } from '../../core/geometry'
import { useUnicodeDb } from '../../hooks/doc'
import { formatNumber } from '../ui/fields'
import { t, useTranslation } from '../../i18n'

/** Select a glyph and bring it into view (switching range when needed). */
export function goToGlyph(key: string): void {
  const ui = useUIStore.getState()
  const glyphs = useDocStore.getState().data?.glyphs
  const range = ui.range
  const exists = !!glyphs?.has(key)
  const liga = isLigatureKey(key)
  const cp = liga ? NaN : parseInt(key, 16)
  // Does the current view list this key at all?
  let inRange: boolean
  switch (range.kind) {
    case 'glyphs':
      inRange = exists
      break
    case 'ligatures':
      inRange = liga && exists
      break
    case 'kerning':
    case 'common':
    case 'detected':
      inRange = false
      break
    case 'all':
      inRange = !liga && isListedInAll(cp)
      break
    case 'block':
      inRange = !liga && isListedInBlocks(cp) && findBlock(cp)?.name === range.name
      break
    case 'category':
      inRange = !liga && getGeneralCategory(cp) === range.gc
      break
  }
  if (!inRange) {
    if (exists) ui.setRange({ kind: 'glyphs' })
    else if (!liga && isListedInBlocks(cp)) {
      const b = findBlock(cp)
      ui.setRange(b ? { kind: 'block', name: b.name } : { kind: 'all' })
    } else {
      toast.info(t('inspector.detailsSection.notListed', { code: formatKey(key) }), t('inspector.detailsSection.notListedHint'))
      return
    }
  }
  ui.setSearchText('')
  // "Existing only" would hide a glyph that is not in the font yet.
  if (!exists && ui.searchExists) useUIStore.setState({ searchExists: false })
  useSelectionStore.getState().setSelection([key], key)
  ui.reveal(key)
}

function ThumbList({ keys }: { keys: string[] }): React.ReactElement {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-1.5">
      {keys.map((k) => (
        <GlyphThumb
          key={k}
          unicode={k}
          size={40}
          className="w-full"
          onClick={() => {
            goToGlyph(k)
            focusFallback()
          }}
          tip={`${keyToDisplayChars(k)} ${formatKey(k)}\n${getKeyName(k) ?? ''}`}
          ariaLabel={t('inspector.goTo', { glyph: glyphSpokenName(k) })}
        />
      ))}
    </div>
  )
}

export function DetailsSection({ unicode }: { unicode: string }): React.ReactElement {
  useUnicodeDb()
  const { t } = useTranslation()
  const users = useDocStore((s) => s.dep.users.get(unicode))
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const computed = useDocStore((s) => s.computed.get(unicode)?.[0])
  const family = useDocStore((s) => s.data!.family)

  const userKeys = useMemo(() => [...(users ?? [])].filter((k) => glyphs.has(k)), [users, glyphs])
  const decomp = getDecomposition(unicode)
  const comp = getComposition(unicode)
  const relatives = useMemo(() => getRelatives(unicode).filter((k) => !comp?.includes(k)), [unicode, comp])

  // Stats cover the final outline (glyph + components).
  const bbox = useMemo(() => (computed && !computed.empty ? pathBBox(computed.path) : null), [computed])
  const adv = computed ? advanceWidth(computed, family) : 0
  const fullBox = !!bbox

  return (
    <Section id="inspector.details" title={t('inspector.details')} icon={Info} defaultOpen={true}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
        <Stat label={t('inspector.detailsSection.advance')} value={formatNumber(adv, 2)} />
        <Stat
          label={t('inspector.detailsSection.exported')}
          value={computed?.oob ? t('inspector.detailsSection.exportedSkipped') : t('inspector.detailsSection.exportedYes')}
          warn={computed?.oob}
        />
        {bbox && fullBox && (
          <>
            <Stat label={t('inspector.detailsSection.outlineWidth')} value={formatNumber(bbox.width, 1)} />
            <Stat label={t('inspector.detailsSection.outlineHeight')} value={formatNumber(bbox.height, 1)} />
            <Stat label={t('inspector.detailsSection.leftBearing')} value={formatNumber(bbox.left, 1)} />
            <Stat label={t('inspector.detailsSection.rightBearing')} value={formatNumber(adv - bbox.right, 1)} />
          </>
        )}
      </div>

      {userKeys.length > 0 && (
        <>
          <SubHeader className="flex items-center justify-between">
            <span>{t('inspector.detailsSection.usedAsComponent', { n: userKeys.length })}</span>
            <Button
              size="xs"
              variant="ghost"
              icon={MousePointerClick}
              onClick={() => {
                // Range first: the users selected in "My glyphs" are one Back step.
                useUIStore.getState().setRange({ kind: 'glyphs' })
                useSelectionStore.getState().setSelection(userKeys)
                // The inspector switches to the new selection, and this button goes with it.
                focusFallback()
              }}
            >
              {t('inspector.detailsSection.selectAll')}
            </Button>
          </SubHeader>
          <ThumbList keys={userKeys.slice(0, 48)} />
        </>
      )}

      {decomp && (
        <>
          <SubHeader>
            {decomp.tag && decomp.tag !== 'ligature'
              ? t('inspector.detailsSection.decompositionTagged', { tag: decomp.tag, n: decomp.keys.length })
              : t('inspector.detailsSection.decomposition', { n: decomp.keys.length })}
          </SubHeader>
          <ThumbList keys={decomp.keys} />
        </>
      )}

      {relatives.length > 0 && (
        <>
          <SubHeader>{t('inspector.detailsSection.relatives', { n: relatives.length })}</SubHeader>
          <ThumbList keys={relatives.slice(0, 48)} />
        </>
      )}
    </Section>
  )
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-muted">{label}</span>
      <span className={warn ? 'text-warn' : 'font-mono text-fg'}>{value}</span>
    </div>
  )
}
