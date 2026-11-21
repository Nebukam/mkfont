// ============================================================
// A kerning pair in the grid: both glyphs set with the kerning that
// applies, its value, and what keeps it out of exported fonts. A pair
// the font does not kern is a ghost, still drawn with the font's own
// glyphs so its spacing can be judged.
// ============================================================

import { memo } from 'react'
import { AlertTriangle, Link2, Wand2 } from 'lucide-react'
import { PairCanvas, type SetGlyph } from '../canvas/PairCanvas'
import { useDocStore } from '../../stores/doc-store'
import { usePairSelectionStore } from '../../stores/selection-store'
import { usePrefsStore } from '../../stores/prefs-store'
import { useUIStore } from '../../stores/ui-store'
import { useInspectorStore } from '../../stores/inspector-store'
import { advanceWidth, type VariantComputed } from '../../core/compute'
import { glyphSpokenName } from '../../core/unicode'
import { glyphLabel, keyToDisplayChars } from '../../core/unicode-keys'
import { pairKern, pairLabel, pairSides, replacingLigature, type PairKern } from '../../core/kerning'
import { commonRank } from '../../core/common-pairs'
import type { Family } from '../../types/font'
import { useUnicodeDb } from '../../hooks/doc'
import { pairMenu } from '../../app/context-menus'
import { useKernSuggestions } from '../../app/kern-suggestions'
import { formatNumber } from '../ui/fields'
import { cn } from '../../lib/cn'
import { t } from '../../i18n'
import type { GridCellProps, GridItems } from './GlyphGrid'

/** DOM id of a pair cell (the grid points screen readers at its cursor cell). */
export const pairSlotId = (key: string): string => `pair-${key}`

/** A glyph as the pair renderers draw it: its outline, or its character when not in the font. */
export function setGlyph(key: string, computed: VariantComputed | undefined, family: Family, exists: boolean, dim = false): SetGlyph {
  return {
    path: exists ? computed?.path : null,
    advance: exists && computed ? advanceWidth(computed, family) : family.values.width,
    fallback: exists ? undefined : keyToDisplayChars(key),
    dim
  }
}

const NONE: PairKern = { state: 'none', value: 0, from: null }

/** How a pair's state reads, for screen readers. */
export function pairStateWords(k: PairKern): string {
  switch (k.state) {
    case 'kerned':
      return t('viewport.pair.kerned', { value: formatNumber(k.value, 2) })
    case 'zero':
      return t('viewport.pair.zero')
    case 'inherited':
      return t('viewport.pair.inherited', { value: formatNumber(k.value, 2), pair: pairLabel(k.from!) })
    case 'none':
      return t('viewport.pair.none')
  }
}

export const PairSlot = memo(function PairSlot({
  pair,
  showRank,
  width,
  height,
  cursor,
  onSelect,
  onContext
}: GridCellProps & { pair: string; showRank?: boolean }): React.ReactElement {
  const [left, right] = pairSides(pair)
  const kerning = useDocStore((s) => s.data?.kerning)
  const inherit = useDocStore((s) => s.data?.inheritKerning ?? true)
  const family = useDocStore((s) => s.data?.family)
  const hasLeft = useDocStore((s) => !!s.data?.glyphs.has(left))
  const hasRight = useDocStore((s) => !!s.data?.glyphs.has(right))
  const cLeft = useDocStore((s) => s.computed.get(left)?.[0])
  const cRight = useDocStore((s) => s.computed.get(right)?.[0])
  const ligature = useDocStore((s) => (s.data ? replacingLigature(pair, (k) => s.data!.glyphs.has(k)) : null))
  // The value measured from the outlines (shown while the pair is not kerned).
  const docId = useDocStore((s) => s.docId)
  const suggested = useKernSuggestions((s) => (s.docId === docId ? s.map.get(pair) : undefined))
  const selected = usePairSelectionStore((s) => s.set.has(pair))
  const isActive = usePairSelectionStore((s) => s.active === pair)
  const showLabels = usePrefsStore((s) => s.showSlotLabels)
  useUnicodeDb()

  const k = kerning ? pairKern(kerning, pair, inherit) : NONE
  const ghost = k.state === 'none'
  const hint = ghost ? suggested : undefined
  const rank = showRank ? commonRank(pair) : undefined
  const missing = [hasLeft ? null : left, hasRight ? null : right].filter((g): g is string => !!g)
  const inactive = missing.length > 0
  const labelH = showLabels ? 22 : 4
  const canvasH = Math.max(10, height - labelH - 6)
  const canvasW = Math.max(10, width - 6)

  const states = [
    pairStateWords(k),
    hint !== undefined && t('viewport.pair.suggested', { value: formatNumber(hint, 2) }),
    rank && t('viewport.pair.commonRank', { rank }),
    ...missing.map((g) => t('viewport.pair.notInFont', { glyph: glyphLabel(g) })),
    ligature && t('viewport.pair.replacedByLigature', { glyph: glyphLabel(ligature) })
  ].filter(Boolean)
  const ariaLabel = t('viewport.pair.label', {
    left: glyphSpokenName(left),
    right: glyphSpokenName(right),
    states: states.join(t('viewport.pair.separator'))
  })

  let value: React.ReactNode = null
  if (k.state === 'kerned') value = <span className="text-emphasis">{formatNumber(k.value, 2)}</span>
  else if (k.state === 'zero') value = <span className="text-ok">0</span>
  else if (k.state === 'inherited')
    value = (
      <span className="flex items-center gap-0.5 italic text-emphasis/80">
        <Link2 size={9} aria-hidden />
        {formatNumber(k.value, 2)}
      </span>
    )
  else if (hint !== undefined)
    value = (
      <span className="flex items-center gap-0.5 text-muted" data-tip={t('viewport.pair.suggestedTip')}>
        <Wand2 size={9} aria-hidden />≈ {formatNumber(hint, 2)}
      </span>
    )
  else if (rank) value = <span className="text-subtle">{t('viewport.pair.rank', { rank })}</span>

  return (
    <div
      id={pairSlotId(pair)}
      role="gridcell"
      aria-selected={selected}
      aria-label={ariaLabel}
      data-key={pair}
      onMouseDown={(e) => {
        if (e.button === 0) onSelect(pair, e)
      }}
      // The value field takes the keys: double click, then type the value.
      onDoubleClick={() => useInspectorStore.getState().focusPair(pair)}
      onContextMenu={(e) => onContext(pair, e)}
      onMouseEnter={() => useUIStore.setState({ hoverKey: pair })}
      onMouseLeave={() => {
        if (useUIStore.getState().hoverKey === pair) useUIStore.setState({ hoverKey: null })
      }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-md border transition-[border-color,background-color,box-shadow] duration-75',
        ghost || inactive ? 'bg-slot/40' : 'bg-slot',
        selected ? 'border-accent bg-accent/10 shadow-[0_0_0_1px_rgb(var(--c-accent))]' : 'border-line/60 hover:border-line-strong',
        isActive && selected && 'shadow-[0_0_0_2px_rgb(var(--c-accent))]',
        cursor && !(isActive && selected) && 'outline-dashed outline-2 outline-offset-1 outline-accent'
      )}
      style={{ width, height }}
    >
      <div className="relative flex flex-1 items-center justify-center pt-[3px]">
        {family && (
          <PairCanvas
            glyphs={[setGlyph(left, cLeft, family, hasLeft, ghost), setGlyph(right, cRight, family, hasRight, ghost)]}
            kerns={[k.value]}
            mark={0}
            markInherited={k.state === 'inherited'}
            hint={hint}
            family={family.values}
            width={canvasW}
            height={canvasH}
            mode="slot"
            faded={inactive}
          />
        )}
      </div>

      {showLabels && (
        <div className="flex h-[22px] shrink-0 items-center gap-1 px-1.5">
          <span className={cn('min-w-0 truncate text-sm leading-none', ghost || inactive ? 'text-muted' : 'text-fg')}>{pairLabel(pair)}</span>
          <span className="ml-auto shrink-0 font-mono text-2xs">{value}</span>
        </div>
      )}

      {/* Badges (also in the cell's label) */}
      <div className="pointer-events-none absolute left-1 top-1 flex gap-0.5" aria-hidden>
        {ligature && <span className="rounded bg-warn/15 px-1 text-[8px] font-bold leading-[14px] text-warn">{t('viewport.pair.ligaBadge')}</span>}
        {inactive && <AlertTriangle size={12} className="text-warn" />}
      </div>
    </div>
  )
})

/** The Kerning view's grid content: the font's pairs. */
export const PAIR_ITEMS: GridItems = {
  selection: usePairSelectionStore,
  renderCell: (key, props) => <PairSlot key={key} pair={key} {...props} />,
  cellId: pairSlotId,
  menu: pairMenu,
  label: () => t('viewport.grid.pairs'),
  aspect: 1.6
}

/** The common pairs views: ghosts show their rank in the list. */
export const COMMON_ITEMS: GridItems = {
  ...PAIR_ITEMS,
  renderCell: (key, props) => <PairSlot key={key} pair={key} showRank {...props} />,
  label: () => t('viewport.grid.commonPairs')
}
