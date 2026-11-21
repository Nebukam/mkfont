import { useMemo, useState } from 'react'
import { PackageOpen } from 'lucide-react'
import type { PickedFile } from '../../platform'
import { useDocStore, transact } from '../../stores/doc-store'
import { useSelectionStore } from '../../stores/selection-store'
import { useUIStore } from '../../stores/ui-store'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Checkbox, Row, Select } from '../ui/fields'
import { deserializeMkFont } from '../../core/deserialize'
import { computeAll } from '../../core/compute'
import { resampledGlyph } from '../../core/model'
import type { Glyph } from '../../types/font'
import { compareKeys, keyToDisplayChars, refToKey } from '../../core/unicode-keys'
import { GlyphCanvas } from '../canvas/GlyphCanvas'
import { glyphSpokenName } from '../../core/unicode'
import { moveGridFocus } from '../ui/focus'
import { advanceWidth } from '../../core/compute'
import { cn } from '../../lib/cn'
import { toast } from '../ui/Overlays'
import { errorMessage } from '../../lib/errors'
import { useTranslation } from '../../i18n'

type Overlap = 'skip' | 'replace'


/** v1 editor-mkfont-import: copy glyphs from another project, with their components. */
export function ImportMkfontDialog({ file, onClose }: { file: PickedFile; onClose: (ok: boolean) => void }): React.ReactElement {
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const em = useDocStore((s) => s.data!.family.values.em)
  const { t } = useTranslation()
  const source = useMemo(() => {
    try {
      const r = deserializeMkFont(file.text ?? '')
      return { ...r, computed: computeAll(r.family, r.glyphs), error: null as string | null }
    } catch (e) {
      return { error: errorMessage(e), family: null, glyphs: new Map<string, Glyph>(), computed: new Map() }
    }
  }, [file])
  const keys = useMemo(() => [...source.glyphs.keys()].sort(compareKeys), [source])
  const [picked, setPicked] = useState<Set<string>>(() => new Set(keys))
  const [overlap, setOverlap] = useState<Overlap>('skip')
  const [deps, setDeps] = useState(true)
  // The glyph grid is one tab stop: the glyph focused last, or the first one.
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const tabKey = focusKey !== null && source.glyphs.has(focusKey) ? focusKey : keys[0]

  const factor = source.family ? em / source.family.values.em : 1
  const plan = useMemo(() => {
    const out = new Set<string>()
    // Components are followed only from glyphs that actually get imported.
    const add = (k: string): void => {
      if (out.has(k) || !source.glyphs.has(k)) return
      out.add(k)
      if (!deps) return
      for (const l of source.glyphs.get(k)!.variants[0].layers) {
        const r = refToKey(l.characterRef)
        if (r && !glyphs.has(r)) add(r)
      }
    }
    for (const k of picked) if (overlap === 'replace' || !glyphs.has(k)) add(k)
    return [...out]
  }, [picked, deps, overlap, glyphs, source])

  const run = (): void => {
    transact(t('imports.importGlyphsFrom', { count: plan.length, fileName: file.name }), (d) => {
      for (const k of plan) d.glyphs.set(k, resampledGlyph(source.glyphs.get(k)!, factor))
    }, { icon: 'import' })
    useUIStore.getState().setRange({ kind: 'glyphs' })
    useSelectionStore.getState().setSelection(plan)
    toast.success(t('imports.importedGlyphsFrom', { count: plan.length, fileName: file.name }))
    onClose(true)
  }

  const toggle = (k: string): void => {
    const next = new Set(picked)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    setPicked(next)
  }

  return (
    <Dialog
      title={t('imports.mkfont.title')}
      subtitle={file.name}
      icon={PackageOpen}
      onClose={() => onClose(false)}
      width={720}
      footer={
        <>
          <Button onClick={() => onClose(false)}>{t('imports.cancel')}</Button>
          <Button variant="primary" disabled={!plan.length} onClick={run}>
            {t('imports.importGlyphs', { count: plan.length })}
          </Button>
        </>
      }
    >
      {source.error ? (
        <p className="text-sm text-danger">{source.error}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>
              {factor !== 1
                ? t('imports.mkfont.summaryRescaled', { count: keys.length, em: source.family?.values.em ?? '', factor: factor.toFixed(3) })
                : t('imports.mkfont.summary', { count: keys.length, em: source.family?.values.em ?? '' })}
            </span>
            <Button size="xs" onClick={() => setPicked(new Set(keys))}>
              {t('imports.mkfont.all')}
            </Button>
            <Button size="xs" onClick={() => setPicked(new Set())}>
              {t('imports.mkfont.none')}
            </Button>
            <Button size="xs" onClick={() => setPicked(new Set(keys.filter((k) => !glyphs.has(k))))}>
              {t('imports.mkfont.onlyMissing')}
            </Button>
          </div>
          <Row label={t('imports.existing')}>
            <Select
              value={overlap}
              onChange={setOverlap}
              options={[
                { value: 'skip', label: t('imports.mkfont.keepExisting') },
                { value: 'replace', label: t('imports.mkfont.replaceExisting') }
              ]}
            />
          </Row>
          <Checkbox checked={deps} onChange={setDeps} label={t('imports.mkfont.withComponents')} />
          <div
            role="group"
            aria-label={t('imports.mkfont.glyphsToImport')}
            onKeyDown={moveGridFocus}
            className="grid max-h-[300px] grid-cols-[repeat(auto-fill,minmax(54px,1fr))] gap-1 overflow-y-auto pr-1"
          >
            {keys.map((k) => {
              const c = source.computed.get(k)?.[0]
              const on = picked.has(k)
              return (
                <button
                  key={k}
                  type="button"
                  tabIndex={k === tabKey ? 0 : -1}
                  onFocus={() => setFocusKey(k)}
                  onClick={() => toggle(k)}
                  data-tip={glyphs.has(k) ? t('imports.mkfont.existsTip', { glyph: keyToDisplayChars(k) }) : keyToDisplayChars(k)}
                  aria-pressed={on}
                  aria-label={glyphs.has(k) ? t('imports.mkfont.existsName', { name: glyphSpokenName(k) }) : glyphSpokenName(k)}
                  className={cn('relative flex flex-col items-center rounded-md border p-0.5', on ? 'border-accent bg-accent/10' : 'border-line opacity-60 hover:opacity-100')}
                >
                  {c && source.family && (
                    <GlyphCanvas path={c.path} advance={advanceWidth(c, source.family)} family={source.family.values} width={44} height={44} mode="mini" empty={c.empty} />
                  )}
                  <span className="text-2xs text-muted">{keyToDisplayChars(k)}</span>
                  {glyphs.has(k) && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-warn" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </Dialog>
  )
}
