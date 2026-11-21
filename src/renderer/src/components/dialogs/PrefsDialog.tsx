import { Settings, FolderSearch, X } from 'lucide-react'
import { usePrefsStore, CELL_SIZE, UI_SCALE } from '../../stores/prefs-store'
import { Dialog } from '../ui/Dialog'
import { Button, IconButton } from '../ui/Button'
import { ColorField, NumberField, Row, Rows, Segmented, Select, Toggle } from '../ui/fields'
import { SubHeader } from '../ui/Section'
import { isElectron, native, basename, pickFolder } from '../../platform'
import { LANGUAGES, LANGUAGE_NAMES, systemLanguage, useTranslation } from '../../i18n'
import type { LanguagePref } from '../../stores/prefs-store'

export function PrefsDialog({ onClose }: { onClose: () => void }): React.ReactElement {
  const { t } = useTranslation()
  const p = usePrefsStore()
  return (
    <Dialog title={t('dialogs.prefs.title')} icon={Settings} onClose={onClose} width={520} footer={<Button variant="primary" onClick={onClose}>{t('dialogs.prefs.done')}</Button>}>
      <Rows>
        <SubHeader className="col-span-full">{t('dialogs.prefs.appearance')}</SubHeader>
        <Row label={t('dialogs.prefs.language')}>
          <Select<LanguagePref>
            value={p.language}
            onChange={(v) => p.set('language', v)}
            options={[
              { value: 'system', label: t('dialogs.prefs.systemLanguage', { language: LANGUAGE_NAMES[systemLanguage()] }) },
              ...LANGUAGES.map((lng) => ({ value: lng, label: LANGUAGE_NAMES[lng] }))
            ]}
            className="w-44"
          />
        </Row>
        <Row label={t('dialogs.prefs.theme')}>
          <Segmented
            value={p.theme}
            onChange={(v) => p.set('theme', v)}
            options={[
              { value: 'dark', label: t('dialogs.prefs.dark') },
              { value: 'light', label: t('dialogs.prefs.light') },
              { value: 'system', label: t('dialogs.prefs.system') }
            ]}
          />
        </Row>
        {isElectron && (
          <Row label={t('dialogs.prefs.uiScale')} tip={t('dialogs.prefs.uiScaleTip')}>
            <Select
              value={p.uiScale}
              onChange={(v) => p.set('uiScale', v)}
              options={Array.from({ length: Math.round((UI_SCALE.max - UI_SCALE.min) / UI_SCALE.step) + 1 }, (_, i) => {
                const v = Math.round((UI_SCALE.min + i * UI_SCALE.step) * 10) / 10
                return { value: v, label: `${Math.round(v * 100)}%` }
              })}
              className="w-24"
            />
          </Row>
        )}
        <Row label={t('dialogs.prefs.cellSize')}>
          <NumberField value={p.cellSize} min={CELL_SIZE.min} max={CELL_SIZE.max} step={4} suffix="px" onChange={(v) => v !== null && p.set('cellSize', v)} />
        </Row>
        <Row label={t('dialogs.prefs.slotLabels')}>
          <Toggle checked={p.showSlotLabels} onChange={(v) => p.set('showSlotLabels', v)} />
        </Row>

        <SubHeader className="col-span-full">{t('dialogs.prefs.import')}</SubHeader>
        <Row label={t('dialogs.prefs.markColor')} tip={t('dialogs.prefs.markColorTip')}>
          <ColorField value={p.markColor} onChange={(v) => p.set('markColor', v)} />
        </Row>

        <SubHeader className="col-span-full">{t('dialogs.prefs.export')}</SubHeader>
        <Row label={t('dialogs.prefs.format')} tip={t('dialogs.prefs.formatTip')}>
          <Segmented
            value={p.exportFormat}
            onChange={(v) => p.set('exportFormat', v)}
            options={[
              { value: 'ttf', label: 'TTF', tip: t('dialogs.prefs.ttfTip') },
              { value: 'otf', label: 'OTF', tip: t('dialogs.prefs.otfTip') },
              { value: 'woff', label: 'WOFF', tip: t('dialogs.prefs.woffTip') },
              { value: 'woff2', label: 'WOFF2', tip: t('dialogs.prefs.woff2Tip') }
            ]}
          />
        </Row>
        {isElectron && (
          <Row label={t('dialogs.prefs.folder')} tip={t('dialogs.prefs.folderTip')}>
            <span className="min-w-0 flex-1 truncate text-xs text-muted" data-tip={p.exportDir || undefined}>
              {p.exportDir ? basename(p.exportDir) || p.exportDir : t('dialogs.prefs.projectFolder')}
            </span>
            <Button
              icon={FolderSearch}
              onClick={async () => {
                const dir = await pickFolder(t('dialogs.prefs.pickExportFolder'), p.exportDir || null)
                if (dir) p.set('exportDir', dir)
              }}
            >
              {t('dialogs.prefs.choose')}
            </Button>
            {p.exportDir && <IconButton icon={X} tip={t('dialogs.prefs.useProjectFolder')} onClick={() => p.set('exportDir', '')} />}
          </Row>
        )}


        <SubHeader className="col-span-full">{t('dialogs.prefs.saving')}</SubHeader>
        <Row label={t('dialogs.prefs.autosave')} tip={t('dialogs.prefs.autosaveTip')}>
          <Toggle checked={p.autosave} onChange={(v) => p.set('autosave', v)} />
          <NumberField value={p.autosaveMinutes} min={1} max={120} suffix={t('dialogs.prefs.minutes')} ariaLabel={t('dialogs.prefs.autosaveEvery')} disabled={!p.autosave} onChange={(v) => v !== null && p.set('autosaveMinutes', v)} />
        </Row>

        {isElectron && (
          <>
            <SubHeader className="col-span-full">{t('dialogs.prefs.externalEditor')}</SubHeader>
            <Row label={t('dialogs.prefs.svgEditor')} tip={t('dialogs.prefs.svgEditorTip')}>
              <span className="min-w-0 flex-1 truncate text-xs text-muted" data-tip={p.svgEditorPath}>
                {p.svgEditorPath === 'system' ? t('dialogs.prefs.systemApp') : p.svgEditorPath ? basename(p.svgEditorPath) : t('dialogs.prefs.askFirst')}
              </span>
              <Button
                icon={FolderSearch}
                onClick={async () => {
                  const exe = await native!.pickExecutable(t('dialogs.prefs.pickEditor'))
                  if (exe) p.set('svgEditorPath', exe)
                }}
              >
                {t('dialogs.prefs.choose')}
              </Button>
              <Button onClick={() => p.set('svgEditorPath', 'system')}>{t('dialogs.prefs.systemButton')}</Button>
            </Row>
          </>
        )}
      </Rows>
    </Dialog>
  )
}
