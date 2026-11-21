import { Fragment, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, ChevronDown, CircleDashed, CircleDot, Download, GitBranch, Hash, LayoutGrid, Ligature, MoreHorizontal, Plus, Search, Sparkles, SquareDashed, Trash2, Type, Wand2, X } from 'lucide-react'
import { openDialog } from '../../app/dialogs'
import { runCommand } from '../../app/commands'
import { useDocStore } from '../../stores/doc-store'
import { isPairRange, useUIStore, type CommonSort, type RangeRef } from '../../stores/ui-store'
import { usePairSelectionStore, useSelectionStore } from '../../stores/selection-store'
import { filterKeys, filterPairs, useRangeKeys, useUnicodeDb } from '../../hooks/doc'
import { BROWSABLE_BLOCKS, CATEGORY_GROUPS, findBlock } from '../../core/unicode'
import { categoryGroupName, categoryName } from '../../lib/category-names'
import { codePointToKey, formatKey, keyToDisplayChars, parseExplicitKey, isLigatureKey } from '../../core/unicode-keys'
import { inheritingPairs, pairKern, pairSides } from '../../core/kerning'
import { t, Trans, useTranslation } from '../../i18n'
import { GlyphGrid, GLYPH_ITEMS } from './GlyphGrid'
import { COMMON_ITEMS, PAIR_ITEMS } from './PairSlot'
import { detectedFirst, useKernSuggestions } from '../../app/kern-suggestions'
import { Button, IconButton } from '../ui/Button'
import { DropdownMenu, type MenuItem } from '../ui/Menu'
import { focusFallback, keepTypingKeys } from '../ui/focus'
import { cn } from '../../lib/cn'
import { addPairFromText, applySuggestions, copyPairs, removePairs, setPairValues } from '../../app/kerning'
import {
  copyCharacters,
  copyHex,
  createMissing,
  deleteKeys,
  exportArtboardTemplate,
  useViewStore
} from '../../app/actions'

export function rangeTitle(range: RangeRef): { title: string; tag: string } {
  switch (range.kind) {
    case 'glyphs':
      return { title: t('viewport.titles.myGlyphs'), tag: t('viewport.tags.font') }
    case 'ligatures':
      return { title: t('viewport.titles.ligatures'), tag: t('viewport.tags.font') }
    case 'kerning':
      return { title: t('viewport.titles.kerning'), tag: t('viewport.tags.font') }
    case 'common':
      return {
        title:
          range.group === 'all'
            ? t('viewport.titles.commonPairs')
            : t('viewport.titles.commonPairsGroup', { group: t(`kerning.commonGroups.${range.group}.name`) }),
        tag: t('viewport.tags.kerning')
      }
    case 'detected':
      return { title: t('viewport.titles.detected'), tag: t('viewport.tags.kerning') }
    case 'all':
      return { title: t('viewport.titles.allCharacters'), tag: t('viewport.tags.unicode') }
    case 'block': {
      const b = BROWSABLE_BLOCKS.find((x) => x.name === range.name)
      return { title: range.name, tag: b ? `${formatKey(codePointToKey(b.start))} – ${formatKey(codePointToKey(b.end))}` : t('viewport.tags.block') }
    }
    case 'category': {
      const group = CATEGORY_GROUPS.find((g) => g.subs.includes(range.gc))
      return {
        title: group ? t('viewport.titles.category', { group: categoryGroupName(group.id), name: categoryName(range.gc) }) : categoryName(range.gc),
        tag: t('viewport.tags.category', { gc: range.gc })
      }
    }
  }
}

export function Viewport(): React.ReactElement {
  const { t } = useTranslation()
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const docId = useDocStore((s) => s.docId)
  const range = useUIStore((s) => s.range)
  const searchText = useUIStore((s) => s.searchText)
  const relatives = useUIStore((s) => s.searchRelatives)
  const existsOnly = useUIStore((s) => s.searchExists)
  const pairs = isPairRange(range)
  const detected = range.kind === 'detected'
  const common = range.kind === 'common'
  const todoOnly = useUIStore((s) => s.searchTodo) && common
  const commonSort = useUIStore((s) => s.commonSort)
  // "Detected first": the suggestions once measured (until then, the list order).
  const sortBy = useKernSuggestions((s) => (common && commonSort === 'detected' && s.ready && s.docId === docId ? s.map : null))
  const kerning = useDocStore((s) => s.data!.kerning)
  const inherit = useDocStore((s) => s.data!.inheritKerning)
  const glyphSelCount = useSelectionStore((s) => s.keys.length)
  const pairSelCount = usePairSelectionStore((s) => s.keys.length)
  const selCount = pairs ? pairSelCount : glyphSelCount
  const dbLoaded = useUnicodeDb()
  // Deferred so typing stays responsive. Another font (tab) is filtered with its own search
  // right away, not for one render with the search of the tab left.
  const typed = useMemo(() => ({ docId, text: searchText }), [docId, searchText])
  const deferred = useDeferredValue(typed)
  const deferredText = deferred.docId === docId ? deferred.text : searchText
  const base = useRangeKeys(range)

  const keys = useMemo(
    () => {
      if (!pairs) return filterKeys(base, glyphs, { text: deferredText, relatives, exists: existsOnly })
      const found = filterPairs(base, glyphs, { text: deferredText, exists: existsOnly })
      // "To do": pairs with no kerning yet (no value of their own, none inherited, not at 0).
      const todo = todoOnly ? found.filter((k) => pairKern(kerning, k, inherit).state === 'none') : found
      return sortBy ? detectedFirst(todo, sortBy, kerning, inherit) : todo
    },
    // Name search depends on the lazily loaded Unicode names; "To do" and "Detected first" on the pairs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, glyphs, deferredText, relatives, existsOnly, dbLoaded, pairs, todoOnly, sortBy, todoOnly || sortBy ? kerning : null, inherit]
  )

  // Progress through a common list: kerned, at 0, inherited, out of the whole list.
  const progress = useMemo(() => {
    if (!common) return null
    const n = { kerned: 0, zero: 0, inherited: 0, none: 0 }
    for (const k of base) n[pairKern(kerning, k, inherit).state]++
    return n
  }, [common, base, kerning, inherit])

  // The Kerning view: how many more pairs of the font's glyphs inherit a value.
  const inheritedCount = useMemo(() => {
    if (range.kind !== 'kerning' || !inherit) return 0
    let n = 0
    for (const keys of inheritingPairs(kerning, glyphs.keys()).values()) n += keys.length
    return n
  }, [range.kind, inherit, kerning, glyphs])

  useEffect(() => {
    useViewStore.setState({ keys })
  }, [keys])

  // Glyphs that exist; pairs whose glyphs both exist (the others are not exported).
  const existingInView = useMemo(
    () => keys.reduce((n, k) => n + ((pairs ? pairSides(k).every((g) => glyphs.has(g)) : glyphs.has(k)) ? 1 : 0), 0),
    [keys, glyphs, pairs]
  )
  const { title, tag } = rangeTitle(range)
  const searching = deferredText.trim().length > 0 || existsOnly || todoOnly
  const sel = (): string[] => useSelectionStore.getState().keys

  // The line under the title: its parts, joined with a separator.
  const n = <span className="text-fg" />
  const status: React.ReactNode[] = []
  if (progress) {
    status.push(
      <Trans
        i18nKey="viewport.status.progress"
        values={{ kerned: progress.kerned, zero: progress.zero, inherited: progress.inherited, none: progress.none, count: base.length }}
        components={{ n }}
      />
    )
  } else if (detected) {
    status.push(<Trans i18nKey="viewport.status.detected" values={{ count: keys.length }} components={{ n }} />)
  } else if (pairs) {
    status.push(<Trans i18nKey="viewport.status.pairs" values={{ count: keys.length }} components={{ n }} />)
    if (existingInView < keys.length) status.push(t('viewport.status.withGlyphMissing', { count: keys.length - existingInView }))
    if (inheritedCount > 0) status.push(t('viewport.status.moreInherited', { count: inheritedCount }))
  } else if (range.kind !== 'glyphs' && range.kind !== 'ligatures') {
    status.push(<Trans i18nKey="viewport.status.glyphsOfSlots" values={{ count: existingInView, slots: keys.length }} components={{ n }} />)
  } else {
    status.push(<Trans i18nKey="viewport.status.glyphs" values={{ count: existingInView }} components={{ n }} />)
  }
  if (searching) status.push(progress ? t('viewport.status.shown', { count: keys.length }) : t('viewport.status.filteredFrom', { count: base.length }))
  if (selCount > 0) status.push(<Trans i18nKey="viewport.status.selected" values={{ count: selCount }} components={{ s: <span className="text-accent" /> }} />)

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-bg">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-semibold text-fg">{title}</h1>
            <span className="shrink-0 rounded bg-hover px-1.5 py-px font-mono text-2xs text-muted">{tag}</span>
          </div>
          <div className="mt-0.5 text-xs text-muted">
            {status.map((s, i) => (
              <Fragment key={i}>
                {i > 0 && t('viewport.status.separator')}
                {s}
              </Fragment>
            ))}
          </div>
        </div>
        {pairs ? (
          <PairActions keys={keys} add={range.kind === 'kerning'} apply={detected} />
        ) : (
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button icon={Plus} tip={t('viewport.actions.createTip')} disabled={!selCount} onClick={() => void createMissing(sel())}>
            {t('viewport.actions.create')}
          </Button>
          <DropdownMenu
            align="end"
            minWidth={230}
            items={() => [
              { header: selCount ? t('viewport.actions.selectionCount', { count: selCount }) : t('viewport.actions.selection') },
              { label: t('viewport.actions.copyCharacters'), icon: Type, disabled: !selCount, onSelect: () => void copyCharacters(sel()) },
              { label: t('viewport.actions.copyUnicodeValues'), icon: Hash, disabled: !selCount, onSelect: () => void copyHex(sel()) },
              { label: t('viewport.actions.artboardTemplate'), icon: LayoutGrid, disabled: !selCount, onSelect: () => void exportArtboardTemplate(sel()) },
              'separator',
              { header: t('viewport.actions.everythingInView', { count: keys.length }) },
              { label: t('viewport.actions.selectAll'), shortcut: 'Ctrl+A', onSelect: () => useSelectionStore.getState().setSelection(keys) },
              { label: t('viewport.actions.createAllMissing'), icon: Plus, onSelect: () => void createMissing(keys) },
              { label: t('viewport.actions.copyCharacters'), icon: Type, onSelect: () => void copyCharacters(keys) },
              { label: t('viewport.actions.copyUnicodeValues'), icon: Hash, onSelect: () => void copyHex(keys) },
              { label: t('viewport.actions.artboardTemplate'), icon: LayoutGrid, onSelect: () => void exportArtboardTemplate(keys) },
              'separator',
              { label: t('viewport.actions.deleteAllInView'), icon: Trash2, danger: true, disabled: !existingInView, onSelect: () => deleteKeys(keys) }
            ]}
            trigger={({ toggle, open }) => <IconButton icon={MoreHorizontal} tip={t('viewport.actions.more')} active={open} onClick={toggle} variant="default" />}
          />
        </div>
        )}
      </div>

      <SearchBar resultCount={searching ? keys.length : null} pairs={pairs} common={common} detected={detected} />

      {keys.length === 0 ? (
        <EmptyView range={range} searchText={deferredText} existsOnly={existsOnly} todoOnly={todoOnly} />
      ) : (
        <GlyphGrid
          keys={keys}
          resetKey={`${JSON.stringify(range)}|${deferredText}|${relatives}|${existsOnly}|${todoOnly}|${common && commonSort}`}
          settled={deferredText === searchText}
          // Ghosts show their rank in the common lists and in Detected.
          items={common || detected ? COMMON_ITEMS : pairs ? PAIR_ITEMS : GLYPH_ITEMS}
        />
      )}
    </main>
  )
}

/**
 * The pair views' header actions: add a pair by typing it (the Kerning view), apply the
 * suggested values (Detected), and actions on pairs.
 */
function PairActions({ keys, add: canAdd, apply }: { keys: string[]; add: boolean; apply: boolean }): React.ReactElement {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const selCount = usePairSelectionStore((s) => s.keys.length)
  const sel = (): string[] => usePairSelectionStore.getState().keys
  const add = (): void => {
    if (addPairFromText(text)) setText('')
  }
  return (
    <div className="ml-auto flex shrink-0 items-center gap-1">
      {canAdd && (
        <>
          <input
            type="text"
            value={text}
            spellCheck={false}
            placeholder={t('viewport.actions.newPairPlaceholder')}
            aria-label={t('viewport.actions.newPairLabel')}
            data-tip={t('viewport.actions.newPairTip')}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add()
              }
              keepTypingKeys(e)
            }}
            className="input-base h-6 w-[150px]"
          />
          <Button icon={Plus} onClick={add} disabled={!text.trim()}>
            {t('viewport.actions.addPair')}
          </Button>
        </>
      )}
      {apply && (
        <Button
          icon={Wand2}
          disabled={!keys.length}
          tip={t('viewport.actions.applyAllTip', { count: keys.length })}
          onClick={() => applySuggestions(keys)}
        >
          {t('viewport.actions.applyAll')}
        </Button>
      )}
      <DropdownMenu
        align="end"
        minWidth={230}
        items={(): MenuItem[] => [
          { header: selCount ? t('viewport.actions.selectionCount', { count: selCount }) : t('viewport.actions.selection') },
          ...(apply ? [{ label: t('viewport.actions.applySuggestions'), icon: Wand2, disabled: !selCount, onSelect: () => void applySuggestions(sel()) }] : []),
          // Detected: a pair that needs no kerning leaves the list.
          { label: t('viewport.actions.noKerning'), disabled: !selCount, onSelect: () => setPairValues(sel(), 0) },
          { label: t('viewport.actions.copyAsCharacters'), icon: Type, disabled: !selCount, onSelect: () => void copyPairs(sel()) },
          { label: t('viewport.actions.copyUnicodeValues'), icon: Hash, disabled: !selCount, onSelect: () => void copyPairs(sel(), true) },
          'separator',
          { header: t('viewport.actions.everythingInView', { count: keys.length }) },
          { label: t('viewport.actions.selectAll'), shortcut: 'Ctrl+A', onSelect: () => usePairSelectionStore.getState().setSelection(keys) },
          { label: t('viewport.actions.copyAsCharacters'), icon: Type, onSelect: () => void copyPairs(keys) },
          // Detected pairs have no values to remove.
          ...(apply
            ? []
            : [
                'separator' as const,
                // In a common list, only the pairs with a value of their own are removed.
                {
                  label: canAdd ? t('viewport.actions.removeAllPairs') : t('viewport.actions.removePairValues'),
                  icon: Trash2,
                  danger: true,
                  disabled: !keys.length,
                  onSelect: () => removePairs(keys)
                }
              ])
        ]}
        trigger={({ toggle, open }) => <IconButton icon={MoreHorizontal} tip={t('viewport.actions.more')} active={open} onClick={toggle} variant="default" />}
      />
    </div>
  )
}

function SearchBar({ resultCount, pairs, common, detected }: { resultCount: number | null; pairs: boolean; common: boolean; detected: boolean }): React.ReactElement {
  const text = useUIStore((s) => s.searchText)
  const relatives = useUIStore((s) => s.searchRelatives)
  const existsOnly = useUIStore((s) => s.searchExists)
  const todo = useUIStore((s) => s.searchTodo)
  const rare = useUIStore((s) => s.searchRare)
  const ui = useUIStore.getState()
  const { t } = useTranslation()
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-line bg-panel/60 px-4 py-1.5">
      <div className="relative flex min-w-0 max-w-[460px] flex-1 items-center">
        <Search size={13} className="pointer-events-none absolute left-2 text-subtle" />
        <input
          id="glyph-search"
          type="text"
          value={text}
          spellCheck={false}
          placeholder={pairs ? t('viewport.search.pairsPlaceholder') : t('viewport.search.glyphsPlaceholder')}
          onChange={(e) => ui.setSearchText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              ui.setSearchText('')
              // Back to the grid; after a search without matches it mounts a few frames later.
              focusFallback({ force: true, frames: 10, cancel: () => !!useUIStore.getState().searchText })
            }
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
              ;(document.querySelector('[role="grid"]') as HTMLElement | null)?.focus()
            }
            keepTypingKeys(e)
          }}
          className="input-base h-7 pl-7 pr-7"
        />
        {text && (
          <button
            type="button"
            className="absolute right-1.5 text-subtle hover:text-fg"
            onClick={() => {
              ui.setSearchText('')
              // The button goes with the text: focus stays in the search field, not on the
              // page (where Delete would act on the glyphs).
              document.getElementById('glyph-search')?.focus()
            }}
            aria-label={t('viewport.search.clear')}
          >
            <X size={13} />
          </button>
        )}
      </div>
      {!pairs && (
        <ToggleChip active={relatives} onClick={ui.toggleSearchRelatives} icon={GitBranch} tip={t('viewport.search.relativesTip')}>
          {t('viewport.search.relatives')}
        </ToggleChip>
      )}
      <ToggleChip
        active={existsOnly}
        onClick={ui.toggleSearchExists}
        icon={CircleDot}
        tip={pairs ? t('viewport.search.existingPairsTip') : t('viewport.search.existingGlyphsTip')}
      >
        {t('viewport.search.existingOnly')}
      </ToggleChip>
      {common && (
        <ToggleChip active={todo} onClick={ui.toggleSearchTodo} icon={CircleDashed} tip={t('viewport.search.todoTip')}>
          {t('viewport.search.todo')}
        </ToggleChip>
      )}
      {detected && (
        <ToggleChip active={rare} onClick={ui.toggleSearchRare} icon={Sparkles} tip={t('viewport.search.rareTip')}>
          {t('viewport.search.rare')}
        </ToggleChip>
      )}
      {common && <SortMenu />}
      {resultCount !== null && <span className="ml-1 text-xs text-muted">{t('viewport.search.results', { count: resultCount })}</span>}
    </div>
  )
}

/** The orders of the common pairs views; labels in `viewport.sort.<id>`. */
const SORTS: readonly CommonSort[] = ['rank', 'detected']

/** The common pairs views: the order of the pairs. */
function SortMenu(): React.ReactElement {
  const { t } = useTranslation()
  const sort = useUIStore((s) => s.commonSort)
  const current = SORTS.includes(sort) ? sort : SORTS[0]
  const label = t(`viewport.sort.${current}.label`)
  return (
    <DropdownMenu
      minWidth={180}
      items={() => [
        { header: t('viewport.sort.header') },
        ...SORTS.map((id) => ({
          label: t(`viewport.sort.${id}.label`),
          hint: t(`viewport.sort.${id}.hint`),
          checked: id === sort,
          onSelect: () => useUIStore.getState().setCommonSort(id)
        }))
      ]}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          data-tip={t('viewport.sort.tip')}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t('viewport.sort.label', { order: label })}
          onClick={toggle}
          className={cn(
            'flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-xs transition-colors',
            open ? 'border-line-strong text-fg' : 'border-line text-muted hover:border-line-strong hover:text-fg'
          )}
        >
          <ArrowDownUp size={12} />
          {label}
          <ChevronDown size={12} className="text-subtle" />
        </button>
      )}
    />
  )
}

function ToggleChip({
  active,
  onClick,
  icon: Icon,
  tip,
  children
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ size?: number }>
  tip: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <button
      type="button"
      data-tip={tip}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-xs transition-colors',
        active ? 'border-accent/50 bg-accent/15 text-accent' : 'border-line text-muted hover:border-line-strong hover:text-fg'
      )}
    >
      <Icon size={12} />
      {children}
    </button>
  )
}

function EmptyView({ range, searchText, existsOnly, todoOnly }: { range: RangeRef; searchText: string; existsOnly: boolean; todoOnly: boolean }): React.ReactElement {
  const ui = useUIStore.getState()
  const jumpKey = searchText.trim() ? parseExplicitKey(searchText.trim()) : null
  const jumpBlock = jumpKey && !isLigatureKey(jumpKey) ? findBlock(parseInt(jumpKey, 16)) : undefined
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const docId = useDocStore((s) => s.docId)
  const measured = useKernSuggestions((s) => s.ready && s.docId === docId)
  const rare = useUIStore((s) => s.searchRare)
  const pairs = isPairRange(range)
  const { t } = useTranslation()
  // i18n-ignore: a Unicode block name (data)
  const basicLatin = 'Basic Latin'

  let message: string = t('viewport.empty.nothing')
  if (searchText.trim()) message = t('viewport.empty.noMatch', { text: searchText.trim() })
  else if (range.kind === 'detected')
    message = !measured
      ? t('viewport.empty.measuring')
      : glyphs.size === 0
        ? t('viewport.empty.detectedNoGlyphs')
        : rare
        ? t('viewport.empty.detectedNothingRare')
        : t('viewport.empty.detectedNothing')
  else if (todoOnly) message = t('viewport.empty.todoDone')
  else if (existsOnly) message = isPairRange(range) ? t('viewport.empty.noExistingPairs') : t('viewport.empty.noExistingGlyphs')
  else if (range.kind === 'glyphs') message = t('viewport.empty.noGlyphs')
  else if (range.kind === 'ligatures') message = t('viewport.empty.noLigatures')
  else if (range.kind === 'kerning') message = t('viewport.empty.noPairs')

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <SquareDashed size={40} strokeWidth={1.25} className="text-subtle" />
      <p className="max-w-sm text-sm text-muted">{message}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {jumpKey && jumpBlock && (
          <Button
            variant="primary"
            onClick={() => {
              ui.setSearchText('')
              if (!useDocStore.getState().data?.glyphs.has(jumpKey)) useUIStore.setState({ searchExists: false })
              // Back returns to the current range with the current selection.
              ui.setRange({ kind: 'block', name: jumpBlock.name })
              useSelectionStore.getState().setSelection([jumpKey])
              ui.reveal(jumpKey)
            }}
          >
            {t('viewport.empty.goTo', { chars: keyToDisplayChars(jumpKey), code: formatKey(jumpKey), block: jumpBlock.name })}
          </Button>
        )}
        {(searchText.trim() || existsOnly) && !pairs && range.kind !== 'all' && (
          <Button onClick={() => ui.setRange({ kind: 'all' })}>{t('viewport.empty.searchAllCharacters')}</Button>
        )}
        {searchText.trim() && pairs && !(range.kind === 'common' && range.group === 'all') && (
          <Button onClick={() => ui.setRange({ kind: 'common', group: 'all' })}>{t('viewport.empty.searchAllCommon')}</Button>
        )}
        {range.kind === 'detected' && measured && !rare && glyphs.size > 0 && !searchText.trim() && (
          <Button icon={Sparkles} onClick={ui.toggleSearchRare}>
            {t('viewport.empty.includeRare')}
          </Button>
        )}
        {range.kind === 'glyphs' && glyphs.size === 0 && !searchText && (
          <>
            <Button variant="primary" onClick={() => ui.setRange({ kind: 'block', name: basicLatin })}>
              {t('viewport.empty.browseBlock', { block: basicLatin })}
            </Button>
            <Button icon={Download} onClick={() => runCommand('file.importSvg')}>
              {t('viewport.empty.importSvgs')}
            </Button>
            <Button onClick={() => runCommand('file.importFont')}>{t('viewport.empty.importFont')}</Button>
          </>
        )}
        {range.kind === 'ligatures' && (
          <Button icon={Ligature} onClick={() => void openDialog('ligatures', {})}>
            {t('viewport.empty.findLigatures')}
          </Button>
        )}
      </div>
    </div>
  )
}
