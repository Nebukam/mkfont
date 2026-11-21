// ============================================================
// Inspector of the pair views: one kerning pair, several, or none.
// A pair the font does not kern yet (a ghost of the common lists)
// is added by giving it a value.
// ============================================================

import { useEffect, useRef } from 'react'
import { CircleCheck, FoldHorizontal, Info, Link2, Plus, Trash2, Wand2 } from 'lucide-react'
import { useDocStore } from '../../stores/doc-store'
import { usePairSelectionStore } from '../../stores/selection-store'
import { useInspectorStore } from '../../stores/inspector-store'
import { Section } from '../ui/Section'
import { Button } from '../ui/Button'
import { NumberField, Row, formatNumber } from '../ui/fields'
import { focusFallback } from '../ui/focus'
import { GlyphThumb } from '../common/GlyphThumb'
import { PairCanvas, type SetGlyph } from '../canvas/PairCanvas'
import { setGlyph } from '../viewport/PairSlot'
import { goToGlyph } from './DetailsSection'
import { commonValue } from './common'
import { useSize } from '../../hooks/useSize'
import { useUnicodeDb } from '../../hooks/doc'
import { advanceWidth } from '../../core/compute'
import { glyphSpokenName } from '../../core/unicode'
import { formatKey, glyphLabel, keyToChars } from '../../core/unicode-keys'
import { baseGlyph, inheritedFrom, pairKern, pairLabel, pairSides, replacingLigature } from '../../core/kerning'
import { COMMON_PAIR_COUNT, commonRank } from '../../core/common-pairs'
import { createMissing } from '../../app/actions'
import { applySuggestions, followBase, nudgePairs, removePairs, setPairValues, suggestable } from '../../app/kerning'
import { useKernSuggestions } from '../../app/kern-suggestions'
import { cn } from '../../lib/cn'
import { useTranslation } from '../../i18n'

export function PairInspector(): React.ReactElement {
  const keys = usePairSelectionStore((s) => s.keys)
  if (keys.length === 0) return <PairPlaceholder />
  if (keys.length === 1) return <SinglePairInspector pair={keys[0]} />
  return <MultiPairInspector keys={keys} />
}

/** Proof glyph next to a pair: n beside lowercase letters, H otherwise. */
function contextGlyph(key: string): string {
  const c = keyToChars(key)
  return c.length === 1 && c !== c.toUpperCase() ? '006e' : '0048'
}

const NUDGES = [
  { delta: -10, label: '−10' },
  { delta: -1, label: '−1' },
  { delta: 1, label: '+1' },
  { delta: 10, label: '+10' }
]

function Nudges({ keys }: { keys: string[] }): React.ReactElement {
  const { t } = useTranslation()
  return (
    <Row label="">
      <div className="flex gap-1">
        {NUDGES.map((n) => {
          const count = Math.abs(n.delta)
          const tip = n.delta < 0 ? t('inspector.pair.tighten', { count }) : t('inspector.pair.loosen', { count })
          return (
            <Button key={n.delta} size="xs" className="font-mono" tip={tip} aria-label={tip} onClick={() => nudgePairs(keys, n.delta)}>
              {n.label}
            </Button>
          )
        })}
      </div>
    </Row>
  )
}

function Notice({ tone, children }: { tone: 'info' | 'warn'; children: React.ReactNode }): React.ReactElement {
  return (
    <div
      className={cn(
        'mx-3 mb-2.5 flex gap-2 rounded-md border px-2.5 py-2 text-xs leading-snug text-muted',
        tone === 'warn' ? 'border-warn/35 bg-warn/10' : 'border-emphasis/30 bg-emphasis/10'
      )}
    >
      <Info size={14} className={cn('mt-px shrink-0', tone === 'warn' ? 'text-warn' : 'text-emphasis')} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

/** Colours of the state chip; its text is `inspector.pair.state.<state>`. */
const STATE_CHIP = {
  kerned: 'bg-emphasis/15 text-emphasis',
  zero: 'bg-ok/15 text-ok',
  inherited: 'bg-emphasis/10 text-emphasis',
  none: 'bg-hover text-muted'
}

/** The letter that makes a pair inherit (Á for TÁ when it follows TA). */
function accentedSide(pair: string, from: string): string {
  const [l, r] = pairSides(pair)
  const [fl] = pairSides(from)
  return fl !== l ? l : r
}

function SinglePairInspector({ pair }: { pair: string }): React.ReactElement {
  useUnicodeDb()
  const { t } = useTranslation()
  const [left, right] = pairSides(pair)
  const kerning = useDocStore((s) => s.data!.kerning)
  const inherit = useDocStore((s) => s.data!.inheritKerning)
  const family = useDocStore((s) => s.data!.family)
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const computed = useDocStore((s) => s.computed)
  const docId = useDocStore((s) => s.docId)
  // The value measured from the outlines, if they suggest one.
  const suggested = useKernSuggestions((s) => (s.docId === docId ? s.map.get(pair) : undefined))
  const [box, size] = useSize<HTMLDivElement>()
  const fieldBox = useRef<HTMLDivElement>(null)

  // A pair just added (or double-clicked): its value field takes the keys.
  const pairFocus = useInspectorStore((s) => s.pairFocus)
  useEffect(() => {
    if (pairFocus !== pair) return
    useInspectorStore.getState().focusPair(null)
    const input = fieldBox.current?.querySelector('input')
    input?.focus()
    input?.select()
  }, [pairFocus, pair])

  const k = pairKern(kerning, pair, inherit)
  const own = kerning.get(pair)
  // Offered while the pair is not kerned: values set by hand are never replaced.
  const offer = k.state === 'none' ? suggested : undefined
  // The base letters' pair it follows, or would follow without a value of its own.
  const from = inherit ? inheritedFrom(kerning, pair) : null
  const baseValue = from ? kerning.get(from)! : undefined
  const rank = commonRank(pair)
  const missing = [...new Set([left, right])].filter((g) => !glyphs.has(g))
  const ligature = replacingLigature(pair, (g) => glyphs.has(g))
  const notExported = [...new Set([left, right])].filter((g) => glyphs.has(g) && (glyphs.get(g)!.variants[0].doExport === false || computed.get(g)?.[0]?.oob))

  // The proof: the pair between glyphs of its case (H H or n n), when the font has them.
  const ctxL = contextGlyph(left)
  const ctxR = contextGlyph(right)
  const set: SetGlyph[] = []
  const kerns: number[] = []
  if (glyphs.has(ctxL)) {
    set.push(setGlyph(ctxL, computed.get(ctxL)?.[0], family, true, true))
    kerns.push(0)
  }
  const mark = set.length
  set.push(setGlyph(left, computed.get(left)?.[0], family, glyphs.has(left)))
  kerns.push(k.value)
  set.push(setGlyph(right, computed.get(right)?.[0], family, glyphs.has(right)))
  if (glyphs.has(ctxR)) {
    kerns.push(0)
    set.push(setGlyph(ctxR, computed.get(ctxR)?.[0], family, true, true))
  }

  // One or both glyphs, by name.
  const glyphNames = (list: string[]): { glyph: string; first: string; second: string } => ({
    glyph: glyphLabel(list[0]),
    first: glyphLabel(list[0]),
    second: list[1] ? glyphLabel(list[1]) : ''
  })
  let exported: string = t('inspector.pair.exportedYes')
  let exportedNo = true
  if (k.state === 'none') exported = t('inspector.pair.exportedNotKerned')
  else if (missing.length)
    exported = missing.length > 1 ? t('inspector.pair.exportedNotInFontBoth', glyphNames(missing)) : t('inspector.pair.exportedNotInFont', glyphNames(missing))
  else if (notExported.length)
    exported =
      notExported.length > 1 ? t('inspector.pair.exportedNotExportedBoth', glyphNames(notExported)) : t('inspector.pair.exportedNotExported', glyphNames(notExported))
  else if (k.value === 0) exported = t('inspector.pair.exportedZero')
  else {
    exportedNo = false
    if (k.state === 'inherited') exported = t('inspector.pair.exportedInherited', { pair: pairLabel(k.from!) })
  }
  const advance = (g: string): string => {
    const c = computed.get(g)?.[0]
    return glyphs.has(g) && c ? formatNumber(advanceWidth(c, family), 2) : '—'
  }

  // What the value field says about inheritance, under it.
  let hint: React.ReactNode = null
  if (k.state === 'inherited') {
    const accented = accentedSide(pair, k.from!)
    hint = t('inspector.pair.follows', { pair: pairLabel(k.from!), base: glyphLabel(baseGlyph(accented) ?? accented), accented: glyphLabel(accented) })
  } else if (own !== undefined && from) {
    hint = (
      <>
        {t('inspector.pair.ownValue', { pair: pairLabel(from), value: formatNumber(baseValue!, 2) })}{' '}
        <button type="button" className="font-medium text-accent hover:underline" onClick={() => followBase([pair])}>
          {t('inspector.pair.follow', { pair: pairLabel(from) })}
        </button>
      </>
    )
  } else if (offer !== undefined) {
    hint = t('inspector.pair.measured', { value: formatNumber(offer, 2) })
  } else if (k.state === 'none') {
    hint = t('inspector.pair.notKernedYet')
  }

  return (
    <>
      <div ref={box} className="relative h-[180px] shrink-0 overflow-hidden border-b border-line bg-slot">
        <PairCanvas
          glyphs={set}
          kerns={kerns}
          mark={mark}
          markInherited={k.state === 'inherited'}
          hint={offer}
          family={family.values}
          width={size.width || 300}
          height={180}
          mode="preview"
          faded={missing.length > 0}
        />
      </div>

      <div className="flex items-start gap-3 px-3 py-2.5">
        <div className="flex shrink-0 gap-1">
          {[left, right].map((g, i) => (
            <GlyphThumb
              key={i}
              unicode={g}
              size={44}
              onClick={() => {
                goToGlyph(g)
                focusFallback()
              }}
              tip={t('inspector.goTo', { glyph: glyphLabel(g) })}
              ariaLabel={t('inspector.goTo', { glyph: glyphSpokenName(g) })}
            />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-fg">{t('inspector.pair.title', { pair: pairLabel(pair) })}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="rounded bg-hover px-1.5 py-px font-mono text-2xs text-muted">
              {formatKey(left)} {formatKey(right)}
            </span>
            <span className={cn('rounded px-1.5 py-px text-2xs', STATE_CHIP[k.state])}>{t(`inspector.pair.state.${k.state}`)}</span>
            {rank && (
              <span className="rounded bg-hover px-1.5 py-px text-2xs text-muted" data-tip={t('inspector.pair.rankTip')}>
                {t('inspector.pair.rank', { n: rank })}
              </span>
            )}
          </div>
        </div>
      </div>

      {missing.length > 0 && (
        <Notice tone="warn">
          {missing.length > 1 ? t('inspector.pair.missingBoth', glyphNames(missing)) : t('inspector.pair.missing', glyphNames(missing))}{' '}
          <button type="button" className="font-medium text-accent hover:underline" onClick={() => void createMissing(missing)}>
            {missing.length > 1 ? t('inspector.pair.createThem') : t('inspector.pair.createIt')}
          </button>
        </Notice>
      )}
      {ligature && (
        <Notice tone="info">
          {t('inspector.pair.ligature', { ligature: glyphLabel(ligature), left: glyphLabel(left), right: glyphLabel(right) })}{' '}
          <button
            type="button"
            className="font-medium text-accent hover:underline"
            onClick={() => {
              goToGlyph(ligature)
              focusFallback()
            }}
          >
            {t('inspector.pair.goToLigature')}
          </button>
        </Notice>
      )}

      <Section id="inspector.pair" title={t('inspector.kerning')} icon={FoldHorizontal}>
        <Row label={t('inspector.pair.value')} tip={t('inspector.pair.valueTip')}>
          <div ref={fieldBox} className="min-w-0 flex-1">
            <NumberField
              value={own ?? null}
              inherited={baseValue ?? 0}
              linkable={!!from}
              precision={2}
              suffix={t('inspector.pair.units')}
              onChange={(v, m) => (v === null ? followBase([pair]) : setPairValues([pair], v, m.interactive))}
            />
          </div>
        </Row>
        <Nudges keys={[pair]} />
        {hint && <p className="pl-[84px] text-2xs leading-snug text-muted">{hint}</p>}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {offer !== undefined && (
            <Button icon={Wand2} variant="primary" onClick={() => applySuggestions([pair])} tip={t('inspector.pair.applyTip')}>
              {t('inspector.pair.apply', { value: formatNumber(offer, 2) })}
            </Button>
          )}
          <Button icon={CircleCheck} disabled={own === 0} onClick={() => setPairValues([pair], 0)} tip={t('inspector.pair.noKerningTip')}>
            {t('inspector.pair.noKerning')}
          </Button>
          <Button
            icon={Trash2}
            variant="danger"
            disabled={own === undefined}
            onClick={() => {
              removePairs([pair])
              focusFallback()
            }}
            tip={from ? t('inspector.pair.removeTip', { pair: pairLabel(from) }) : undefined}
          >
            {t('inspector.pair.remove')}
          </Button>
        </div>
      </Section>

      <Section id="inspector.pair.details" title={t('inspector.details')} icon={Info}>
        <div className="grid grid-cols-1 gap-y-0.5 text-xs">
          <Stat label={t('inspector.pair.exported')} value={exported} warn={exportedNo && k.state !== 'none' && k.value !== 0} />
          <Stat label={t('inspector.pair.advanceOf', { glyph: glyphLabel(left) })} value={advance(left)} mono />
          <Stat label={t('inspector.pair.advanceOf', { glyph: glyphLabel(right) })} value={advance(right)} mono />
          <Stat
            label={t('inspector.pair.rankLabel')}
            value={rank ? t('inspector.pair.rankValue', { n: rank, total: COMMON_PAIR_COUNT }) : t('inspector.pair.notListed')}
            mono={!!rank}
          />
          {suggested !== undefined && <Stat label={t('inspector.pair.measuredLabel')} value={formatNumber(suggested, 2)} mono />}
        </div>
      </Section>
    </>
  )
}

function MultiPairInspector({ keys }: { keys: string[] }): React.ReactElement {
  const { t } = useTranslation()
  const kerning = useDocStore((s) => s.data!.kerning)
  const inherit = useDocStore((s) => s.data!.inheritKerning)
  const docId = useDocStore((s) => s.docId)
  const suggestions = useKernSuggestions((s) => (s.docId === docId ? s.map : null))
  // Selected pairs not kerned yet that the outlines suggest a value for (re-read on kerning changes).
  const fill = suggestions ? suggestable(keys, suggestions) : []
  const own = keys.filter((k) => kerning.has(k))
  const value = commonValue(keys.map((k) => pairKern(kerning, k, inherit).value))
  const inheriting = own.filter((k) => inherit && inheritedFrom(kerning, k))
  const notKerned = keys.filter((k) => pairKern(kerning, k, inherit).state === 'none').length
  const shown = keys.slice(0, 24)
  return (
    <>
      <div className="border-b border-line px-3 py-3">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-fg">{t('inspector.pair.selected', { count: keys.length })}</span>
          {notKerned > 0 && <span className="text-xs text-muted">{t('inspector.pair.notKerned', { n: notKerned })}</span>}
        </div>
        <div className="flex flex-wrap gap-1">
          {shown.map((k) => (
            <span key={k} className="rounded bg-hover px-1.5 py-px text-xs text-fg">
              {pairLabel(k)}
            </span>
          ))}
          {keys.length > shown.length && <span className="px-1 text-2xs text-subtle">{t('inspector.more', { n: keys.length - shown.length })}</span>}
        </div>
      </div>
      <Section id="inspector.pair" title={t('inspector.kerning')} icon={FoldHorizontal}>
        <Row label={t('inspector.pair.value')} tip={t('inspector.pair.valueAllTip')}>
          <NumberField value={value} precision={2} suffix={t('inspector.pair.units')} onChange={(v, m) => setPairValues(keys, v ?? 0, m.interactive)} />
        </Row>
        <Nudges keys={keys} />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {fill.length > 0 && (
            <Button icon={Wand2} onClick={() => applySuggestions(fill)} tip={t('inspector.pair.applySuggestedTip')}>
              {t('inspector.pair.applySuggested', { n: fill.length })}
            </Button>
          )}
          <Button icon={CircleCheck} onClick={() => setPairValues(keys, 0)} tip={t('inspector.pair.noKerningAllTip')}>
            {t('inspector.pair.noKerning')}
          </Button>
          {inheriting.length > 0 && (
            <Button icon={Link2} onClick={() => followBase(inheriting)} tip={t('inspector.pair.inheritTip')}>
              {t('inspector.pair.inherit', { n: inheriting.length })}
            </Button>
          )}
          <Button
            icon={Trash2}
            variant="danger"
            disabled={!own.length}
            onClick={() => {
              removePairs(own)
              focusFallback()
            }}
          >
            {t('inspector.pair.removeCount', { n: own.length })}
          </Button>
        </div>
      </Section>
    </>
  )
}

function PairPlaceholder(): React.ReactElement {
  const { t } = useTranslation()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <FoldHorizontal size={28} strokeWidth={1.5} className="text-subtle" />
      <p className="text-sm text-muted">{t('inspector.pair.placeholder')}</p>
      <ul className="space-y-1 text-left text-xs text-subtle">
        <li className="flex items-center gap-1.5">
          <Plus size={11} /> {t('inspector.pair.typePair')}
        </li>
        <li>{t('inspector.pair.selectTwo')}</li>
        <li>{t('inspector.pair.selectInPreview')}</li>
        <li>{t('inspector.pair.doubleClick')}</li>
      </ul>
    </div>
  )
}

function Stat({ label, value, warn, mono }: { label: string; value: string; warn?: boolean; mono?: boolean }): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-muted">{label}</span>
      <span className={cn('text-right', warn ? 'text-warn' : 'text-fg', mono && 'font-mono')}>{value}</span>
    </div>
  )
}
