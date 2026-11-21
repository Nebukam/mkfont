import { memo, useState } from 'react'
import { AlertTriangle, Link2, Plus, Hash } from 'lucide-react'
import { GlyphCanvas } from '../canvas/GlyphCanvas'
import { useDocStore } from '../../stores/doc-store'
import { useSelectionStore } from '../../stores/selection-store'
import { usePrefsStore } from '../../stores/prefs-store'
import { useUIStore } from '../../stores/ui-store'
import { useBindings } from '../../app/bindings'
import { categoryColor, glyphSpokenName } from '../../core/unicode'
import { formatKey, isLigatureKey, keyToDisplayChars } from '../../core/unicode-keys'
import { useUnicodeDb } from '../../hooks/doc'
import { advanceWidth } from '../../core/compute'
import { cn } from '../../lib/cn'
import { createMissing, copyHex } from '../../app/actions'
import { openOutlineEditor } from '../../app/outline'
import { handleDroppedFiles } from '../../app/imports'
import { t } from '../../i18n'

interface Props {
  unicode: string
  width: number
  height: number
  /** The grid's keyboard cursor is on this cell (while the grid is used from the keyboard). */
  cursor?: boolean
  onSelect: (key: string, e: React.MouseEvent) => void
  onContext: (key: string, e: React.MouseEvent) => void
}

/** DOM id of a glyph cell (the grid points screen readers at its cursor cell). */
export const slotId = (key: string): string => `slot-${key}`

export const GlyphSlot = memo(function GlyphSlot({ unicode, width, height, cursor, onSelect, onContext }: Props): React.ReactElement {
  const glyph = useDocStore((s) => s.data?.glyphs.get(unicode))
  const computed = useDocStore((s) => s.computed.get(unicode)?.[0])
  const family = useDocStore((s) => s.data?.family)
  const selected = useSelectionStore((s) => s.set.has(unicode))
  const isActive = useSelectionStore((s) => s.active === unicode)
  const bound = useBindings((s) => s.byKey.has(unicode))
  const showLabels = usePrefsStore((s) => s.showSlotLabels)
  const [dropping, setDropping] = useState(false)
  useUnicodeDb()

  const exists = !!glyph
  const variant = glyph?.variants[0]
  const chars = keyToDisplayChars(unicode)
  const liga = isLigatureKey(unicode)
  const labelH = showLabels ? 22 : 4
  const canvasH = Math.max(10, height - labelH - 6)
  const canvasW = Math.max(10, width - 6)

  // What the cell shows, in words: "é U+00E9 Latin Small Letter E With Acute, out of bounds".
  const states = [
    !exists && t('viewport.slot.notInFont'),
    liga && t('viewport.slot.ligature'),
    exists && computed?.empty && t('viewport.slot.empty'),
    computed?.oob && t('viewport.slot.outOfBounds'),
    variant && !variant.doExport && t('viewport.slot.notExported'),
    bound && t('viewport.slot.linked')
  ].filter(Boolean)
  const ariaLabel = [glyphSpokenName(unicode), ...states].join(t('viewport.slot.separator'))

  return (
    <div
      id={slotId(unicode)}
      role="gridcell"
      aria-selected={selected}
      aria-label={ariaLabel}
      data-key={unicode}
      onMouseDown={(e) => {
        if (e.button === 0) onSelect(unicode, e)
      }}
      onDoubleClick={() => {
        // The slot's own glyph: with Ctrl held, the two presses toggled it out of the selection.
        if (exists) openOutlineEditor(unicode)
        else void createMissing([unicode])
      }}
      onContextMenu={(e) => onContext(unicode, e)}
      onMouseEnter={() => useUIStore.setState({ hoverKey: unicode })}
      onMouseLeave={() => {
        if (useUIStore.getState().hoverKey === unicode) useUIStore.setState({ hoverKey: null })
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
          e.stopPropagation()
          setDropping(true)
        }
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setDropping(false)
        void handleDroppedFiles(Array.from(e.dataTransfer.files), unicode)
      }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-md border transition-[border-color,background-color,box-shadow] duration-75',
        exists ? 'bg-slot' : 'bg-slot/40',
        selected
          ? 'border-accent bg-accent/10 shadow-[0_0_0_1px_rgb(var(--c-accent))]'
          : 'border-line/60 hover:border-line-strong',
        isActive && selected && 'shadow-[0_0_0_2px_rgb(var(--c-accent))]',
        // The keyboard cursor away from the active glyph (Ctrl+arrows).
        cursor && !(isActive && selected) && 'outline-dashed outline-2 outline-offset-1 outline-accent',
        dropping && 'border-ok shadow-[0_0_0_2px_rgb(var(--c-ok))]'
      )}
      style={{ width, height }}
    >
      <div className="relative flex flex-1 items-center justify-center pt-[3px]">
        {exists && family ? (
          <GlyphCanvas
            path={computed?.path}
            advance={computed ? advanceWidth(computed, family) : family.values.width}
            family={family.values}
            width={canvasW}
            height={canvasH}
            mode="slot"
            empty={!!computed?.empty}
          />
        ) : (
          <span
            className="pointer-events-none select-none font-normal text-fg/[0.13]"
            style={{ fontSize: Math.min(canvasH * 0.5, canvasW * (liga ? 0.3 : 0.55)), lineHeight: 1 }}
          >
            {chars || '·'}
          </span>
        )}
        {variant && !variant.doExport && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="h-px w-[130%] rotate-[-35deg] bg-danger/70" />
          </div>
        )}
      </div>

      {showLabels && (
        <div className="flex h-[22px] shrink-0 items-center gap-1 px-1.5">
          <span className={cn('min-w-0 truncate text-sm leading-none', exists ? 'text-fg' : 'text-subtle')}>{chars || formatKey(unicode)}</span>
          <span className="ml-auto shrink-0 font-mono text-2xs text-subtle">{liga ? '' : unicode.toUpperCase()}</span>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(unicode), opacity: exists ? 0.9 : 0.35 }} />
        </div>
      )}

      {/* Badges (also in the cell's label). "Not exported" has none: the slash says it. */}
      <div className="pointer-events-none absolute left-1 top-1 flex gap-0.5" aria-hidden>
        {liga && exists && <span className="rounded bg-ok/15 px-1 text-[8px] font-bold leading-[14px] text-ok">{t('viewport.slot.ligaBadge')}</span>}
        {computed?.oob && <AlertTriangle size={12} className="text-warn" />}
        {bound && <Link2 size={12} className="text-emphasis" />}
      </div>

      {/* Quick actions (v1 glyph slot quick menu). No delete here: one stray click
          lost a glyph. Delete stays on the Del key and in the context menu. */}
      <div className="absolute right-1 top-1 hidden gap-0.5 rounded bg-panel/90 p-0.5 shadow group-hover:flex" onMouseDown={(e) => e.stopPropagation()}>
        {!exists && (
          <QuickButton tip={t('viewport.slot.createEmpty')} onClick={() => void createMissing([unicode])}>
            <Plus size={11} />
          </QuickButton>
        )}
        <QuickButton tip={t('viewport.slot.copyUnicode')} onClick={() => void copyHex([unicode])}>
          <Hash size={11} />
        </QuickButton>
      </div>
    </div>
  )
})

function QuickButton({ children, onClick, tip }: { children: React.ReactNode; onClick: () => void; tip: string }): React.ReactElement {
  return (
    <button
      type="button"
      // Mouse shortcuts on hover; the keyboard has the context menu (Menu key, Shift+F10).
      tabIndex={-1}
      aria-label={tip}
      data-tip={tip}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="flex h-4 w-4 items-center justify-center rounded text-muted hover:bg-hover hover:text-fg"
    >
      {children}
    </button>
  )
}
