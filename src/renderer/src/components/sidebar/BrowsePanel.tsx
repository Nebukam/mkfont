import { useMemo, useRef, useState } from 'react'
import {
  CaseLower,
  CaseSensitive,
  CaseUpper,
  ChevronRight,
  FoldHorizontal,
  Globe,
  Hash,
  Ligature,
  ListOrdered,
  Search,
  Shapes,
  Space,
  Wand2,
  X
} from 'lucide-react'
import { useDocStore } from '../../stores/doc-store'
import { useUIStore, sameRange, type RangeRef } from '../../stores/ui-store'
import { BROWSABLE_BLOCKS, CATEGORY_COLORS, CATEGORY_GROUPS, SUBCATEGORIES, findBlock, getGlyphGeneralCategory } from '../../core/unicode'
import { categoryGroupName, categoryName } from '../../lib/category-names'
import { COMMON_GROUPS, commonPairs, type CommonGroup } from '../../core/common-pairs'
import { detectedPairs, useKernSuggestions } from '../../app/kern-suggestions'
import { isLigatureKey } from '../../core/unicode-keys'
import { cn } from '../../lib/cn'
import { PanelHeader } from './PanelHeader'
import { Section } from '../ui/Section'
import { Checkbox } from '../ui/fields'
import { keepTypingKeys } from '../ui/focus'
import { formatNumber, useTranslation } from '../../i18n'

/** Text-editor style icons for the common pairs lists. */
const COMMON_ICONS: Record<CommonGroup, React.ComponentType<{ size?: number; className?: string }>> = {
  all: ListOrdered,
  upper: CaseUpper,
  mixed: CaseSensitive,
  lower: CaseLower,
  punct: Hash,
  space: Space
}

export function BrowsePanel(): React.ReactElement {
  const { t } = useTranslation()
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const pairCount = useDocStore((s) => s.data!.kerning.size)
  const range = useUIStore((s) => s.range)
  // Detected: as many as the view lists (no count until the outlines are measured).
  const kerning = useDocStore((s) => s.data!.kerning)
  const inherit = useDocStore((s) => s.data!.inheritKerning)
  const docId = useDocStore((s) => s.docId)
  const suggestions = useKernSuggestions((s) => (s.ready && s.docId === docId ? s.map : null))
  const rare = useUIStore((s) => s.searchRare)
  const detectedCount = useMemo(
    () => (suggestions ? detectedPairs(suggestions, kerning, inherit, rare).length : undefined),
    [suggestions, kerning, inherit, rare]
  )
  const [filter, setFilter] = useState('')
  const [onlyUsed, setOnlyUsed] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const counts = useMemo(() => {
    const byBlock = new Map<string, number>()
    const byGc = new Map<string, number>()
    let ligatures = 0
    for (const k of glyphs.keys()) {
      if (isLigatureKey(k)) {
        ligatures++
        continue
      }
      const b = findBlock(parseInt(k, 16))
      if (b) byBlock.set(b.name, (byBlock.get(b.name) ?? 0) + 1)
      const gc = getGlyphGeneralCategory(k)
      byGc.set(gc, (byGc.get(gc) ?? 0) + 1)
    }
    return { byBlock, byGc, ligatures }
  }, [glyphs])

  // A navigation step: Back (Alt+←) returns here with the selection as it is now.
  const go = (r: RangeRef): void => {
    if (!sameRange(r, useUIStore.getState().range)) useUIStore.getState().setRange(r)
  }
  const isActive = (r: RangeRef): boolean => sameRange(r, range)
  const f = filter.trim().toLowerCase()
  const blocks = BROWSABLE_BLOCKS.filter((b) => (!f || b.name.toLowerCase().includes(f)) && (!onlyUsed || counts.byBlock.has(b.name)))

  // The block list is one tab stop (it has ~350 entries). Inside it the tab stop follows
  // focus; coming back in lands on the current block, else the first one. Arrow keys move
  // like in a list box; Enter / Space open the block.
  const blocksRef = useRef<HTMLDivElement>(null)
  const [focusBlock, setFocusBlock] = useState<string | null>(null)
  const listed = (name: string | null): name is string => name !== null && blocks.some((b) => b.name === name)
  const activeBlock = range.kind === 'block' ? range.name : null
  const tabBlock = listed(focusBlock) ? focusBlock : listed(activeBlock) ? activeBlock : blocks[0]?.name
  const focusTabBlock = (): void => blocksRef.current?.querySelector<HTMLElement>(':scope > button[tabindex="0"]')?.focus()
  const onBlocksKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(':scope > button'))
    const cur = items.indexOf(e.target as HTMLElement)
    if (cur === -1) return
    let next: number
    switch (e.key) {
      case 'ArrowDown': next = cur + 1; break
      case 'ArrowUp': next = cur - 1; break
      case 'PageDown': next = cur + 10; break
      case 'PageUp': next = cur - 10; break
      case 'Home': next = 0; break
      case 'End': next = items.length - 1; break
      default: return
    }
    e.preventDefault()
    items[Math.max(0, Math.min(items.length - 1, next))].focus()
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader title={t('browse.title')} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Group id="browse.font" title={t('browse.groups.font')} collapsible={false}>
          <Item icon={Shapes} label={t('browse.myGlyphs')} count={glyphs.size} active={isActive({ kind: 'glyphs' })} onClick={() => go({ kind: 'glyphs' })} />
          <Item icon={Ligature} label={t('browse.ligatures')} count={counts.ligatures} active={isActive({ kind: 'ligatures' })} onClick={() => go({ kind: 'ligatures' })} />
          <Item icon={FoldHorizontal} label={t('browse.kerning')} count={pairCount} active={isActive({ kind: 'kerning' })} onClick={() => go({ kind: 'kerning' })} />
          <Item icon={Globe} label={t('browse.allCharacters')} active={isActive({ kind: 'all' })} onClick={() => go({ kind: 'all' })} />
        </Group>

        <Group id="browse.pairs" title={t('browse.groups.pairs')}>
          <Item icon={Wand2} label={t('browse.detected')} count={detectedCount} active={isActive({ kind: 'detected' })} onClick={() => go({ kind: 'detected' })} />
          {COMMON_GROUPS.map((g) => {
            const r: RangeRef = { kind: 'common', group: g.id }
            return (
              <Item
                key={g.id}
                icon={COMMON_ICONS[g.id]}
                indent={g.id !== 'all'}
                label={g.id === 'all' ? t('browse.commonPairs') : t(`kerning.commonGroups.${g.id}.name`)}
                count={commonPairs(g.id).length}
                active={isActive(r)}
                onClick={() => go(r)}
              />
            )
          })}
        </Group>

        <Group id="browse.categories" title={t('browse.groups.categories')}>
          {CATEGORY_GROUPS.map((g) => {
            const total = g.subs.reduce((n, s) => n + (counts.byGc.get(s) ?? 0), 0)
            const expanded = open[g.id] ?? false
            return (
              <div key={g.id}>
                <button
                  type="button"
                  onClick={() => setOpen({ ...open, [g.id]: !expanded })}
                  className="flex h-7 w-full items-center gap-1.5 rounded px-2 text-left text-sm text-fg hover:bg-hover"
                  aria-expanded={expanded}
                >
                  <ChevronRight size={12} className={cn('shrink-0 text-subtle transition-transform', expanded && 'rotate-90')} />
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[SUBCATEGORIES[g.subs[0]].col].color }} />
                  <span className="flex-1 truncate">{categoryGroupName(g.id)}</span>
                  {total > 0 && <span className="text-xs text-subtle">{total}</span>}
                </button>
                {expanded &&
                  g.subs.map((sub) => {
                    const r: RangeRef = { kind: 'category', gc: sub }
                    const s = SUBCATEGORIES[sub]
                    return (
                      <Item
                        key={sub}
                        indent
                        label={categoryName(sub)}
                        hint={sub}
                        dot={CATEGORY_COLORS[s.col]?.color}
                        count={counts.byGc.get(sub) ?? 0}
                        showZero
                        active={isActive(r)}
                        onClick={() => go(r)}
                      />
                    )
                  })}
              </div>
            )
          })}
        </Group>

        <Group id="browse.blocks" title={t('browse.groups.blocks')}>
          <div className="px-2 pb-1.5">
            <div className="relative flex items-center">
              <Search size={12} className="pointer-events-none absolute left-2 text-subtle" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                onKeyDown={(e) => {
                  keepTypingKeys(e)
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    focusTabBlock()
                  }
                }}
                aria-label={t('browse.filterBlocks')}
                placeholder={t('browse.filterBlocks')}
                className="input-base pl-6 pr-6"
              />
              {filter && (
                <button type="button" className="absolute right-1.5 text-subtle hover:text-fg" onClick={() => setFilter('')} aria-label={t('browse.clearFilter')}>
                  <X size={12} />
                </button>
              )}
            </div>
            <Checkbox className="mt-1.5" checked={onlyUsed} onChange={setOnlyUsed} label={t('browse.onlyUsedBlocks')} />
          </div>
          <div
            ref={blocksRef}
            role="group"
            aria-label={t('browse.groups.blocks')}
            onKeyDown={onBlocksKeyDown}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusBlock(null)
            }}
          >
            {blocks.map((b) => {
              const r: RangeRef = { kind: 'block', name: b.name }
              return (
                <Item
                  key={b.name}
                  label={b.name}
                  count={counts.byBlock.get(b.name)}
                  active={isActive(r)}
                  onClick={() => go(r)}
                  muted={!counts.byBlock.has(b.name)}
                  tabIndex={b.name === tabBlock ? 0 : -1}
                  onFocus={() => setFocusBlock(b.name)}
                />
              )
            })}
          </div>
          {blocks.length === 0 && <p className="px-3 py-2 text-xs text-subtle">{t('browse.noBlockMatch', { filter })}</p>}
        </Group>
      </div>
    </div>
  )
}

/** A section of the panel; its header stays in view while its list scrolls by. */
function Group({
  id,
  title,
  collapsible,
  children
}: {
  /** Remembers whether the group is open. */
  id: string
  title: string
  collapsible?: boolean
  children: React.ReactNode
}): React.ReactElement {
  return (
    <Section id={id} title={title} collapsible={collapsible} sticky flush>
      <div className="px-1.5 pb-2">{children}</div>
    </Section>
  )
}

function Item({
  label,
  count,
  active,
  onClick,
  icon: Icon,
  indent,
  hint,
  dot,
  muted,
  showZero,
  tabIndex,
  onFocus
}: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
  icon?: React.ComponentType<{ size?: number; className?: string }>
  indent?: boolean
  hint?: string
  dot?: string
  muted?: boolean
  /** Show a count of 0 (faint) instead of no count. */
  showZero?: boolean
  /** For lists that are a single tab stop. */
  tabIndex?: number
  onFocus?: () => void
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      onFocus={onFocus}
      tabIndex={tabIndex}
      aria-current={active}
      className={cn(
        'flex h-7 w-full items-center gap-2 rounded px-2 text-left text-sm transition-colors',
        indent && 'pl-7',
        active ? 'bg-accent/15 text-accent' : muted ? 'text-muted hover:bg-hover hover:text-fg' : 'text-fg hover:bg-hover'
      )}
    >
      {Icon && <Icon size={14} className={active ? 'text-accent' : 'text-subtle'} />}
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: dot }} />}
      <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
        <span className="truncate">{label}</span>
        {hint && <span className="shrink-0 font-mono text-2xs text-subtle">{hint}</span>}
      </span>
      {count !== undefined && (count > 0 || showZero) && (
        <span className={cn('text-xs', active ? 'text-accent' : count > 0 ? 'text-subtle' : 'text-subtle/50')}>{formatNumber(count)}</span>
      )}
    </button>
  )
}
