import { useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import type { GlyphPickerOptions } from '../../app/dialogs'
import { useDocStore } from '../../stores/doc-store'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Segmented } from '../ui/fields'
import { GlyphThumb } from '../common/GlyphThumb'
import { moveGridFocus } from '../ui/focus'
import { allKeys, getKeyName, glyphSpokenName, matchesSearch, parseSearch } from '../../core/unicode'
import { compareKeys, formatKey, keyToDisplayChars, parseExplicitKey, resolveString } from '../../core/unicode-keys'
import { useUnicodeDb } from '../../hooks/doc'
import { cn } from '../../lib/cn'
import { useTranslation } from '../../i18n'

const LIMIT = 600

export function GlyphPickerDialog({
  title,
  multi,
  exclude = [],
  confirmLabel,
  onClose
}: GlyphPickerOptions & { onClose: (r: string[] | null) => void }): React.ReactElement {
  const { t } = useTranslation()
  const confirm = confirmLabel ?? t('dialogs.glyphPicker.choose')
  useUnicodeDb()
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const [source, setSource] = useState<'font' | 'all'>('font')
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const last = useRef<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  // The grid is one tab stop: the glyph focused last, or the first one.
  const [focusKey, setFocusKey] = useState<string | null>(null)

  const list = useMemo(() => {
    const ex = new Set(exclude)
    const base = source === 'font' ? [...glyphs.keys()].sort(compareKeys) : allKeys()
    const q = query.trim()
    let out = base
    if (q) {
      const sq = parseSearch(q, resolveString)
      out = base.filter((k) => matchesSearch(k, sq))
      const direct = parseExplicitKey(q)
      if (direct && !out.includes(direct)) out = [direct, ...out]
    }
    return out.filter((k) => !ex.has(k))
  }, [glyphs, source, query, exclude])
  const shown = list.slice(0, LIMIT)
  const tabKey = focusKey !== null && shown.includes(focusKey) ? focusKey : shown[0]

  const toggle = (k: string, e: React.MouseEvent): void => {
    if (!multi) {
      setPicked([k])
      return
    }
    if (e.shiftKey && last.current) {
      const a = list.indexOf(last.current)
      const b = list.indexOf(k)
      if (a !== -1 && b !== -1) {
        const range = list.slice(Math.min(a, b), Math.max(a, b) + 1)
        setPicked([...new Set([...picked, ...range])])
        return
      }
    }
    last.current = k
    setPicked(picked.includes(k) ? picked.filter((x) => x !== k) : [...picked, k])
  }

  return (
    <Dialog
      title={title ?? t('dialogs.glyphPicker.title')}
      icon={Search}
      onClose={() => onClose(null)}
      width={620}
      bodyClassName="flex flex-col gap-2 !py-2"
      footer={
        <>
          <span className="mr-auto truncate text-xs text-muted">
            {picked.length ? picked.map(keyToDisplayChars).join(' ') : multi ? t('dialogs.glyphPicker.hintMulti') : t('dialogs.glyphPicker.hint')}
          </span>
          <Button onClick={() => onClose(null)}>{t('dialogs.cancel')}</Button>
          <Button variant="primary" disabled={!picked.length} onClick={() => onClose(picked)}>
            {multi && picked.length > 1 ? t('dialogs.glyphPicker.confirmCount', { label: confirm, count: picked.length }) : confirm}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="pointer-events-none absolute left-2 top-1.5 text-subtle" />
          <input
            data-autofocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && list[0]) onClose(picked.length ? picked : [list[0]])
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                gridRef.current?.querySelector<HTMLElement>(':scope > button[tabindex="0"]')?.focus()
              }
            }}
            placeholder={t('dialogs.glyphPicker.search')}
            className="input-base h-7 pl-7"
          />
        </div>
        <Segmented
          value={source}
          onChange={setSource}
          options={[
            { value: 'font', label: t('dialogs.glyphPicker.inFont') },
            { value: 'all', label: t('dialogs.glyphPicker.allCharacters') }
          ]}
        />
      </div>
      <div
        ref={gridRef}
        role="group"
        aria-label={t('dialogs.glyphPicker.glyphs')}
        onKeyDown={moveGridFocus}
        className="grid h-[340px] grid-cols-[repeat(auto-fill,minmax(52px,1fr))] content-start gap-1.5 overflow-y-auto pr-1"
      >
        {shown.map((k) => (
          <button
            key={k}
            type="button"
            tabIndex={k === tabKey ? 0 : -1}
            onFocus={() => setFocusKey(k)}
            aria-pressed={picked.includes(k)}
            aria-label={glyphSpokenName(k)}
            onClick={(e) => toggle(k, e)}
            onDoubleClick={() => onClose(multi && picked.length ? [...new Set([...picked, k])] : [k])}
            data-tip={`${keyToDisplayChars(k)} ${formatKey(k)}\n${getKeyName(k) ?? ''}`}
            className={cn('flex flex-col items-center gap-0.5 rounded-md border p-1 transition-colors', picked.includes(k) ? 'border-accent bg-accent/15' : 'border-transparent hover:bg-hover')}
          >
            <GlyphThumb unicode={k} size={40} />
            <span className="w-full truncate text-center font-mono text-[9px] text-subtle">{k.toUpperCase()}</span>
          </button>
        ))}
        {list.length === 0 && <p className="col-span-full py-8 text-center text-sm text-subtle">{t('dialogs.glyphPicker.noMatch')}</p>}
      </div>
      {list.length > LIMIT && <p className="text-2xs text-subtle">{t('dialogs.glyphPicker.truncated', { shown: LIMIT, count: list.length })}</p>}
    </Dialog>
  )
}
