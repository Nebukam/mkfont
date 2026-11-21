import { Component, type ReactNode } from 'react'
import { AlertOctagon } from 'lucide-react'
import { activeDocStore, selectDirty, type DocStore } from '../../stores/doc-store'
import { openStores } from '../../stores/workspace'
import { FILTERS, saveFile, stripExtension } from '../../platform'
import { projectDir, serializeCurrent } from '../../app/document'
import { toast } from '../ui/Overlays'
import { errorMessage } from '../../lib/errors'
import { t } from '../../i18n'

/** What a rescue saves: every open font with unsaved changes, else the one shown. */
function rescueTargets(): DocStore[] {
  const dirty = openStores().filter((store) => selectDirty(store.getState()))
  return dirty.length ? dirty : [activeDocStore()].filter((store) => !!store.getState().data)
}

interface State {
  error: Error | null
}

/** Keeps a rendering crash from losing work: offers retry and a rescue save. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    console.error('MkFont UI error', error, info.componentStack)
  }

  /** One save dialog per font (the tabs are gone with the crashed UI). */
  private async rescue(): Promise<void> {
    for (const store of rescueTargets()) {
      const name = store.getState().fileName
      // One font that cannot be saved (its data may be what crashed) must not stop the others.
      try {
        const out = serializeCurrent(store)
        if (!out) continue
        await saveFile({
          data: out.json,
          suggestedName: `${stripExtension(name)}-rescued.mkfont`,
          filters: FILTERS.mkfont,
          title: t('shell.crash.rescueTitle', { name }),
          defaultDir: projectDir(store)
        })
      } catch (e) {
        toast.error(t('shell.crash.rescueFailed', { name }), errorMessage(e))
      }
    }
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    const count = rescueTargets().length
    return (
      <div className="flex h-full items-center justify-center bg-bg p-8">
        <div className="max-w-md rounded-lg border border-line bg-panel p-6 shadow-pop">
          <div className="mb-2 flex items-center gap-2 text-base font-semibold text-fg">
            <AlertOctagon size={18} className="text-danger" /> {t('shell.crash.title')}
          </div>
          <p className="text-sm text-muted">{t('shell.crash.message', { count: Math.max(1, openStores().length) })}</p>
          <pre className="mt-3 max-h-32 overflow-auto rounded bg-bg p-2 font-mono text-2xs text-subtle">{errorMessage(error)}</pre>
          <div className="mt-4 flex gap-2">
            <button type="button" className="h-8 rounded-md bg-accent-solid px-3 text-sm font-medium text-accent-fg" onClick={() => this.setState({ error: null })}>
              {t('shell.crash.retry')}
            </button>
            {count > 0 && (
              <button type="button" className="h-8 rounded-md border border-line px-3 text-sm text-fg hover:bg-hover" onClick={() => void this.rescue()}>
                {t('shell.crash.rescue', { count })}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
}
