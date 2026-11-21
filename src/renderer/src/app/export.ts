// ============================================================
// Font export: one file through a save dialog, or several formats
// at once into a folder (batch export). Both work on the store of
// the document they were started for.
// ============================================================

import { activeDocStore, type DocStore } from '../stores/doc-store'
import { usePrefsStore } from '../stores/prefs-store'
import { exportFont, type ExportResult } from '../core/export-font'
import { FILE_FORMAT_INFO, type FileFormat, type FontFormat } from '../core/font-formats'
import { encodeWoff, encodeWoff2 } from '../core/woff'
import { kerningForExport } from '../core/kerning'
import { FILTERS, basename, dirname, download, existingPaths, firstFolder, isElectron, joinPath, saveFile, showInFolder } from '../platform'
import { brotli, canBrotli, deflate } from '../platform/compress'
import { confirmDialog, dialogFlow, openDialog } from './dialogs'
import { projectDir, suggestedBaseName } from './document'
import { exportDirFor, rememberExportDir } from './export-dirs'
import { toast } from '../components/ui/Overlays'
import { errorMessage } from '../lib/errors'
import { t, tm } from '../i18n'

/** Whether a format can be written here (WOFF2 needs Brotli, which few browsers offer). */
export function canExport(format: FileFormat): boolean {
  return format !== 'woff2' || canBrotli()
}

interface BuiltFiles {
  files: { format: FileFormat; data: ArrayBuffer }[]
  /** The notice's details ("231 glyphs, 21 ligatures"). */
  stats: string
  warnings: string[]
}

/** The document in each of `formats`. Each font is built once: the web formats share the TrueType one. */
async function buildFiles(formats: readonly FileFormat[], store: DocStore): Promise<BuiltFiles> {
  const s = store.getState()
  if (!s.data) return { files: [], stats: '', warnings: [] }
  const { family, glyphs } = s.data
  const kerning = kerningForExport(s.data.kerning, glyphs.keys(), s.data.inheritKerning)
  const fonts = new Map<FontFormat, ExportResult>()
  const fontFor = (format: FontFormat): ExportResult => {
    let font = fonts.get(format)
    if (!font) fonts.set(format, (font = exportFont(format, family, glyphs, s.computed, kerning)))
    return font
  }

  const files: BuiltFiles['files'] = []
  for (const format of formats) {
    const font = fontFor(FILE_FORMAT_INFO[format].font).data
    const data = format === 'woff' ? await encodeWoff(font, deflate) : format === 'woff2' ? await encodeWoff2(font, brotli) : font
    files.push({ format, data })
  }

  const [first] = fonts.values()
  const stats = [
    t('document.export.glyphs', { count: first.glyphCount }),
    first.ligatureCount ? t('document.export.ligatures', { count: first.ligatureCount }) : null,
    first.kerningCount ? t('document.export.kerningPairs', { count: first.kerningCount }) : null
  ]
    .filter(Boolean)
    .join(', ')
  const warnings = [...new Set([...fonts.values()].flatMap((font) => font.warnings.map(tm)))]
  return { files, stats, warnings }
}

export async function exportFontFile(format: FileFormat = usePrefsStore.getState().exportFormat, store: DocStore = activeDocStore()): Promise<void> {
  if (!store.getState().data) return
  try {
    const built = await buildFiles([format], store)
    const target = await saveFile({
      data: built.files[0].data,
      suggestedName: `${suggestedBaseName(store)}.${format}`,
      filters: FILTERS[format],
      // This document's last export folder, else the default export folder, else its project folder.
      defaultDirs: [exportDirFor(store), usePrefsStore.getState().exportDir || null, projectDir(store)],
      title: t('document.export.title', { format: format.toUpperCase() }),
      mime: FILE_FORMAT_INFO[format].mime
    })
    if (!target) return
    if (isElectron) rememberExportDir(store, dirname(target))
    const fileName = basename(target)
    if (built.warnings.length) {
      toast.warning(t('document.export.exportedWithWarnings', { fileName, count: built.warnings.length }), built.warnings.slice(0, 4).join('\n'))
    } else {
      toast.success(t('document.export.exported', { fileName }), built.stats, isElectron ? { label: t('document.export.showInFolder'), run: () => showInFolder(target) } : undefined)
    }
  } catch (e) {
    toast.error(t('document.export.failed'), errorMessage(e))
  }
}

/** What the batch export dialog answers. */
export interface BatchExportChoice {
  formats: FileFormat[]
  /** File name without extension. */
  name: string
  /** Folder the files go to (desktop app); null in a browser, where they are downloads. */
  dir: string | null
}

/** Export several formats at once: the dialog asks which, under what name and where. */
export function batchExport(store: DocStore = activeDocStore()): Promise<void> {
  return dialogFlow(() => batchExportAsked(store))
}

async function batchExportAsked(store: DocStore): Promise<void> {
  if (!store.getState().data) return
  // This document's last export folder, else the default export folder, else its project folder.
  const dir = await firstFolder([exportDirFor(store), usePrefsStore.getState().exportDir || null, projectDir(store)])
  const choice = await openDialog('batch-export', { name: suggestedBaseName(store), dir })
  if (!choice) return
  usePrefsStore.getState().set('batchFormats', choice.formats)

  try {
    const names = choice.formats.map((format) => `${choice.name}.${format}`)
    const targets = choice.dir === null ? null : names.map((name) => joinPath(choice.dir!, name))
    if (targets) {
      const existing = await existingPaths(targets)
      if (existing.length) {
        const answer = await confirmDialog({
          title: t('document.export.batch.replaceTitle', { count: existing.length }),
          message: t('document.export.batch.replaceMessage', { count: existing.length, files: existing.map(basename).join(', ') }),
          confirmLabel: t('document.export.batch.replace')
        })
        if (answer !== 'confirm') return
      }
    }

    const built = await buildFiles(choice.formats, store)
    for (const [i, file] of built.files.entries()) {
      if (targets) await saveFile({ data: file.data, suggestedName: names[i], filters: FILTERS[file.format], path: targets[i] })
      else download(file.data, names[i], FILE_FORMAT_INFO[file.format].mime)
    }
    if (targets && choice.dir) rememberExportDir(store, choice.dir)

    const count = built.files.length
    const done = choice.dir ? t('document.export.batch.exported', { count, folder: basename(choice.dir) || choice.dir }) : t('document.export.batch.downloaded', { count })
    if (built.warnings.length) {
      toast.warning(done, built.warnings.slice(0, 4).join('\n'))
    } else {
      toast.success(done, built.stats, targets ? { label: t('document.export.showInFolder'), run: () => showInFolder(targets[0]) } : undefined)
    }
  } catch (e) {
    toast.error(t('document.export.failed'), errorMessage(e))
  }
}
