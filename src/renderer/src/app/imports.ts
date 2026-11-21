// ============================================================
// Import entry points (pickers, drag & drop).
// ============================================================

import { useDocStore, transact } from '../stores/doc-store'
import { usePrefsStore } from '../stores/prefs-store'
import { FILTERS, pickFiles, readBrowserFile, type PickedFile } from '../platform'
import { parseSvg } from '../core/import-svg'
import { applySvgImport } from '../core/ops'
import { glyphLabel } from '../core/unicode-keys'
import { openDialog } from './dialogs'
import { loadMkFontText, openNewFont } from './document'
import { bind } from './bindings'
import { toast } from '../components/ui/Overlays'
import { t, tm } from '../i18n'

export async function importSvgFlow(files?: PickedFile[]): Promise<void> {
  if (!useDocStore.getState().data) return
  const list = files ?? (await pickFiles({ title: t('imports.pick.svgFiles'), filters: FILTERS.svg, multi: true }))
  if (!list.length) return
  await openDialog('import-svg', { files: list })
}

/** v1 CmdStartNewFromSVGs: a new font (in a new tab), then the batch import of the picked files. */
export async function newFontFromSvgsFlow(): Promise<void> {
  const list = await pickFiles({ title: t('imports.pick.newFontFromSvgs'), filters: FILTERS.svg, multi: true })
  if (!list.length) return
  openNewFont()
  await openDialog('import-svg', { files: list })
}

export async function importFontFileFlow(asNew: boolean, file?: PickedFile): Promise<void> {
  const f = file ?? (await pickFiles({ title: t('imports.pick.fontFile'), filters: FILTERS.font, binary: true }))[0]
  if (!f) return
  await openDialog('import-font', { file: f, asNew })
}

export async function importMkfontFlow(file?: PickedFile): Promise<void> {
  const f = file ?? (await pickFiles({ title: t('imports.pick.mkfont'), filters: FILTERS.mkfont }))[0]
  if (!f) return
  await openDialog('import-mkfont', { file: f })
}

/** Import one SVG into a specific glyph (drop on a slot / inspector button). */
export function importSvgIntoGlyph(key: string, file: PickedFile, bindFile = true): boolean {
  const s = useDocStore.getState()
  if (!s.data || file.text === undefined) return false
  const parsed = parseSvg(file.text, usePrefsStore.getState().markColor)
  if (!parsed.exists) {
    toast.warning(t('imports.svg.couldNotImport', { fileName: file.name }), parsed.error ? tm(parsed.error) : t('imports.svg.fileNoPaths'))
    return false
  }
  const ok = transact(t('imports.svg.intoGlyph', { fileName: file.name, glyph: glyphLabel(key) }), (d) => {
    applySvgImport(d, key, parsed)
  }, { icon: 'import' })
  if (ok && bindFile && file.path) bind(key, file.path)
  return ok
}

export async function pickSvgForGlyph(key: string): Promise<void> {
  const [file] = await pickFiles({ title: t('imports.pick.svg'), filters: FILTERS.svg })
  if (file) importSvgIntoGlyph(key, file)
}

function ext(name: string): string {
  const m = /\.([^.]+)$/.exec(name)
  return m ? m[1].toLowerCase() : ''
}

/** Route dropped files: .mkfont opens, .svg imports, font files import glyphs. */
export async function handleDroppedFiles(files: File[], targetKey?: string | null): Promise<void> {
  if (!files.length) return
  const byExt = (e: string[]): File[] => files.filter((f) => e.includes(ext(f.name)))
  const mk = byExt(['mkfont'])
  const svgs = byExt(['svg'])
  const fonts = byExt(['ttf', 'otf', 'woff'])

  if (mk.length) {
    // Each project opens in a tab of its own.
    for (const file of mk) {
      const f = await readBrowserFile(file, false)
      loadMkFontText(f.text ?? '', f.path, f.name)
    }
    return
  }
  if (!useDocStore.getState().data) {
    if (fonts.length) await importFontFileFlow(true, await readBrowserFile(fonts[0], true))
    else if (svgs.length) toast.info(t('imports.openFontFirst'), t('imports.openFontFirstDetail'))
    return
  }
  if (svgs.length) {
    const picked = await Promise.all(svgs.map((f) => readBrowserFile(f, false)))
    if (targetKey && picked.length === 1) importSvgIntoGlyph(targetKey, picked[0])
    else await importSvgFlow(picked)
    return
  }
  if (fonts.length) await importFontFileFlow(false, await readBrowserFile(fonts[0], true))
}
