import { useRef } from 'react'
import { BookType, History, LayoutGrid, Moon, PanelRight, Settings, Sun, Type } from 'lucide-react'
import { isPairRange, useUIStore, type LeftTab } from '../../stores/ui-store'
import { usePrefsStore, CELL_SIZE, PANEL_WIDTH } from '../../stores/prefs-store'
import { useDocStore } from '../../stores/doc-store'
import { usePairSelectionStore, useSelectionStore } from '../../stores/selection-store'
import { isPairKey, pairLabel, pairSides } from '../../core/kerning'
import { useSuggestionUpdater } from '../../app/kern-suggestions'
import { formatNumber, Slider } from '../ui/fields'
import { MenuBar } from './MenuBar'
import { Viewport } from '../viewport/Viewport'
import { Inspector } from '../inspector/Inspector'
import { OutlineEditorHost } from '../outline-editor/OutlineEditor'
import { BrowsePanel } from '../sidebar/BrowsePanel'
import { PreviewPanel } from '../sidebar/PreviewPanel'
import { HistoryPanel } from '../sidebar/HistoryPanel'
import { FontPanel } from '../sidebar/FontPanel'
import { openDialog } from '../../app/dialogs'
import { runCommand, shortcutLabel } from '../../app/commands'
import { UCD_VERSION, getKeyName } from '../../core/unicode'
import { formatKey, keyToDisplayChars } from '../../core/unicode-keys'
import { useUnicodeDb } from '../../hooks/doc'
import { cn } from '../../lib/cn'
import { Boundary, RegionError } from '../ui/Boundary'
import { Trans, useTranslation } from '../../i18n'

const TABS = [
  { id: 'browse', icon: LayoutGrid, label: 'shell.panels.browse', command: 'view.panel.browse' },
  { id: 'preview', icon: Type, label: 'shell.panels.preview', command: 'view.panel.preview' },
  { id: 'history', icon: History, label: 'shell.panels.history', command: 'view.panel.history' },
  { id: 'font', icon: BookType, label: 'shell.panels.font', command: 'view.panel.font' }
] as const satisfies readonly { id: LeftTab; icon: React.ComponentType<{ size?: number }>; label: string; command: string }[]

const SIDEBAR_ID = 'workspace-sidebar'
const INSPECTOR_ID = 'workspace-inspector'

export function Workspace(): React.ReactElement {
  const { t } = useTranslation()
  // Suggested kerning of the font shown, measured again once edits pause.
  useSuggestionUpdater()
  const leftOpen = useUIStore((s) => s.leftOpen)
  const rightOpen = useUIStore((s) => s.rightOpen)
  const leftTab = useUIStore((s) => s.leftTab)
  const leftWidth = usePrefsStore((s) => s.leftWidth)
  const rightWidth = usePrefsStore((s) => s.rightWidth)
  const docId = useDocStore((s) => s.docId)

  return (
    <div className="flex h-full flex-col">
      <MenuBar />
      <div className="flex min-h-0 flex-1">
        <ActivityBar />
        {leftOpen && (
          <>
            <aside id={SIDEBAR_ID} className="flex min-w-0 shrink-0 flex-col border-r border-line bg-panel" style={{ width: leftWidth }} aria-label={t('shell.sidebar')}>
              <Boundary name="sidebar" resetKeys={[docId, leftTab]} fallback={regionFallback}>
                {leftTab === 'browse' && <BrowsePanel />}
                {leftTab === 'preview' && <PreviewPanel />}
                {leftTab === 'history' && <HistoryPanel />}
                {leftTab === 'font' && <FontPanel />}
              </Boundary>
            </aside>
            <Resizer side="left" controls={SIDEBAR_ID} />
          </>
        )}
        <SafeViewport />
        {rightOpen && (
          <>
            <Resizer side="right" controls={INSPECTOR_ID} />
            <aside id={INSPECTOR_ID} className="flex min-w-0 shrink-0 flex-col border-l border-line bg-panel" style={{ width: rightWidth }} aria-label={t('shell.inspector')}>
              <SafeInspector />
            </aside>
          </>
        )}
      </div>
      <StatusBar />
      {/* Floats over the panels; inside the app's root, so an open dialog covers it too. */}
      <OutlineEditorHost />
    </div>
  )
}

// Each panel has its own error boundary: one that fails shows an error in its place, the
// rest of the window keeps working, and it tries again in another font, panel, range or
// selection (or on "Try again").
const regionFallback = (error: Error, retry: () => void): React.ReactNode => <RegionError error={error} retry={retry} className="flex-1" />

function SafeViewport(): React.ReactElement {
  const docId = useDocStore((s) => s.docId)
  const range = useUIStore((s) => s.range)
  return (
    <Boundary
      name="viewport"
      resetKeys={[docId, range]}
      fallback={(error, retry) => <RegionError error={error} retry={retry} className="min-w-0 flex-1 bg-bg" />}
    >
      <Viewport />
    </Boundary>
  )
}

function SafeInspector(): React.ReactElement {
  const docId = useDocStore((s) => s.docId)
  const keys = useSelectionStore((s) => s.keys)
  const pairs = usePairSelectionStore((s) => s.keys)
  return (
    <Boundary name="inspector" resetKeys={[docId, keys, pairs]} fallback={regionFallback}>
      <Inspector />
    </Boundary>
  )
}

function ActivityBar(): React.ReactElement {
  const { t } = useTranslation()
  const leftTab = useUIStore((s) => s.leftTab)
  const leftOpen = useUIStore((s) => s.leftOpen)
  const rightOpen = useUIStore((s) => s.rightOpen)
  const theme = usePrefsStore((s) => s.theme)
  const resolvedLight = theme === 'light' || (theme === 'system' && document.documentElement.dataset.theme === 'light')
  return (
    <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-line bg-panel py-2">
      {TABS.map((tab) => {
        const active = leftOpen && leftTab === tab.id
        const Icon = tab.icon
        const shortcut = shortcutLabel(tab.command)
        return (
          <button
            key={tab.id}
            type="button"
            data-tip={shortcut ? t('shell.withShortcut', { label: t(tab.label), shortcut }) : t(tab.label)}
            aria-label={t(tab.label)}
            aria-pressed={active}
            onClick={() => useUIStore.getState().setLeftTab(tab.id)}
            className={cn(
              'relative flex h-9 w-9 items-center justify-center rounded-md transition-colors',
              active ? 'bg-accent/15 text-accent' : 'text-subtle hover:bg-hover hover:text-fg'
            )}
          >
            {active && <span className="absolute -left-1 h-5 w-0.5 rounded-full bg-accent" />}
            <Icon size={18} />
          </button>
        )
      })}
      <div className="mt-auto flex flex-col gap-1">
        <button
          type="button"
          data-tip={rightOpen ? t('shell.hideInspector') : t('shell.showInspector')}
          aria-label={rightOpen ? t('shell.hideInspector') : t('shell.showInspector')}
          onClick={() => useUIStore.getState().toggleRight()}
          className={cn('flex h-9 w-9 items-center justify-center rounded-md hover:bg-hover', rightOpen ? 'text-fg' : 'text-subtle')}
        >
          <PanelRight size={17} />
        </button>
        <button
          type="button"
          data-tip={resolvedLight ? t('shell.darkTheme') : t('shell.lightTheme')}
          aria-label={resolvedLight ? t('shell.darkTheme') : t('shell.lightTheme')}
          onClick={() => runCommand('view.theme')}
          className="flex h-9 w-9 items-center justify-center rounded-md text-subtle hover:bg-hover hover:text-fg"
        >
          {resolvedLight ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        <button
          type="button"
          data-tip={t('shell.preferences')}
          aria-label={t('shell.preferences')}
          onClick={() => void openDialog('prefs', {})}
          className="flex h-9 w-9 items-center justify-center rounded-md text-subtle hover:bg-hover hover:text-fg"
        >
          <Settings size={17} />
        </button>
      </div>
    </div>
  )
}

/** Panel resize handle: drag it, or focus it and use the arrow keys (Shift: bigger steps). */
function Resizer({ side, controls }: { side: 'left' | 'right'; controls: string }): React.ReactElement {
  const { t } = useTranslation()
  const start = useRef<{ x: number; w: number } | null>(null)
  const key = side === 'left' ? 'leftWidth' : 'rightWidth'
  const width = usePrefsStore((s) => s[key])
  const setWidth = (w: number): void => usePrefsStore.getState().set(key, Math.max(PANEL_WIDTH.min, Math.min(PANEL_WIDTH.max, w)))
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={side === 'left' ? t('shell.resizeSidebar') : t('shell.resizeInspector')}
      aria-controls={controls}
      aria-valuenow={width}
      aria-valuemin={PANEL_WIDTH.min}
      aria-valuemax={PANEL_WIDTH.max}
      aria-valuetext={t('shell.pixels', { value: width })}
      tabIndex={0}
      className="group relative z-10 -mx-1 w-2 shrink-0 cursor-col-resize outline-none"
      onKeyDown={(e) => {
        // Alt+arrows stay with Back / Forward.
        if (e.altKey || e.ctrlKey || e.metaKey) return
        // Arrows move the handle: right widens the sidebar, left widens the inspector.
        const step = (e.shiftKey ? 64 : 16) * (side === 'left' ? 1 : -1)
        const current = usePrefsStore.getState()[key]
        let w: number
        switch (e.key) {
          case 'ArrowLeft': w = current - step; break
          case 'ArrowRight': w = current + step; break
          case 'Home': w = PANEL_WIDTH.min; break
          case 'End': w = PANEL_WIDTH.max; break
          default: return
        }
        e.preventDefault()
        setWidth(w)
      }}
      onPointerDown={(e) => {
        e.preventDefault()
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        start.current = { x: e.clientX, w: usePrefsStore.getState()[key] }
      }}
      onPointerMove={(e) => {
        if (!start.current) return
        const dx = e.clientX - start.current.x
        setWidth(side === 'left' ? start.current.w + dx : start.current.w - dx)
      }}
      onPointerUp={() => {
        start.current = null
      }}
      onDoubleClick={() => usePrefsStore.getState().set(key, side === 'left' ? PANEL_WIDTH.left : PANEL_WIDTH.right)}
    >
      {/* The line doubles as the focus indicator (the handle opts out of the outline ring). */}
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-accent/60 group-focus-visible:w-0.5 group-focus-visible:bg-accent" />
    </div>
  )
}

function StatusBar(): React.ReactElement {
  const { t } = useTranslation()
  const count = useDocStore((s) => s.data?.glyphs.size ?? 0)
  const values = useDocStore((s) => s.data?.family.values)
  const pairView = useUIStore((s) => isPairRange(s.range))
  const glyphSel = useSelectionStore((s) => s.keys.length)
  const pairSel = usePairSelectionStore((s) => s.keys.length)
  const sel = pairView ? pairSel : glyphSel
  const cellSize = usePrefsStore((s) => s.cellSize)
  const showLabels = usePrefsStore((s) => s.showSlotLabels)
  const hover = useUIStore((s) => s.hoverKey)
  const hoverKern = useDocStore((s) => (hover && isPairKey(hover) ? s.data?.kerning.get(hover) : undefined))
  useUnicodeDb()
  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-line bg-panel px-3 text-xs text-muted">
      <span>
        <Trans i18nKey="shell.status.glyphs" values={{ count }} components={{ n: <span className="text-fg" /> }} />
      </span>
      {sel > 0 && <span className="text-accent">{t('shell.status.selected', { count: sel })}</span>}
      {hover && isPairKey(hover) ? (
        <span className="min-w-0 truncate">
          <span className="text-fg">{pairLabel(hover)}</span>{' '}
          <span className="font-mono text-2xs">{pairSides(hover).map(formatKey).join(' ')}</span>
          {hoverKern !== undefined && <>{' '}{t('shell.status.kerning', { value: formatNumber(hoverKern, 2) })}</>}
        </span>
      ) : hover ? (
        <span className="min-w-0 truncate">
          <span className="text-fg">{keyToDisplayChars(hover)}</span> <span className="font-mono text-2xs">{formatKey(hover)}</span>{' '}
          {getKeyName(hover)?.toLowerCase()}
        </span>
      ) : values && (
        <span className="hidden font-mono text-2xs md:inline" data-tip={t('shell.status.metricsTip')}>
          {t('shell.status.metrics', { em: values.em, baseline: values.baseline, ascent: values.ascent, descent: values.descent })}
        </span>
      )}
      <div className="ml-auto flex items-center gap-2">
        <button type="button" className="hover:text-fg" onClick={() => usePrefsStore.getState().set('showSlotLabels', !showLabels)} data-tip={t('shell.status.toggleLabels')}>
          {showLabels ? t('shell.status.labelsOn') : t('shell.status.labelsOff')}
        </button>
        <Slider
          min={CELL_SIZE.min}
          max={CELL_SIZE.max}
          step={4}
          value={cellSize}
          onChange={(v) => usePrefsStore.getState().set('cellSize', v)}
          className="w-28"
          aria-label={t('shell.status.cellSize')}
          data-tip={t('shell.status.cellSizeTip')}
        />
        <span className="w-8 text-right font-mono text-2xs">{cellSize}</span>
        <span className="text-2xs text-subtle" data-tip={t('shell.status.ucdTip')}>
          {t('shell.status.ucd', { version: UCD_VERSION })}
        </span>
      </div>
    </footer>
  )
}
