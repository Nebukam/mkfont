import { useState } from 'react'
import { Files, FolderSearch } from 'lucide-react'
import { canExport, type BatchExportChoice } from '../../app/export'
import { FILE_FORMATS, type FileFormat } from '../../core/font-formats'
import { usePrefsStore } from '../../stores/prefs-store'
import { isElectron, pickFolder } from '../../platform'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Checkbox, Row, Rows, TextField } from '../ui/fields'
import { SubHeader } from '../ui/Section'
import { useTranslation } from '../../i18n'

/** What each format is, as in the Export menu. */
const HINTS = {
  ttf: 'menus.bar.exportTtfHint',
  otf: 'menus.bar.exportOtfHint',
  woff: 'menus.bar.exportWoffHint',
  woff2: 'menus.bar.exportWoff2Hint'
} as const satisfies Record<FileFormat, string>

/** A file name without the characters no file system takes, nor the dots and spaces Windows drops at its end. */
function cleanName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/[. ]+$/, '')
    .trim()
}

/** Batch export: which formats, under what file name, into which folder. */
export function BatchExportDialog({
  name: proposedName,
  dir: proposedDir,
  onClose
}: {
  name: string
  dir: string | null
  onClose: (choice: BatchExportChoice | null) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const [checked, setChecked] = useState<FileFormat[]>(() => usePrefsStore.getState().batchFormats.filter(canExport))
  const [name, setName] = useState(proposedName)
  const [dir, setDir] = useState(proposedDir)
  const fileName = cleanName(name)

  const chooseFolder = async (): Promise<string | null> => {
    const picked = await pickFolder(t('dialogs.batchExport.pickFolder'), dir)
    if (picked) setDir(picked)
    return picked
  }

  const confirm = async (): Promise<void> => {
    // The desktop app writes into a folder: ask for one when none is known yet.
    const target = isElectron ? (dir ?? (await chooseFolder())) : null
    if (isElectron && !target) return
    onClose({ formats: checked, name: fileName, dir: target })
  }

  return (
    <Dialog
      title={t('dialogs.batchExport.title')}
      subtitle={t('dialogs.batchExport.subtitle')}
      icon={Files}
      onClose={() => onClose(null)}
      width={460}
      footer={
        <>
          <Button onClick={() => onClose(null)}>{t('dialogs.cancel')}</Button>
          <Button variant="primary" disabled={!checked.length || !fileName} onClick={() => void confirm()} data-autofocus>
            {t('dialogs.batchExport.export', { count: checked.length })}
          </Button>
        </>
      }
    >
      <SubHeader>{t('dialogs.batchExport.formats')}</SubHeader>
      <ul className="mb-3 mt-1.5 flex flex-col gap-1.5">
        {FILE_FORMATS.map((format) => {
          const available = canExport(format)
          return (
            <li key={format} className="flex items-baseline gap-2">
              <Checkbox
                className="w-16 shrink-0 font-medium text-fg"
                checked={checked.includes(format)}
                disabled={!available}
                label={format.toUpperCase()}
                onChange={(on) => setChecked(FILE_FORMATS.filter((f) => (f === format ? on : checked.includes(f))))}
              />
              <span className="min-w-0 text-xs text-muted">{available ? t(HINTS[format]) : t('dialogs.batchExport.needsDesktopApp')}</span>
            </li>
          )
        })}
      </ul>
      <Rows>
        <Row label={t('dialogs.batchExport.fileName')} tip={t('dialogs.batchExport.fileNameTip')}>
          <TextField value={name} onChange={setName} commitOnType />
        </Row>
        {isElectron && (
          <Row label={t('dialogs.batchExport.folder')}>
            <span className="min-w-0 flex-1 truncate text-xs text-muted" data-tip={dir || undefined}>
              {dir ?? t('dialogs.batchExport.noFolder')}
            </span>
            <Button icon={FolderSearch} onClick={() => void chooseFolder()}>
              {t('dialogs.batchExport.choose')}
            </Button>
          </Row>
        )}
      </Rows>
      {!isElectron && <p className="mt-3 text-xs text-muted">{t('dialogs.batchExport.downloads')}</p>}
    </Dialog>
  )
}
