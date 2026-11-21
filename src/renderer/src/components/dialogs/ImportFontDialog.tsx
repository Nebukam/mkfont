import { useMemo, useState } from 'react'
import { FileDown } from 'lucide-react'
import type { PickedFile } from '../../platform'
import { stripExtension } from '../../platform'
import { useDocStore, transact } from '../../stores/doc-store'
import { useSelectionStore } from '../../stores/selection-store'
import { useUIStore } from '../../stores/ui-store'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Checkbox, Row, Select } from '../ui/fields'
import { fontImportItems, familyFromFont, parseFontFile, type FontImportItem, type ParsedFont } from '../../core/import-font'
import { createFamily, createGlyph } from '../../core/model'
import type { Glyph } from '../../types/font'
import { isLigatureKey, keyToDisplayChars } from '../../core/unicode-keys'
import { loadDocument } from '../../app/document'
import { toast } from '../ui/Overlays'
import { errorMessage } from '../../lib/errors'
import { useTranslation } from '../../i18n'

type Overlap = 'replace' | 'skip'

export function ImportFontDialog({ file, asNew, onClose }: { file: PickedFile; asNew: boolean; onClose: (ok: boolean) => void }): React.ReactElement {
  const family = useDocStore((s) => s.data?.family)
  const glyphs = useDocStore((s) => s.data?.glyphs)
  const [ligatures, setLigatures] = useState(true)
  const [overlap, setOverlap] = useState<Overlap>('skip')
  const { t } = useTranslation()

  const parsed = useMemo((): { pf: ParsedFont | null; error: string | null } => {
    try {
      return { pf: parseFontFile(file.bytes!), error: null }
    } catch (e) {
      return { pf: null, error: errorMessage(e) }
    }
  }, [file])

  const items = useMemo((): FontImportItem[] => {
    if (!parsed.pf) return []
    const target = asNew || !family ? parsed.pf.ascender : family.values.ascent
    return fontImportItems(parsed.pf, target, ligatures)
  }, [parsed, asNew, family, ligatures])

  const existing = asNew || !glyphs ? 0 : items.filter((i) => glyphs.has(i.key)).length
  const importCount = asNew ? items.length : overlap === 'skip' ? items.length - existing : items.length

  const run = (): void => {
    const pf = parsed.pf
    if (!pf) return
    if (asNew) {
      const fam = createFamily(familyFromFont(pf, items))
      const map = new Map<string, Glyph>()
      for (const it of items) {
        const g = createGlyph(it.key, fam.transforms, { pathData: it.pathData }, it.name)
        Object.assign(g.variants[0].transforms, it.transforms)
        map.set(it.key, g)
      }
      loadDocument(fam, map, { fileName: `${stripExtension(file.name)}.mkfont`, label: t('imports.font.imported', { fileName: file.name }), saved: false })
      toast.success(t('imports.font.created', { fileName: file.name }), t('imports.font.glyphs', { count: items.length }))
      onClose(true)
      return
    }
    const done: string[] = []
    transact(t('imports.importGlyphsFrom', { count: importCount, fileName: file.name }), (d) => {
      for (const it of items) {
        const g = d.glyphs.get(it.key)
        if (g && overlap === 'skip') continue
        if (!g) {
          d.glyphs.set(it.key, createGlyph(it.key, d.family.transforms, { pathData: it.pathData }, it.name))
        } else {
          g.variants[0].pathData = it.pathData
        }
        Object.assign(d.glyphs.get(it.key)!.variants[0].transforms, it.transforms)
        done.push(it.key)
      }
    }, { icon: 'import' })
    if (done.length) {
      useUIStore.getState().setRange({ kind: 'glyphs' })
      useSelectionStore.getState().setSelection(done)
      toast.success(t('imports.importedGlyphsFrom', { count: done.length, fileName: file.name }))
    }
    onClose(true)
  }

  const pf = parsed.pf
  const ligatureCount = items.filter((i) => isLigatureKey(i.key)).length
  return (
    <Dialog
      title={asNew ? t('imports.font.titleNew') : t('imports.font.title')}
      subtitle={file.name}
      icon={FileDown}
      onClose={() => onClose(false)}
      width={600}
      footer={
        <>
          <Button onClick={() => onClose(false)}>{t('imports.cancel')}</Button>
          <Button variant="primary" disabled={!pf || !importCount} onClick={run}>
            {asNew ? t('imports.font.createFont', { count: items.length }) : t('imports.importGlyphs', { count: importCount })}
          </Button>
        </>
      }
    >
      {parsed.error && <p className="text-sm text-danger">{t('imports.font.unreadable', { error: parsed.error })}</p>}
      {pf && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border border-line bg-bg/50 p-3 text-sm">
            <Info label={t('imports.font.family')} value={`${pf.familyName} ${pf.styleName}`} />
            <Info label={t('imports.font.unitsPerEm')} value={String(pf.unitsPerEm)} />
            <Info label={t('imports.font.ascenderDescender')} value={`${pf.ascender} / ${pf.descender}`} />
            <Info
              label={t('imports.font.glyphsLabel')}
              value={[
                t('imports.font.characters', { count: items.length - ligatureCount }),
                ligatureCount ? t('imports.font.ligatures', { count: ligatureCount }) : null
              ]
                .filter(Boolean)
                .join(', ')}
            />
          </div>
          {!asNew && family && (
            <p className="text-xs text-muted">{t('imports.font.scaled', { ascent: family.values.ascent })}</p>
          )}
          <Checkbox checked={ligatures} onChange={setLigatures} label={t('imports.font.includeLigatures')} />
          {!asNew && (
            <Row label={t('imports.existing')}>
              <Select
                value={overlap}
                onChange={setOverlap}
                options={[
                  { value: 'skip', label: t('imports.font.keepExisting', { count: existing }) },
                  { value: 'replace', label: t('imports.font.replaceExisting', { count: existing }) }
                ]}
              />
            </Row>
          )}
          <div className="grid max-h-[220px] grid-cols-[repeat(auto-fill,minmax(36px,1fr))] gap-1 overflow-y-auto">
            {items.slice(0, 240).map((it) => (
              <div key={it.key} className="flex h-9 items-center justify-center rounded border border-line bg-slot" data-tip={keyToDisplayChars(it.key)}>
                {!it.pathData.emptyPath && (
                  <svg viewBox={`0 0 ${Math.max(it.pathData.width, 1)} ${Math.max(it.pathData.height * 1.3, 1)}`} className="h-7 w-7">
                    <path d={it.pathData.path} fill="rgb(var(--c-glyph))" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Dialog>
  )
}

function Info({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div>
      <div className="text-2xs text-subtle">{label}</div>
      <div className="truncate text-fg">{value}</div>
    </div>
  )
}
