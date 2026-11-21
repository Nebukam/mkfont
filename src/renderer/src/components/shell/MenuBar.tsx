import { useEffect, useState } from 'react'
import { ChevronDown, Download, Redo2, Undo2, Upload } from 'lucide-react'
import { useDocStore } from '../../stores/doc-store'
import { COMMAND_GROUPS, COMMANDS, commandLabel, commandTip, groupLabel, isEnabled, runCommand, shortcutLabel, type CommandGroup } from '../../app/commands'
import { openFontPath, loadSample } from '../../app/document'
import { getRecentFiles, basename, isElectron, openExternal } from '../../platform'
import { DropdownMenu, type MenuItem } from '../ui/Menu'
import { Button, IconButton } from '../ui/Button'
import { Logo } from './Logo'
import { DocTabs } from './DocTabs'
import { cn } from '../../lib/cn'
import { useTranslation } from '../../i18n'

/** Separators between logical command clusters. */
const BREAK_BEFORE = new Set([
  'file.save',
  'file.importSvg',
  'file.export',
  'file.close',
  'edit.copy',
  'edit.delete',
  'select.existing',
  'glyph.compose',
  'glyph.editExternal',
  'glyph.copyChars',
  'view.back',
  'view.nextTab',
  'view.left',
  'view.panel.browse',
  'view.zoomIn',
  'view.uiBigger',
  'view.theme'
])

function useRecentFiles(): string[] {
  const [recent, setRecent] = useState<string[]>([])
  const docId = useDocStore((s) => s.docId)
  useEffect(() => {
    void getRecentFiles().then(setRecent)
  }, [docId])
  return recent
}

export function MenuBar(): React.ReactElement {
  const hasDoc = useDocStore((s) => !!s.data)
  const cursor = useDocStore((s) => s.cursor)
  const historyLen = useDocStore((s) => s.history.length)
  const recent = useRecentFiles()
  const { t } = useTranslation()

  /** A menu: the group's commands, in registry order. */
  const itemsFor = (group: CommandGroup): MenuItem[] => {
    const out: MenuItem[] = []
    for (const c of COMMANDS) {
      if (c.group !== group || c.hidden) continue
      if (BREAK_BEFORE.has(c.id) && out.length) out.push('separator')
      out.push({ label: c.label, icon: c.icon, shortcut: shortcutLabel(c.id), disabled: !isEnabled(c.id), onSelect: () => runCommand(c.id) })
      if (c.id === 'file.open') {
        out.push({
          label: t('menus.bar.openRecent'),
          disabled: !recent.length && isElectron,
          submenu: recent.length
            ? recent.map((p) => ({ label: basename(p), hint: p, onSelect: () => void openFontPath(p) }))
            : [{ label: isElectron ? t('menus.bar.noRecent') : t('menus.bar.recentNeedsDesktop'), disabled: true }]
        })
        out.push({ label: t('menus.bar.openSample'), onSelect: () => void loadSample() })
      }
    }
    if (group === 'Help') {
      out.push('separator')
      out.push({ label: t('menus.bar.github'), onSelect: () => openExternal('https://github.com/Nebukam/mkfont') })
    }
    return out
  }

  return (
    <div className="flex h-9 shrink-0 items-center gap-1 border-b border-line bg-panel px-2">
      <Logo className="mr-1.5" />
      <nav className="flex items-center" aria-label={t('menus.bar.label')}>
        {COMMAND_GROUPS.map((g) => (
          <DropdownMenu
            key={g}
            minWidth={250}
            items={() => itemsFor(g)}
            trigger={({ toggle, open }) => (
              <button
                type="button"
                onClick={toggle}
                className={cn('h-7 rounded px-2.5 text-sm transition-colors', open ? 'bg-hover text-fg' : 'text-muted hover:bg-hover hover:text-fg')}
              >
                {groupLabel(g)}
              </button>
            )}
          />
        ))}
      </nav>

      <div className="mx-2 flex min-w-0 flex-1 items-center">
        <DocTabs />
      </div>

      {hasDoc && (
        <div className="flex items-center gap-1">
          <IconButton icon={Undo2} tip={commandTip('edit.undo')} disabled={cursor === 0} onClick={() => runCommand('edit.undo')} />
          <IconButton icon={Redo2} tip={commandTip('edit.redo')} disabled={cursor >= historyLen} onClick={() => runCommand('edit.redo')} />
          <div className="mx-1 h-5 w-px bg-line" />
          <DropdownMenu
            align="end"
            minWidth={260}
            items={() => [
              { label: t('menus.bar.importSvg'), shortcut: shortcutLabel('file.importSvg'), onSelect: () => runCommand('file.importSvg') },
              { label: t('menus.bar.importFont'), onSelect: () => runCommand('file.importFont') },
              { label: t('menus.bar.importMkfont'), onSelect: () => runCommand('file.importMkfont') },
              'separator',
              { label: commandLabel('glyph.ligatureFinder'), onSelect: () => runCommand('glyph.ligatureFinder') }
            ]}
            trigger={({ toggle, open }) => (
              <Button icon={Download} iconRight={ChevronDown} onClick={toggle} active={open}>
                {t('menus.bar.import')}
              </Button>
            )}
          />
          <div className="flex">
            <Button variant="primary" icon={Upload} className="rounded-r-none" onClick={() => runCommand('file.export')} tip={commandTip('file.export')}>
              {t('menus.bar.export')}
            </Button>
            <DropdownMenu
              align="end"
              minWidth={220}
              items={() => [
                { label: t('menus.bar.exportTtf'), hint: t('menus.bar.exportTtfHint'), onSelect: () => runCommand('file.exportTtf') },
                { label: t('menus.bar.exportOtf'), hint: t('menus.bar.exportOtfHint'), onSelect: () => runCommand('file.exportOtf') },
                { label: t('menus.bar.exportWoff'), hint: t('menus.bar.exportWoffHint'), onSelect: () => runCommand('file.exportWoff') },
                { label: t('menus.bar.exportWoff2'), hint: t('menus.bar.exportWoff2Hint'), onSelect: () => runCommand('file.exportWoff2') },
                'separator',
                { label: commandLabel('file.exportBatch'), onSelect: () => runCommand('file.exportBatch') },
                'separator',
                { label: t('menus.bar.exportOptions'), onSelect: () => runCommand('app.prefs') }
              ]}
              trigger={({ toggle, open }) => (
                <Button variant="primary" className="rounded-l-none border-l border-l-black/20 !px-1" onClick={toggle} active={open} aria-label={t('menus.bar.exportMenu')}>
                  <ChevronDown size={13} />
                </Button>
              )}
            />
          </div>
        </div>
      )}
    </div>
  )
}
