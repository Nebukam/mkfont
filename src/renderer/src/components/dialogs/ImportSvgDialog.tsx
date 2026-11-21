import { useMemo, useState } from 'react'
import { ChevronRight, Download } from 'lucide-react'
import type { PickedFile } from '../../platform'
import { isElectron } from '../../platform'
import type { ResolvedTransforms, TransformSettings } from '../../types/font'
import { useDocStore, transact } from '../../stores/doc-store'
import { useSelectionStore } from '../../stores/selection-store'
import { isPairRange, useUIStore } from '../../stores/ui-store'
import { usePrefsStore } from '../../stores/prefs-store'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Checkbox, Row, Select, TextField } from '../ui/fields'
import { SubHeader } from '../ui/Section'
import { TransformsEditor } from '../inspector/TransformsEditor'
import { parseSvg, svgImportToPathData, type SvgImport } from '../../core/import-svg'
import { AssignMode, BlockStart, OVERLAP_MODES, OverlapMode, assignKeys, detectPrefixSeparator } from '../../core/import-assign'
import { BROWSABLE_BLOCKS } from '../../core/unicode'
import { addLabelComponents, ensureGlyph } from '../../core/ops'
import { formatKey, keyToDisplayChars } from '../../core/unicode-keys'
import { bind } from '../../app/bindings'
import { toast } from '../ui/Overlays'
import { cn } from '../../lib/cn'
import { t as translate, tm, useTranslation } from '../../i18n'

interface Item {
  file: PickedFile
  parsed: SvgImport
  enabled: boolean
  custom: string
}

const SEPARATORS = [
  { value: '_', name: 'underscore' },
  { value: '-', name: 'dash' },
  { value: '.', name: 'dot' },
  { value: ' ', name: 'space' },
  { value: '', name: 'none' }
] as const

const OVERLAP_NAMES = {
  [OverlapMode.Overwrite]: 'overwrite',
  [OverlapMode.OverwriteEmpty]: 'overwriteEmpty',
  [OverlapMode.Preserve]: 'preserve',
  [OverlapMode.Ignore]: 'ignore'
} as const

export function ImportSvgDialog({ files, onClose }: { files: PickedFile[]; onClose: (ok: boolean) => void }): React.ReactElement {
  const family = useDocStore((s) => s.data!.family)
  const glyphs = useDocStore((s) => s.data!.glyphs)
  const computed = useDocStore((s) => s.computed)
  const selection = useSelectionStore((s) => s.keys)
  const range = useUIStore((s) => s.range)
  const markColor = usePrefsStore((s) => s.markColor)
  const { t } = useTranslation()

  const [items, setItems] = useState<Item[]>(() =>
    files
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map((file) => ({ file, parsed: parseSvg(file.text ?? '', markColor), enabled: true, custom: '' }))
  )
  const detected = useMemo(() => detectPrefixSeparator(files.map((f) => f.name)), [files])
  const [mode, setMode] = useState<AssignMode>(AssignMode.Filename)
  const [prefix, setPrefix] = useState(detected.prefix)
  const [separator, setSeparator] = useState(detected.separator)
  // i18n-ignore: Unicode block name (data), the default block
  const [blockName, setBlockName] = useState(range.kind === 'block' ? range.name : 'Basic Latin')
  const [blockStart, setBlockStart] = useState(BlockStart.Begin)
  const [overlap, setOverlap] = useState(OverlapMode.Preserve)
  const [doBind, setDoBind] = useState(true)
  const [textLayers, setTextLayers] = useState(true)
  const [showTransforms, setShowTransforms] = useState(false)
  const [transforms, setTransforms] = useState<ResolvedTransforms>(() => ({ ...family.transforms }))

  const block = BROWSABLE_BLOCKS.find((b) => b.name === blockName) ?? null
  const targets = useMemo(
    () =>
      assignKeys(
        items.map((i) => ({ name: i.file.name, enabled: i.enabled && i.parsed.exists, custom: i.custom })),
        { mode, prefix, separator, selection, block, blockStart, exists: (k) => glyphs.has(k) }
      ),
    [items, mode, prefix, separator, selection, block, blockStart, glyphs]
  )

  type Status = 'new' | 'replace' | 'skip' | 'unassigned' | 'invalid' | 'off'
  const statuses: Status[] = items.map((it, i) => {
    if (!it.parsed.exists) return 'invalid'
    if (!it.enabled) return 'off'
    const k = targets[i]
    if (!k) return 'unassigned'
    if (!glyphs.has(k)) return 'new'
    return overlap === OverlapMode.Ignore ? 'skip' : 'replace'
  })
  const count = (s: Status): number => statuses.filter((x) => x === s).length
  const importable = count('new') + count('replace')

  const doImport = (): void => {
    const imported: string[] = []
    const seen = new Set<string>()
    transact(t('imports.svg.history', { count: importable }), (d) => {
      items.forEach((it, i) => {
        const key = targets[i]
        const status = statuses[i]
        if (!key || (status !== 'new' && status !== 'replace') || seen.has(key)) return
        seen.add(key)
        const existed = d.glyphs.has(key)
        const wasEmpty = computed.get(key)?.[0]?.empty ?? false
        const v = ensureGlyph(d, key, transforms).variants[0]
        v.pathData = svgImportToPathData(it.parsed)
        // Existing glyphs keep their transforms unless the overlap mode says otherwise.
        if (existed && (overlap === OverlapMode.Overwrite || (overlap === OverlapMode.OverwriteEmpty && wasEmpty))) Object.assign(v.transforms, transforms)
        if (textLayers) addLabelComponents(d, key, it.parsed.layers ?? [])
        imported.push(key)
      })
    }, { icon: 'import' })
    if (doBind && isElectron) {
      items.forEach((it, i) => {
        const key = targets[i]
        if (key && imported.includes(key) && it.file.path) bind(key, it.file.path)
      })
    }
    if (imported.length) {
      // The pair views do not list glyphs: show them where they are listed.
      if (isPairRange(useUIStore.getState().range)) useUIStore.getState().setRange({ kind: 'glyphs' })
      useSelectionStore.getState().setSelection(imported)
      useUIStore.getState().reveal(imported[0])
      toast.success(t('imports.svg.imported', { count: imported.length }))
    }
    onClose(true)
  }

  const update = (i: number, patch: Partial<Item>): void => setItems(items.map((it, j) => (i === j ? { ...it, ...patch } : it)))
  // Unusable files cannot be picked: "all" means all the usable ones.
  const usable = items.filter((i) => i.parsed.exists)
  const allOn = usable.length > 0 && usable.every((i) => i.enabled)

  return (
    <Dialog
      title={t('imports.svg.title')}
      subtitle={[
        t('imports.svg.summary.files', { count: files.length }),
        t('imports.svg.summary.new', { count: count('new') }),
        t('imports.svg.summary.replace', { count: count('replace') }),
        count('skip') ? t('imports.svg.summary.skipped', { count: count('skip') }) : null,
        count('unassigned') ? t('imports.svg.summary.unassigned', { count: count('unassigned') }) : null,
        count('invalid') ? t('imports.svg.summary.unusable', { count: count('invalid') }) : null
      ]
        .filter(Boolean)
        .join(' · ')}
      icon={Download}
      onClose={() => onClose(false)}
      width={940}
      bodyClassName="!p-0 flex min-h-0"
      footer={
        <>
          <Button onClick={() => onClose(false)}>{t('imports.cancel')}</Button>
          <Button variant="primary" disabled={!importable} onClick={doImport}>
            {t('imports.importGlyphs', { count: importable })}
          </Button>
        </>
      }
    >
      <div className="flex min-h-0 w-full" style={{ height: 'min(62vh, 560px)' }}>
        {/* Settings */}
        <div className="flex w-[300px] shrink-0 flex-col gap-1.5 overflow-y-auto border-r border-line p-3">
          <SubHeader className="pt-0">{t('imports.svg.assign')}</SubHeader>
          <Select
            ariaLabel={t('imports.svg.assign')}
            value={mode}
            onChange={setMode}
            options={[
              { value: AssignMode.Filename, label: t('imports.svg.assignModes.filename') },
              { value: AssignMode.Selection, label: t('imports.svg.assignModes.selection', { count: selection.length }) },
              { value: AssignMode.Block, label: t('imports.svg.assignModes.block') },
              { value: AssignMode.BlockConstrained, label: t('imports.svg.assignModes.blockConstrained') }
            ]}
          />
          {mode === AssignMode.Filename && (
            <>
              <Row label={t('imports.svg.prefix')} tip={t('imports.svg.prefixTip')}>
                <TextField value={prefix} onChange={setPrefix} commitOnType placeholder={t('imports.svg.prefixNone')} />
              </Row>
              <Row label={t('imports.svg.separator')} tip={t('imports.svg.separatorTip')}>
                <Select<string>
                  value={separator}
                  options={SEPARATORS.map((s) => ({ value: s.value, label: t(`imports.svg.separators.${s.name}`) }))}
                  onChange={setSeparator}
                />
              </Row>
              <p className="text-2xs leading-relaxed text-subtle">{t('imports.svg.namesHint')}</p>
            </>
          )}
          {mode === AssignMode.Selection && <p className="text-2xs text-subtle">{t('imports.svg.selectionHint')}</p>}
          {(mode === AssignMode.Block || mode === AssignMode.BlockConstrained) && (
            <>
              <Select ariaLabel={t('imports.svg.block')} value={blockName} options={BROWSABLE_BLOCKS.map((b) => ({ value: b.name, label: b.name }))} onChange={setBlockName} />
              <Select
                ariaLabel={t('imports.svg.blockStart')}
                value={blockStart}
                onChange={setBlockStart}
                options={[
                  { value: BlockStart.Begin, label: t('imports.svg.blockStarts.begin') },
                  { value: BlockStart.FirstEmpty, label: t('imports.svg.blockStarts.firstEmpty') }
                ]}
              />
            </>
          )}

          <SubHeader>{t('imports.svg.existingGlyphs')}</SubHeader>
          <Select
            ariaLabel={t('imports.svg.existingGlyphs')}
            value={overlap}
            onChange={setOverlap}
            options={OVERLAP_MODES.map((m) => ({ value: m, label: t(`imports.svg.overlap.${OVERLAP_NAMES[m]}`) }))}
          />

          <SubHeader>{t('imports.svg.options')}</SubHeader>
          {isElectron && <Checkbox checked={doBind} onChange={setDoBind} label={t('imports.svg.keepLinked')} />}
          <Checkbox checked={textLayers} onChange={setTextLayers} label={t('imports.svg.textLabels')} />

          <button type="button" onClick={() => setShowTransforms(!showTransforms)} aria-expanded={showTransforms} className="mt-2 flex items-center gap-1 text-left text-xs font-medium text-muted hover:text-fg">
            <ChevronRight size={12} className={cn('transition-transform', showTransforms && 'rotate-90')} />
            {t('imports.svg.transforms')}
          </button>
          {showTransforms && (
            <TransformsEditor values={transforms} onChange={(p) => setTransforms({ ...transforms, ...(p as Partial<TransformSettings>) } as ResolvedTransforms)} />
          )}
        </div>

        {/* Files */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-8 shrink-0 items-center gap-2 border-b border-line px-3 text-xs text-muted">
            <Checkbox
              ariaLabel={t('imports.svg.importAll')}
              checked={allOn ? true : usable.some((i) => i.enabled) ? undefined : false}
              onChange={(v) => setItems(items.map((i) => (i.parsed.exists ? { ...i, enabled: v } : i)))}
            />
            <span className="flex-1">{t('imports.svg.columns.file')}</span>
            <span className="w-[150px]">{t('imports.svg.columns.target')}</span>
            <span className="w-[110px]">{t('imports.svg.columns.override')}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {items.map((it, i) => {
              const k = targets[i]
              const st = statuses[i]
              // Unusable files stay readable: the reason is what matters on that row.
              const problem = it.parsed.exists ? null : it.parsed.error ? tm(it.parsed.error) : t('imports.svg.noPaths')
              return (
                <div key={it.file.name + i} className={cn('flex h-11 items-center gap-2 border-b border-line/50 px-3', st === 'off' && 'opacity-50')}>
                  <Checkbox ariaLabel={t('imports.svg.importFile', { fileName: it.file.name })} checked={it.enabled && !problem} disabled={!!problem} onChange={(v) => update(i, { enabled: v })} />
                  <SvgPreview parsed={it.parsed} />
                  <div className="min-w-0 flex-1">
                    <div className={cn('truncate text-sm', problem ? 'text-muted' : 'text-fg')} data-tip={it.file.path ?? it.file.name}>
                      {it.file.name}
                    </div>
                    <div className={cn('truncate text-2xs', problem ? 'text-warn' : 'text-subtle')} data-tip={problem ?? undefined}>
                      {problem ?? fileDetails(it.parsed)}
                    </div>
                  </div>
                  <div className="flex w-[150px] items-center gap-1.5">
                    {k ? (
                      <>
                        <span className="text-base leading-none text-fg">{keyToDisplayChars(k)}</span>
                        <span className="truncate font-mono text-2xs text-muted">{formatKey(k)}</span>
                      </>
                    ) : (
                      <span className="text-xs text-warn">{st === 'invalid' ? '—' : t('imports.svg.unassigned')}</span>
                    )}
                    <StatusChip status={st} />
                  </div>
                  <input
                    value={it.custom}
                    onChange={(e) => update(i, { custom: e.target.value })}
                    onKeyDown={(e) => e.stopPropagation()}
                    aria-label={t('imports.svg.overrideFor', { fileName: it.file.name })}
                    placeholder={t('imports.svg.overrideAuto')}
                    className="input-base w-[110px]"
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Dialog>
  )
}

/** Size, marked box and text labels of a usable file, for its row. */
function fileDetails(parsed: SvgImport): string {
  return [
    translate('imports.svg.size', { width: Math.round(parsed.width), height: Math.round(parsed.height) }),
    parsed.markedBBox ? translate('imports.svg.markedBox') : null,
    parsed.layers?.length ? translate('imports.svg.labels', { count: parsed.layers.length }) : null
  ]
    .filter(Boolean)
    .join(' · ')
}

const CHIP_STYLES = {
  new: 'bg-ok/15 text-ok',
  replace: 'bg-emphasis/15 text-emphasis',
  skip: 'bg-hover text-subtle'
} as const

function StatusChip({ status }: { status: string }): React.ReactElement | null {
  const { t } = useTranslation()
  if (!(status in CHIP_STYLES)) return null
  const s = status as keyof typeof CHIP_STYLES
  return <span className={cn('ml-auto rounded px-1 text-[9px] font-semibold uppercase', CHIP_STYLES[s])}>{t(`imports.svg.status.${s}`)}</span>
}

function SvgPreview({ parsed }: { parsed: SvgImport }): React.ReactElement {
  const w = Math.max(parsed.width, parsed.bbox.right, 1)
  const h = Math.max(parsed.height, parsed.bbox.bottom, 1)
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-line bg-slot">
      {parsed.exists && (
        <svg viewBox={`${Math.min(0, parsed.bbox.x)} ${Math.min(0, parsed.bbox.y)} ${w} ${h}`} className="h-7 w-7">
          <path d={parsed.path} fill="rgb(var(--c-glyph))" />
        </svg>
      )}
    </div>
  )
}
