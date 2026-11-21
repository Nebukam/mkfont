import { useEffect, useState } from 'react'
import { FileDown, FilePlus2, FolderOpen, Images, Keyboard, RefreshCw, Settings, Sparkles, X } from 'lucide-react'
import { Logo } from './Logo'
import { newFont, openFontDialog, openFontPath, loadSample } from '../../app/document'
import { importFontFileFlow, newFontFromSvgsFlow } from '../../app/imports'
import { appVersion, checkForUpdates } from '../../app/updates'
import { getRecentFiles, removeRecentFile, basename, isElectron } from '../../platform'
import { openDialog } from '../../app/dialogs'
import { shortcutLabel } from '../../app/commands'
import { UCD_VERSION } from '../../core/unicode'
import { useTranslation } from '../../i18n'

export function Welcome(): React.ReactElement {
  const { t } = useTranslation()
  const [recent, setRecent] = useState<string[]>([])
  const [version, setVersion] = useState(__APP_VERSION__)
  useEffect(() => {
    void getRecentFiles().then(setRecent)
    void appVersion().then(setVersion)
  }, [])

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-8">
        <div className="flex w-full max-w-[720px] flex-col gap-8 md:flex-row">
          <div className="flex-1">
            <div className="mb-6 flex items-center gap-3">
              <Logo size={44} />
              <div>
                {/* i18n-ignore: brand name */}
                <h1 className="text-2xl font-semibold text-fg">MkFont</h1>
                <p className="text-sm text-muted">{t('shell.welcome.tagline')}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Action icon={FilePlus2} title={t('shell.welcome.newFont')} detail={t('shell.welcome.newFontDetail')} shortcut={shortcutLabel('file.new')} onClick={() => void newFont()} primary />
              <Action icon={FolderOpen} title={t('shell.welcome.open')} detail={t('shell.welcome.openDetail')} shortcut={shortcutLabel('file.open')} onClick={() => void openFontDialog()} />
              <Action icon={FileDown} title={t('shell.welcome.fromFontFile')} detail={t('shell.welcome.fromFontFileDetail')} onClick={() => void importFontFileFlow(true)} />
              <Action icon={Images} title={t('shell.welcome.fromSvgs')} detail={t('shell.welcome.fromSvgsDetail')} onClick={() => void newFontFromSvgsFlow()} />
              <Action icon={Sparkles} title={t('shell.welcome.sample')} detail={t('shell.welcome.sampleDetail')} onClick={() => void loadSample()} />
            </div>
            <p className="mt-4 text-xs text-subtle">{t('shell.welcome.dropHint')}</p>
          </div>

          <div className="w-full md:w-[280px]">
            <div className="label-xs mb-2">{t('shell.welcome.recent')}</div>
            {recent.length === 0 ? (
              <p className="rounded-md border border-dashed border-line px-3 py-4 text-xs text-subtle">
                {isElectron ? t('shell.welcome.noRecent') : t('shell.welcome.recentNeedsDesktop')}
              </p>
            ) : (
              <ul className="flex flex-col" aria-label={t('shell.welcome.recentFiles')}>
                {recent.map((p) => (
                  <li key={p} className="group flex items-center rounded hover:bg-hover">
                    <button type="button" className="min-w-0 flex-1 px-2 py-1.5 text-left" onClick={() => void openFontPath(p)} data-tip={p}>
                      <div className="truncate text-sm text-fg">{basename(p)}</div>
                      <div className="truncate text-2xs text-subtle">{p.split(/[\\/]/).slice(-3, -1).join('/')}</div>
                    </button>
                    <button
                      type="button"
                      data-remove-recent
                      aria-label={t('shell.welcome.removeRecent', { name: basename(p) })}
                      data-tip={t('shell.welcome.removeRecentTip')}
                      // Hidden by opacity, not display, so the keyboard can reach it; it shows with the row hovered or focused.
                      className="mr-1 flex h-6 w-6 items-center justify-center rounded text-subtle opacity-0 transition-opacity hover:text-fg group-focus-within:opacity-100 group-hover:opacity-100"
                      onClick={(e) => {
                        // This row goes away: focus the same button on the next row, else on the previous one.
                        const row = e.currentTarget.closest('li')
                        const neighbour = (row?.nextElementSibling ?? row?.previousElementSibling)?.querySelector<HTMLElement>('[data-remove-recent]')
                        void removeRecentFile(p)
                        setRecent(recent.filter((x) => x !== p))
                        neighbour?.focus()
                      }}
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <footer className="flex h-8 shrink-0 items-center gap-4 border-t border-line px-4 text-xs text-subtle">
        <span>{t('shell.welcome.appVersion', { version })}</span>
        <span>{t('shell.welcome.unicodeVersion', { version: UCD_VERSION })}</span>
        <button type="button" className="flex items-center gap-1 hover:text-fg" onClick={() => void checkForUpdates(true)}>
          <RefreshCw size={12} /> {t('shell.welcome.checkUpdates')}
        </button>
        <button type="button" className="ml-auto flex items-center gap-1 hover:text-fg" onClick={() => void openDialog('shortcuts', {})}>
          <Keyboard size={12} /> {t('shell.welcome.shortcuts')}
        </button>
        <button type="button" className="flex items-center gap-1 hover:text-fg" onClick={() => void openDialog('prefs', {})}>
          <Settings size={12} /> {t('shell.welcome.preferences')}
        </button>
      </footer>
    </div>
  )
}

function Action({
  icon: Icon,
  title,
  detail,
  shortcut,
  onClick,
  primary
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  detail: string
  shortcut?: string
  onClick: () => void
  primary?: boolean
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? 'flex items-center gap-3 rounded-lg border border-accent/50 bg-accent/10 px-3.5 py-3 text-left transition-colors hover:bg-accent/15'
          : 'flex items-center gap-3 rounded-lg border border-line bg-panel px-3.5 py-3 text-left transition-colors hover:border-line-strong hover:bg-hover'
      }
    >
      <Icon size={20} className={primary ? 'text-accent' : 'text-muted'} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-fg">{title}</div>
        <div className="truncate text-xs text-muted">{detail}</div>
      </div>
      {shortcut && <kbd className="rounded border border-line px-1.5 py-px font-mono text-2xs text-subtle">{shortcut}</kbd>}
    </button>
  )
}
