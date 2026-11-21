import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react'
import { FileUp } from 'lucide-react'
import { useActiveDocStore, useDocStore, selectDirty } from './stores/doc-store'
import { commitFieldEdit, isTypingUncommitted, settleFieldFocus, subscribeTyping } from './components/ui/focus'
import { useApplyTheme } from './lib/theme'
import { useApplyLanguage } from './lib/language'
import { installKeyboard } from './app/commands'
import { guardAllUnsaved, openFontPath, startAutosave } from './app/document'
import { anyDirty, useAnyDirty } from './stores/workspace'
import { handleDroppedFiles } from './app/imports'
import { loadUnicodeDb } from './core/unicode'
import { native } from './platform'
import { Workspace } from './components/shell/Workspace'
import { Welcome } from './components/shell/Welcome'
import { ErrorBoundary } from './components/shell/ErrorBoundary'
import { DialogHost } from './components/dialogs/DialogHost'
import { ContextMenuHost } from './components/ui/Menu'
import { ToastHost, TooltipLayer } from './components/ui/Overlays'
import { usePairSelectionStore, useSelectionStore } from './stores/selection-store'
import { useUIStore } from './stores/ui-store'
import { usePrefsStore } from './stores/prefs-store'
import { afterDialogs, isDialogOpen, useDialogs } from './app/dialogs'
import { toast } from './components/ui/Overlays'
import * as documentApi from './app/document'
import * as actionsApi from './app/actions'
import * as clipboardApi from './app/clipboard'
import * as importsApi from './app/imports'
import * as commandsApi from './app/commands'
import * as bindingsApi from './app/bindings'
import * as kerningApi from './app/kerning'
import { t as translate, useTranslation } from './i18n'

// Dev-only handle for automated UI checks (same module instances as the app).
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__mkf = {
    doc: useDocStore,
    selection: useSelectionStore,
    pairSelection: usePairSelectionStore,
    kerning: kerningApi,
    ui: useUIStore,
    prefs: usePrefsStore,
    dialogs: useDialogs,
    document: documentApi,
    actions: actionsApi,
    clipboard: clipboardApi,
    imports: importsApi,
    commands: commandsApi,
    bindings: bindingsApi
  }
}

function useElectronIntegration(): void {
  const { t } = useTranslation()
  const dirty = useDocStore(selectDirty)
  const fileName = useDocStore((s) => s.fileName)
  const hasDoc = useDocStore((s) => !!s.data)
  const uiScale = usePrefsStore((s) => s.uiScale)

  useEffect(() => {
    native?.setZoomFactor(uiScale)
  }, [uiScale])

  useEffect(() => {
    // i18n-ignore: brand name
    const title = hasDoc ? t(dirty ? 'shell.windowTitleUnsaved' : 'shell.windowTitle', { name: fileName }) : 'MkFont'
    document.title = title
    native?.setTitle(title)
  }, [dirty, fileName, hasDoc, t])


  useEffect(() => {
    if (!native) return
    // One save prompt at a time: a second close request (double click on ×, Cmd+Q
    // while the prompt is open) waits for the answer to the first.
    let asking = false
    const offClose = native.onCloseRequest(() => {
      if (asking) return
      asking = true
      void guardAllUnsaved()
        .then((ok) => ok && native!.confirmClose())
        .finally(() => {
          asking = false
        })
    })
    // Opened from the system (Explorer, a second instance): waits for an open dialog.
    const offOpen = native.onOpenFile((p) => afterDialogs(() => void openFontPath(p)))
    void native.getStartupFile().then((p) => p && void openFontPath(p))
    return () => {
      offClose()
      offOpen()
    }
  }, [])

  // Browser: warn before leaving with unsaved changes.
  useEffect(() => {
    if (native) return
    const onBefore = (e: BeforeUnloadEvent): void => {
      commitFieldEdit()
      if (anyDirty()) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBefore)
    return () => window.removeEventListener('beforeunload', onBefore)
  }, [])
}

function useWindowDrop(): boolean {
  const [over, setOver] = useState(false)
  useEffect(() => {
    let depth = 0
    const hasFiles = (e: DragEvent): boolean => !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')
    const onEnter = (e: DragEvent): void => {
      if (!hasFiles(e)) return
      depth++
      setOver(true)
    }
    const onLeave = (e: DragEvent): void => {
      if (!hasFiles(e)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setOver(false)
    }
    const onOver = (e: DragEvent): void => {
      if (hasFiles(e)) e.preventDefault()
    }
    // Any drop ends the drag, also one a glyph slot handles (it stops propagation).
    const onDropCapture = (): void => {
      depth = 0
      setOver(false)
    }
    const onDrop = (e: DragEvent): void => {
      if (!hasFiles(e)) return
      e.preventDefault()
      // A dialog works on the font it was opened for: the files would land elsewhere.
      if (isDialogOpen()) {
        toast.info(translate('shell.drop.closeDialog'), translate('shell.drop.closeDialogDetail'))
        return
      }
      void handleDroppedFiles(Array.from(e.dataTransfer!.files))
    }
    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('dragover', onOver)
    window.addEventListener('drop', onDropCapture, true)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('dragover', onOver)
      window.removeEventListener('drop', onDropCapture, true)
      window.removeEventListener('drop', onDrop)
    }
  }, [])
  return over
}

/**
 * The window asks before closing while any open font has unsaved changes, or while a field
 * holds typed text (closing commits it, then asks). A component of its own: typing must not
 * re-render the whole app, and the main process hears only when the answer changes.
 */
function UnsavedReporter(): null {
  const someDirty = useAnyDirty()
  const typing = useSyncExternalStore(subscribeTyping, isTypingUncommitted)
  const unsaved = someDirty || typing
  useEffect(() => {
    native?.setDirty(unsaved)
  }, [unsaved])
  return null
}

/** After another font is shown: the field being typed in keeps focus (see `settleFieldFocus`). */
function FieldFocusKeeper(): null {
  const store = useActiveDocStore()
  useLayoutEffect(() => settleFieldFocus(), [store])
  return null
}

export default function App(): React.ReactElement {
  const { t } = useTranslation()
  useApplyTheme()
  useApplyLanguage()
  useElectronIntegration()
  const hasDoc = useDocStore((s) => !!s.data)
  const dropping = useWindowDrop()

  useEffect(() => installKeyboard(), [])
  useEffect(() => startAutosave(), [])
  useEffect(() => {
    void loadUnicodeDb()
  }, [])

  return (
    <>
      <ErrorBoundary>{hasDoc ? <Workspace /> : <Welcome />}</ErrorBoundary>
      {/* After the workspace: its layout effect runs once the new font's view is in place. */}
      <FieldFocusKeeper />
      <UnsavedReporter />
      <DialogHost />
      <ContextMenuHost />
      <TooltipLayer />
      <ToastHost />
      {dropping && (
        <div className="pointer-events-none fixed inset-2 z-[80] flex animate-fade-in items-center justify-center rounded-xl border-2 border-dashed border-accent bg-accent/10">
          <div className="flex items-center gap-2 rounded-lg bg-panel px-4 py-3 text-sm text-fg shadow-pop">
            <FileUp size={18} className="text-accent" />
            {t('shell.drop.hint')}
          </div>
        </div>
      )}
    </>
  )
}
