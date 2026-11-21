import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CornerDownLeft, Search } from 'lucide-react'
import { COMMANDS, groupLabel, isEnabled, runCommand, shortcutLabel } from '../../app/commands'
import { useDocStore } from '../../stores/doc-store'
import { getKeyName } from '../../core/unicode'
import { formatKey, keyToDisplayChars, parseExplicitKey } from '../../core/unicode-keys'
import { goToGlyph } from '../inspector/DetailsSection'
import { useModal } from '../ui/modal'
import { cn } from '../../lib/cn'
import { useTranslation } from '../../i18n'

interface Entry {
  id: string
  label: string
  detail?: string
  shortcut?: string
  run: () => void
}

export function CommandPalette({ onClose }: { onClose: () => void }): React.ReactElement {
  const [q, setQ] = useState('')
  const [index, setIndex] = useState(0)
  const hasDoc = useDocStore((s) => !!s.data)
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const optionId = (i: number): string => `${id}-option-${i}`
  useModal(overlayRef, panelRef, onClose)

  const entries = useMemo(() => {
    const out: Entry[] = []
    const query = q.trim()
    if (hasDoc && query) {
      const key = parseExplicitKey(query)
      if (key) {
        out.push({
          id: 'goto',
          label: t('commands.palette.goTo', { glyph: keyToDisplayChars(key), code: formatKey(key) }),
          detail: getKeyName(key) ?? undefined,
          run: () => goToGlyph(key)
        })
      }
    }
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    for (const c of COMMANDS) {
      if (c.hidden || !isEnabled(c.id)) continue
      const group = groupLabel(c.group)
      const label = c.label
      const hay = `${group} ${label}`.toLowerCase()
      if (words.every((w) => hay.includes(w))) out.push({ id: c.id, label, detail: group, shortcut: shortcutLabel(c.id), run: () => runCommand(c.id) })
    }
    return out
  }, [q, hasDoc, t])

  // Keep the highlighted entry in view while moving through a long list.
  useEffect(() => {
    document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const choose = (e: Entry | undefined): void => {
    if (!e) return
    onClose()
    setTimeout(e.run, 0)
  }

  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-50 flex animate-fade-in justify-center bg-black/40 pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('commands.palette.title')}
        tabIndex={-1}
        className="flex h-fit max-h-[60vh] w-[560px] animate-pop-in flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-pop outline-none"
      >
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search size={15} className="text-subtle" />
          <input
            role="combobox"
            aria-expanded="true"
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={entries.length ? optionId(index) : undefined}
            aria-label={t('commands.palette.input')}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setIndex((i) => Math.min(entries.length - 1, i + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setIndex((i) => Math.max(0, i - 1))
              } else if (e.key === 'Enter') choose(entries[index])
              e.stopPropagation()
            }}
            placeholder={t('commands.palette.placeholder')}
            className="h-11 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-subtle"
          />
        </div>
        <div id={`${id}-list`} role="listbox" aria-label={t('commands.palette.list')} className="overflow-y-auto py-1">
          {entries.map((e, i) => (
            <button
              key={e.id}
              id={optionId(i)}
              type="button"
              role="option"
              aria-selected={i === index}
              tabIndex={-1}
              onMouseEnter={() => setIndex(i)}
              onClick={() => choose(e)}
              className={cn('flex w-full items-center gap-3 px-3 py-2 text-left text-sm', i === index ? 'bg-accent-solid text-accent-fg' : 'text-fg')}
            >
              <span className="flex-1 truncate">{e.label}</span>
              {e.detail && <span className={cn('max-w-[40%] truncate text-xs', i !== index && 'text-subtle')}>{e.detail}</span>}
              {e.shortcut && <kbd className={cn('rounded px-1 font-mono text-2xs', i === index ? 'bg-white/20' : 'bg-hover text-muted')}>{e.shortcut}</kbd>}
              {i === index && <CornerDownLeft size={13} />}
            </button>
          ))}
          {entries.length === 0 && (
            <p role="status" className="px-3 py-4 text-sm text-subtle">
              {t('commands.palette.noMatch')}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
