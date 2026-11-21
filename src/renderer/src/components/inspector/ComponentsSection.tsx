import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ChevronsDownUp,
  ClipboardPaste,
  Component,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Search,
  Trash2,
  Wand2
} from 'lucide-react'

const LAYER_DRAG_TYPE = 'application/x-mkfont-layer'
import type { Layer } from '../../types/font'
import { useDocStore, transact } from '../../stores/doc-store'
import { useInspectorStore } from '../../stores/inspector-store'
import { Section } from '../ui/Section'
import { IconButton } from '../ui/Button'
import { DropdownMenu } from '../ui/Menu'
import { GlyphThumb } from '../common/GlyphThumb'
import { LayerFields, commonLayerValues, type LayerValues } from './LayerFields'
import { addLayer, layerGroupOf, moveLayer, removeLayer, removeMatchingLayers, setLayerValues, setMatchingLayers, type LayerMatch } from '../../core/ops'
import { getComposition } from '../../core/unicode'
import { LAYER_LIMIT } from '../../core/model'
import { refToKey, keyToDisplayChars } from '../../core/unicode-keys'
import type { LayerComputed } from '../../core/compute'
import { addComponentsFromPicker, bootstrapKeys, setComponentsVisible } from '../../app/actions'
import { hasClipboardGlyphs, pasteComponents } from '../../app/clipboard'
import { fieldLabel } from './options'
import { cn } from '../../lib/cn'
import type { NumberMeta } from '../ui/fields'
import { t, useTranslation } from '../../i18n'

function layerLabel(l: Pick<Layer, 'characterRef' | 'customId'>): string {
  return l.characterRef || t('inspector.componentsSection.empty')
}

function PasteComponentsMenu(): React.ReactElement {
  const { t } = useTranslation()
  return (
    <DropdownMenu
      align="end"
      minWidth={220}
      items={() => [
        { label: t('inspector.componentsSection.replace'), disabled: !hasClipboardGlyphs(), onSelect: () => pasteComponents('replace') },
        { label: t('inspector.componentsSection.add'), disabled: !hasClipboardGlyphs(), onSelect: () => pasteComponents('add') },
        {
          label: t('inspector.componentsSection.copyTransforms'),
          hint: t('inspector.componentsSection.copyTransformsHint'),
          disabled: !hasClipboardGlyphs(),
          onSelect: () => pasteComponents('transforms')
        }
      ]}
      trigger={({ toggle, open }) => <IconButton icon={ClipboardPaste} size="xs" tip={t('inspector.componentsSection.pasteTip')} active={open} onClick={toggle} />}
    />
  )
}

// ---- Single glyph ----

export function ComponentsSection({ unicode }: { unicode: string }): React.ReactElement | null {
  const layers = useDocStore((s) => s.data?.glyphs.get(unicode)?.variants[0].layers)
  const computed = useDocStore((s) => s.computed.get(unicode)?.[0])
  const { t } = useTranslation()
  if (!layers) return null
  const composable = !!getComposition(unicode)
  const full = layers.length >= LAYER_LIMIT

  const collapseAll = (): void => {
    transact(t('inspector.history.collapseComponents'), (d) => {
      for (const l of d.glyphs.get(unicode)?.variants[0].layers ?? []) l.expanded = false
    }, { history: false })
  }

  return (
    <Section
      id="inspector.components"
      title={t('inspector.components')}
      icon={Component}
      badge={layers.length || undefined}
      actions={
        <>
          <IconButton
            icon={Plus}
            size="xs"
            tip={t('inspector.componentsSection.addEmpty')}
            disabled={full}
            onClick={() =>
              transact(t('inspector.history.addComponent'), (d) => {
                addLayer(d, unicode, { expanded: true })
              })
            }
          />
          <IconButton icon={Search} size="xs" tip={t('inspector.componentsSection.searchAdd')} disabled={full} onClick={() => void addComponentsFromPicker([unicode])} />
          <IconButton icon={Wand2} size="xs" tip={composable ? t('inspector.componentsSection.decompose') : t('inspector.componentsSection.noDecomposition')} disabled={!composable} onClick={() => bootstrapKeys([unicode])} />
          <PasteComponentsMenu />
          <DropdownMenu
            align="end"
            items={[
              { label: t('inspector.componentsSection.showAll'), icon: Eye, onSelect: () => setComponentsVisible([unicode], true) },
              { label: t('inspector.componentsSection.hideAll'), icon: EyeOff, onSelect: () => setComponentsVisible([unicode], false) },
              { label: t('inspector.componentsSection.collapseAll'), icon: ChevronsDownUp, onSelect: collapseAll }
            ]}
            trigger={({ toggle, open }) => <IconButton icon={ChevronsDownUp} size="xs" tip={t('inspector.componentsSection.visibilityFolding')} active={open} onClick={toggle} />}
          />
        </>
      }
      flush
    >
      {layers.length === 0 ? (
        <p className="px-3 pb-3 text-xs leading-relaxed text-subtle">{t('inspector.componentsSection.none')}</p>
      ) : (
        <LayerList unicode={unicode} layers={layers} computed={computed?.layers} controlIndex={computed?.controlIndex ?? -1} />
      )}
    </Section>
  )
}

/** Row buttons that keep keyboard focus when their row moves or is removed. */
type RowControl = 'grip' | 'up' | 'down' | 'remove'

/**
 * The Move up / Move down buttons of each row. Hidden: the grip does it (drag it, or focus
 * it and use the arrow keys). Kept to bring them back if needed.
 */
const SHOW_MOVE_BUTTONS = false

/** The Components section header button: focus lands there when the last row goes away. */
function sectionHeader(from: HTMLElement): HTMLElement | null {
  return from.closest('section')?.querySelector<HTMLElement>('button[aria-expanded]') ?? null
}

/** Component rows with drag & drop reordering. */
function LayerList({
  unicode,
  layers,
  computed,
  controlIndex
}: {
  unicode: string
  layers: Layer[]
  computed: LayerComputed[] | undefined
  controlIndex: number
}): React.ReactElement {
  // Insertion point while dragging: 0 = before the first row … layers.length = after the last.
  const [dropAt, setDropAt] = useState<number | null>(null)
  const last = layers.length - 1
  const listRef = useRef<HTMLDivElement>(null)
  // Rows are keyed by position (components have no ids), so after a move or a removal the
  // focused button would belong to another component. Rows ask for the button to focus
  // instead, and it is focused once the list shows the new order.
  const focusRequest = useRef<{ index: number; control: RowControl } | null>(null)
  useLayoutEffect(() => {
    const req = focusRequest.current
    focusRequest.current = null
    const row = req ? listRef.current?.children[req.index] : undefined
    if (!req || !row) return
    // A move button disabled at either end of the list hands over to the other one.
    const order: RowControl[] =
      req.control === 'up' ? ['up', 'down', 'remove'] : req.control === 'down' ? ['down', 'up', 'remove'] : req.control === 'grip' ? ['grip', 'remove'] : ['remove']
    for (const c of order) {
      const el = row.querySelector<HTMLButtonElement>(`[data-row-control="${c}"]`)
      if (el && !el.disabled) {
        el.focus()
        return
      }
    }
  }, [layers])
  const requestFocus = useCallback((index: number, control: RowControl): void => {
    focusRequest.current = { index, control }
  }, [])
  const { t } = useTranslation()
  return (
    <div
      ref={listRef}
      role="list"
      aria-label={t('inspector.components')}
      className="flex flex-col pb-1.5"
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropAt(null)
      }}
      onDrop={(e) => {
        const at = dropAt
        setDropAt(null)
        const raw = e.dataTransfer.getData(LAYER_DRAG_TYPE)
        const from = Number(raw)
        if (at === null || raw === '' || !Number.isInteger(from)) return
        e.preventDefault()
        // The insertion point counts the dragged row; its index after removal does not.
        const to = from < at ? at - 1 : at
        if (to !== from) transact(t('inspector.history.reorderComponents'), (d) => moveLayer(d, unicode, from, to))
      }}
    >
      {layers.map((l, i) => (
        <div
          key={i}
          role="listitem"
          className={cn(
            'border-t-2 border-transparent',
            dropAt === i && 'border-t-accent',
            i === last && 'border-b-2',
            i === last && dropAt === layers.length && 'border-b-accent'
          )}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes(LAYER_DRAG_TYPE)) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            // Upper half: before this row; lower half: after it.
            const r = e.currentTarget.getBoundingClientRect()
            setDropAt(e.clientY > r.top + r.height / 2 ? i + 1 : i)
          }}
        >
          <LayerRow unicode={unicode} index={i} layer={l} lc={computed?.[i]} count={layers.length} isControl={controlIndex === i} requestFocus={requestFocus} />
        </div>
      ))}
    </div>
  )
}

function LayerRow({
  unicode,
  index,
  layer,
  lc,
  count,
  isControl,
  requestFocus
}: {
  unicode: string
  index: number
  layer: Layer
  lc: LayerComputed | undefined
  count: number
  isControl: boolean
  /** Focus a row control once the list has re-rendered. */
  requestFocus: (index: number, control: RowControl) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const focus = useInspectorStore((s) => s.layerFocus)
  const setFocus = useInspectorStore((s) => s.setLayerFocus)
  const focused = focus?.key === unicode && focus.index === index
  // Selected in the glyph view; its fields follow a drag of its frame there.
  const selected = useInspectorStore((s) => s.layerSelection?.key === unicode && s.layerSelection.index === index)
  const draft = useInspectorStore((s) => (s.layerDraft?.key === unicode && s.layerDraft.index === index ? s.layerDraft.values : null))
  const refKey = lc?.refKey ?? refToKey(layer.characterRef)
  const missing = !!layer.characterRef && !lc?.exists
  const label = layerLabel(layer)

  const toggleExpanded = (): void => {
    transact(t('inspector.history.toggleComponent'), (d) => {
      const l = d.glyphs.get(unicode)?.variants[0].layers[index]
      if (l) l.expanded = !l.expanded
    }, { history: false })
  }
  const update = (values: Partial<Layer>, meta: NumberMeta & { field: string }): void => {
    transact(t('inspector.history.setFieldOfComponent', { field: fieldLabel(meta.field), component: label }), (d) => setLayerValues(d, unicode, index, values), {
      mergeKey: meta.interactive ? `lyr:${unicode}:${index}:${meta.field}` : undefined
    })
  }
  const move = (to: number, control: RowControl): void => {
    // Focus follows the moved component to its new row.
    if (transact(t('inspector.history.moveComponent'), (d) => moveLayer(d, unicode, index, to))) requestFocus(to, control)
  }
  const remove = (e: React.MouseEvent<HTMLElement>): void => {
    // Removing the only component replaces the list: focus goes to the section header.
    const header = count === 1 ? sectionHeader(e.currentTarget) : null
    if (!transact(t('inspector.history.removeComponent', { component: label }), (d) => removeLayer(d, unicode, index))) return
    if (header) header.focus()
    // Else the Remove button of the next component, or of the previous one when this row was the last.
    else requestFocus(Math.min(index, count - 2), 'remove')
  }
  const highlight = (): void => {
    if (!focused) setFocus({ key: unicode, index })
  }
  // The preview highlights the component under the pointer, else the one holding keyboard
  // focus. Focus a click left behind does not keep it once the pointer is gone.
  const highlightKeyboardRow = (): void => {
    const row = document.querySelector(':focus-visible')?.closest<HTMLElement>('[data-layer-row]')
    setFocus(row ? { key: unicode, index: Number(row.dataset.layerRow) } : null)
  }

  return (
    <div
      data-layer-row={index}
      aria-current={selected || undefined}
      className={cn('border-t border-line/60 first:border-t-0', focused && 'bg-accent/5', selected && 'bg-accent/10 shadow-[inset_2px_0_0_rgb(var(--c-accent))]')}
      onMouseEnter={highlight}
      onMouseLeave={highlightKeyboardRow}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches(':focus-visible')) highlight()
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null) && !e.currentTarget.matches(':hover')) setFocus(null)
      }}
    >
      <div className={cn('group flex h-9 items-center gap-1.5 pl-0.5 pr-1.5', !layer.doExport && 'opacity-55')}>
        <button
          type="button"
          draggable={count > 1}
          onDragStart={(e) => {
            e.dataTransfer.setData(LAYER_DRAG_TYPE, String(index))
            e.dataTransfer.effectAllowed = 'move'
          }}
          // Keyboard: the arrow keys move the component; focus stays on its grip.
          onKeyDown={(e) => {
            if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
            const to = e.key === 'ArrowUp' ? index - 1 : e.key === 'ArrowDown' ? index + 1 : null
            if (to === null) return
            e.preventDefault()
            if (to >= 0 && to < count) move(to, 'grip')
          }}
          disabled={count < 2}
          data-row-control="grip"
          aria-label={t('inspector.componentsSection.move', { component: label })}
          aria-description={t('inspector.componentsSection.moveDescription')}
          aria-keyshortcuts="ArrowUp ArrowDown"
          data-tip={count > 1 ? t('inspector.componentsSection.moveTip') : undefined}
          className={cn('flex h-6 w-3.5 items-center justify-center rounded-sm text-subtle/60', count > 1 ? 'cursor-grab hover:text-fg' : 'invisible')}
        >
          <GripVertical size={12} />
        </button>
        <button
          type="button"
          onClick={toggleExpanded}
          className="text-subtle hover:text-fg"
          aria-expanded={layer.expanded}
          aria-label={t('inspector.componentsSection.expand', { component: label })}
        >
          <ChevronRight size={12} className={cn('transition-transform', layer.expanded && 'rotate-90')} />
        </button>
        <GlyphThumb unicode={refKey} size={26} />
        <button type="button" className="min-w-0 flex-1 text-left" onClick={toggleExpanded} aria-expanded={layer.expanded}>
          <div className={cn('truncate text-sm text-fg', !layer.doExport && 'line-through')}>
            {layer.customId ? <b>{layer.customId}</b> : null} {label}
          </div>
          <div className="flex gap-1">
            {isControl && (
              <Badge className="bg-emphasis/15 text-emphasis" tip={t('inspector.componentsSection.controlTip')}>
                {t('inspector.componentsSection.control')}
              </Badge>
            )}
            {layer.isControlLayer && !isControl && (
              <Badge className="bg-warn/15 text-warn" tip={t('inspector.componentsSection.controlInactiveTip')}>
                {t('inspector.componentsSection.controlInactive')}
              </Badge>
            )}
            {lc?.circular && (
              <Badge className="bg-danger/15 text-danger" tip={t('inspector.componentsSection.circularTip')}>
                {t('inspector.componentsSection.circular')}
              </Badge>
            )}
            {missing && !lc?.circular && (
              <Badge className="bg-warn/15 text-warn" tip={t('inspector.componentsSection.missingTip')}>
                {t('inspector.componentsSection.missing')}
              </Badge>
            )}
            {layer.inverted && <Badge className="bg-hover text-muted">{t('inspector.componentsSection.inverted')}</Badge>}
          </div>
        </button>
        <div className="flex items-center opacity-60 group-focus-within:opacity-100 group-hover:opacity-100">
          <IconButton
            icon={layer.doExport ? Eye : EyeOff}
            size="xs"
            tip={layer.doExport ? t('inspector.componentsSection.hide') : t('inspector.componentsSection.show')}
            onClick={() => update({ doExport: !layer.doExport }, { interactive: false, field: 'doExport' })}
          />
          {SHOW_MOVE_BUTTONS && (
            <>
              <IconButton icon={ArrowUp} size="xs" tip={t('inspector.componentsSection.moveUp')} data-row-control="up" disabled={index === 0} onClick={() => move(index - 1, 'up')} />
              <IconButton icon={ArrowDown} size="xs" tip={t('inspector.componentsSection.moveDown')} data-row-control="down" disabled={index === count - 1} onClick={() => move(index + 1, 'down')} />
            </>
          )}
          <IconButton icon={Trash2} size="xs" tip={t('inspector.componentsSection.remove')} data-row-control="remove" onClick={remove} />
        </div>
      </div>
      {layer.expanded && (
        <div className="px-3 pb-3">
          <LayerFields values={draft ? { ...layer, ...draft } : layer} onChange={update} />
        </div>
      )}
    </div>
  )
}

function Badge({ children, className, tip }: { children: React.ReactNode; className?: string; tip?: string }): React.ReactElement {
  return (
    <span data-tip={tip} className={cn('rounded px-1 text-[9px] font-semibold uppercase leading-[14px] tracking-wide', className)}>
      {children}
    </span>
  )
}

// ---- Multi selection: components grouped by custom id / character ----

interface LayerGroup {
  id: string
  match: LayerMatch
  label: string
  refKey: string | null
  layers: Layer[]
  glyphCount: number
}

export function MultiComponentsSection({ keys }: { keys: string[] }): React.ReactElement {
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const { t } = useTranslation()
  const groups = useMemo(() => {
    const map = new Map<string, LayerGroup>()
    for (const k of keys) {
      const g = glyphs.get(k)
      if (!g) continue
      const seenHere = new Set<string>()
      for (const l of g.variants[0].layers) {
        const { id, match } = layerGroupOf(l)
        let grp = map.get(id)
        if (!grp) {
          grp = {
            id,
            match,
            label: l.customId ? l.customId : l.characterRef || t('inspector.componentsSection.empty'),
            refKey: refToKey(l.characterRef),
            layers: [],
            glyphCount: 0
          }
          map.set(id, grp)
        }
        grp.layers.push(l)
        if (!seenHere.has(id)) {
          seenHere.add(id)
          grp.glyphCount++
        }
      }
    }
    return [...map.values()].sort((a, b) => b.glyphCount - a.glyphCount)
  }, [keys, glyphs, t])
  const existing = keys.filter((k) => glyphs.has(k))

  return (
    <Section
      id="inspector.components"
      title={t('inspector.components')}
      icon={Component}
      badge={groups.length || undefined}
      actions={
        <>
          <IconButton icon={Search} size="xs" tip={t('inspector.componentsSection.addToAll')} onClick={() => void addComponentsFromPicker(existing)} />
          <IconButton icon={Wand2} size="xs" tip={t('inspector.componentsSection.decomposeAll')} onClick={() => bootstrapKeys(keys)} />
          <PasteComponentsMenu />
          <IconButton icon={Eye} size="xs" tip={t('inspector.componentsSection.showAllComponents')} onClick={() => setComponentsVisible(existing, true)} />
          <IconButton icon={EyeOff} size="xs" tip={t('inspector.componentsSection.hideAllComponents')} onClick={() => setComponentsVisible(existing, false)} />
        </>
      }
      flush
    >
      {groups.length === 0 ? (
        <p className="px-3 pb-3 text-xs text-subtle">{t('inspector.componentsSection.noneInSelection')}</p>
      ) : (
        <div role="list" aria-label={t('inspector.components')} className="flex flex-col pb-1.5">
          {groups.map((g) => (
            <GroupRow key={g.id} group={g} keys={existing} total={existing.length} />
          ))}
        </div>
      )}
    </Section>
  )
}

function GroupRow({ group, keys, total }: { group: LayerGroup; keys: string[]; total: number }): React.ReactElement {
  const { t } = useTranslation()
  const values: LayerValues = useMemo(() => commonLayerValues(group.layers), [group.layers])
  const update = (v: Partial<Layer>, meta: NumberMeta & { field: string }): void => {
    transact(t('inspector.history.setFieldOfComponents', { field: fieldLabel(meta.field), component: group.label, count: group.glyphCount }), (d) => setMatchingLayers(d, keys, group.match, v), {
      mergeKey: meta.interactive ? `grp:${group.id}:${meta.field}` : undefined
    })
  }
  const remove = (e: React.MouseEvent<HTMLElement>): void => {
    // The row goes away: focus the Remove button of the next row, else of the previous one, else the section header.
    const row = e.currentTarget.closest('[role="listitem"]')
    const target =
      (row?.nextElementSibling ?? row?.previousElementSibling)?.querySelector<HTMLElement>('[data-row-control="remove"]') ?? sectionHeader(e.currentTarget)
    if (transact(t('inspector.history.removeComponents', { component: group.label, count: group.glyphCount }), (d) => removeMatchingLayers(d, keys, group.match))) target?.focus()
  }
  const expanded = values.expanded === true
  const toggle = (): void => {
    transact(t('inspector.history.toggleComponent'), (d) => setMatchingLayers(d, keys, group.match, { expanded: !expanded }), { history: false })
  }
  return (
    <div role="listitem" className="border-t border-line/60 first:border-t-0">
      <div className="group flex h-9 items-center gap-1.5 pl-2 pr-1.5">
        <button
          type="button"
          onClick={toggle}
          className="text-subtle hover:text-fg"
          aria-expanded={expanded}
          aria-label={t('inspector.componentsSection.expand', { component: group.label })}
        >
          <ChevronRight size={12} className={cn('transition-transform', expanded && 'rotate-90')} />
        </button>
        <GlyphThumb unicode={group.refKey} size={26} />
        <button type="button" className="min-w-0 flex-1 text-left" onClick={toggle} aria-expanded={expanded}>
          <div className="truncate text-sm text-fg">{group.match.customId ? <b>{group.label}</b> : keyToDisplayChars(group.refKey ?? '') || group.label}</div>
          <div className="text-2xs text-subtle">{t('inspector.componentsSection.inGlyphs', { n: group.glyphCount, count: total })}</div>
        </button>
        <IconButton icon={values.doExport === false ? EyeOff : Eye} size="xs" tip={t('inspector.componentsSection.toggleVisibility')} onClick={() => update({ doExport: values.doExport === false }, { interactive: false, field: 'doExport' })} />
        <IconButton icon={Trash2} size="xs" tip={t('inspector.componentsSection.removeFromAll')} data-row-control="remove" onClick={remove} />
      </div>
      {expanded && (
        <div className="px-3 pb-3">
          <LayerFields values={values} onChange={update} showReference={!!group.match.customId} />
        </div>
      )}
    </div>
  )
}
