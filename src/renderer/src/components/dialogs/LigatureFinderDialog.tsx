// ============================================================
// Ligature finder (v1 EditorLigaImport): statistical extraction of
// frequent character sequences, or one ligature per line.
// ============================================================

import { useMemo, useState } from 'react'
import { Ligature } from 'lucide-react'
import { useDocStore, transact } from '../../stores/doc-store'
import { useSelectionStore } from '../../stores/selection-store'
import { useUIStore } from '../../stores/ui-store'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Checkbox, NumberField, Row } from '../ui/fields'
import { createLigatures } from '../../core/ops'
import { moveGridFocus } from '../ui/focus'
import { charsToKey, formatKey } from '../../core/unicode-keys'
import { cn } from '../../lib/cn'
import { toast } from '../ui/Overlays'
import { t as translate, useTranslation } from '../../i18n'

const MAX_RESULTS = 500

interface Candidate {
  ligature: string
  count: number
}

/** v1 _ComputeCandidates */
export function findLigatures(text: string, min: number, max: number, minOcc: number): Candidate[] {
  const lo = Math.max(2, Math.min(min, max))
  const hi = Math.max(min, max)
  const words = text.split(/[\s\r\n\t]+/).map((w) => w.trim()).filter((w) => Array.from(w).length >= lo)
  const counts = new Map<string, number>()
  for (const w of words) {
    const chars = Array.from(w)
    for (let len = lo; len <= hi; len++) {
      for (let s = 0; s + len <= chars.length; s++) {
        const seg = chars.slice(s, s + len).join('')
        counts.set(seg, (counts.get(seg) ?? 0) + 1)
      }
    }
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= minOcc)
    .map(([ligature, count]) => ({ ligature, count }))
    .sort((a, b) => b.count - a.count || a.ligature.localeCompare(b.ligature))
    .slice(0, MAX_RESULTS)
}

/** A result chip's accessible name: the ligature, its code points, how often it occurs, whether it exists. */
function chipName(r: Candidate, code: string, counted: boolean, exists: boolean): string {
  const values = { ligature: r.ligature, code, count: r.count }
  if (counted) return exists ? translate('dialogs.ligatures.chipCountExists', values) : translate('dialogs.ligatures.chipCount', values)
  return exists ? translate('dialogs.ligatures.chipExists', values) : translate('dialogs.ligatures.chip', values)
}

export function LigatureFinderDialog({ onClose }: { onClose: (ok: boolean) => void }): React.ReactElement {
  const { t } = useTranslation()
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const [text, setText] = useState('')
  const [eachLine, setEachLine] = useState(false)
  const [min, setMin] = useState(2)
  const [max, setMax] = useState(3)
  const [minOcc, setMinOcc] = useState(2)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  // The results are one tab stop: the chip focused last, or the first one that can be picked.
  const [focusLig, setFocusLig] = useState<string | null>(null)

  const results = useMemo((): Candidate[] => {
    if (eachLine) {
      const lines = [...new Set(text.split(/\r?\n/).map((l) => l.trim()).filter((l) => Array.from(l).length > 1))].sort()
      return lines.map((ligature) => ({ ligature, count: 1 }))
    }
    return text.trim() ? findLigatures(text, min, max, minOcc) : []
  }, [text, eachLine, min, max, minOcc])

  const create = (list: string[]): void => {
    let created: string[] = []
    transact(translate('dialogs.ligatures.create', { count: list.length }), (d) => {
      created = createLigatures(d, list)
    }, { icon: 'ligature' })
    if (created.length) {
      useUIStore.getState().setRange({ kind: 'ligatures' })
      useSelectionStore.getState().setSelection(created)
      toast.success(translate('dialogs.ligatures.created', { count: created.length }))
    } else toast.info(translate('dialogs.ligatures.allExist'))
    onClose(true)
  }

  const fresh = results.filter((r) => !glyphs.has(charsToKey(r.ligature)))
  const tabLig = focusLig !== null && fresh.some((r) => r.ligature === focusLig) ? focusLig : fresh[0]?.ligature

  return (
    <Dialog
      title={t('dialogs.ligatures.title')}
      subtitle={t('dialogs.ligatures.subtitle')}
      icon={Ligature}
      onClose={() => onClose(false)}
      width={820}
      footer={
        <>
          <span className="mr-auto text-xs text-muted">
            {results.length === MAX_RESULTS ? t('dialogs.ligatures.resultsCapped', { count: results.length, max: MAX_RESULTS }) : t('dialogs.ligatures.results', { count: results.length })}
            {' · '}
            {t('dialogs.ligatures.selected', { count: picked.size })}
          </span>
          <Button onClick={() => onClose(false)}>{t('dialogs.cancel')}</Button>
          <Button disabled={!fresh.length} onClick={() => create(fresh.map((r) => r.ligature))}>
            {t('dialogs.ligatures.createAll', { count: fresh.length })}
          </Button>
          <Button variant="primary" disabled={!picked.size} onClick={() => create([...picked])}>
            {t('dialogs.ligatures.createSelected', { count: picked.size })}
          </Button>
        </>
      }
    >
      <div className="flex gap-4" style={{ height: 'min(56vh, 460px)' }}>
        <div className="flex w-[300px] shrink-0 flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder={eachLine ? t('dialogs.ligatures.placeholderLines') : t('dialogs.ligatures.placeholderText')}
            data-autofocus
            spellCheck={false}
            className="min-h-0 flex-1 resize-none rounded border border-line bg-raised p-2 text-sm text-fg outline-none placeholder:text-subtle focus:border-accent"
          />
          <Checkbox checked={eachLine} onChange={setEachLine} label={t('dialogs.ligatures.eachLine')} />
          {/* Unused when each line is a ligature: disabled, not just dimmed, so the keyboard skips them too. */}
          <div className="flex flex-col gap-1.5">
            <Row label={t('dialogs.ligatures.minLength')}>
              <NumberField value={min} min={2} max={12} disabled={eachLine} onChange={(v) => v !== null && setMin(v)} />
            </Row>
            <Row label={t('dialogs.ligatures.maxLength')}>
              <NumberField value={max} min={2} max={12} disabled={eachLine} onChange={(v) => v !== null && setMax(v)} />
            </Row>
            <Row label={t('dialogs.ligatures.minCount')}>
              <NumberField value={minOcc} min={1} disabled={eachLine} onChange={(v) => v !== null && setMinOcc(v)} />
            </Row>
          </div>
        </div>
        <div
          role="group"
          aria-label={t('dialogs.ligatures.found')}
          onKeyDown={moveGridFocus}
          className="flex min-w-0 flex-1 flex-wrap content-start gap-1.5 overflow-y-auto rounded-md border border-line bg-bg/40 p-2"
        >
          {results.map((r) => {
            const exists = glyphs.has(charsToKey(r.ligature))
            const on = picked.has(r.ligature)
            return (
              <button
                key={r.ligature}
                type="button"
                disabled={exists}
                tabIndex={r.ligature === tabLig ? 0 : -1}
                onFocus={() => setFocusLig(r.ligature)}
                onClick={() => {
                  const next = new Set(picked)
                  if (on) next.delete(r.ligature)
                  else next.add(r.ligature)
                  setPicked(next)
                }}
                data-tip={exists ? t('dialogs.ligatures.exists') : undefined}
                aria-pressed={exists ? undefined : on}
                aria-label={chipName(r, formatKey(charsToKey(r.ligature)), !eachLine, exists)}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-md border px-2 text-sm transition-colors',
                  exists ? 'border-line text-subtle' : on ? 'border-accent bg-accent/15 text-accent' : 'border-line text-fg hover:border-line-strong'
                )}
              >
                <span className="font-medium">{r.ligature}</span>
                {!eachLine && <span className="text-2xs text-subtle">×{r.count}</span>}
              </button>
            )
          })}
          {results.length === 0 && <p className="m-auto text-sm text-subtle">{text.trim() ? t('dialogs.ligatures.noResults') : t('dialogs.ligatures.noText')}</p>}
        </div>
      </div>
    </Dialog>
  )
}
