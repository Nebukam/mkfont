import { dismissDialog, useDialogs, type DialogKind, type OpenDialog } from '../../app/dialogs'
import { Boundary } from '../ui/Boundary'
import { toast } from '../ui/Overlays'
import { errorMessage } from '../../lib/errors'
import { t } from '../../i18n'
import { ConfirmDialog } from './ConfirmDialog'
import { GlyphPickerDialog } from './GlyphPickerDialog'
import { PrefsDialog } from './PrefsDialog'
import { ShortcutsDialog, AboutDialog } from './InfoDialogs'
import { CommandPalette } from './CommandPalette'
import { ImportSvgDialog } from './ImportSvgDialog'
import { ImportFontDialog } from './ImportFontDialog'
import { ImportMkfontDialog } from './ImportMkfontDialog'
import { LigatureFinderDialog } from './LigatureFinderDialog'
import { BatchExportDialog } from './BatchExportDialog'

type Renderer = (d: OpenDialog, close: (result: unknown) => void) => React.ReactElement

// Every kind has one: a dialog that never shows would block the keyboard for good.
const RENDERERS: Record<DialogKind, Renderer> = {
  confirm: (d, close) => <ConfirmDialog {...(d as OpenDialog<'confirm'>).props} onClose={close} />,
  'glyph-picker': (d, close) => <GlyphPickerDialog {...(d as OpenDialog<'glyph-picker'>).props} onClose={close} />,
  prefs: (_d, close) => <PrefsDialog onClose={() => close(undefined)} />,
  shortcuts: (_d, close) => <ShortcutsDialog onClose={() => close(undefined)} />,
  about: (_d, close) => <AboutDialog onClose={() => close(undefined)} />,
  palette: (_d, close) => <CommandPalette onClose={() => close(undefined)} />,
  'import-svg': (d, close) => <ImportSvgDialog {...(d as OpenDialog<'import-svg'>).props} onClose={close} />,
  'import-font': (d, close) => <ImportFontDialog {...(d as OpenDialog<'import-font'>).props} onClose={close} />,
  'import-mkfont': (d, close) => <ImportMkfontDialog {...(d as OpenDialog<'import-mkfont'>).props} onClose={close} />,
  ligatures: (_d, close) => <LigatureFinderDialog onClose={close} />,
  'batch-export': (d, close) => <BatchExportDialog {...(d as OpenDialog<'batch-export'>).props} onClose={close} />
}

/** A dialog that fails while showing closes as if cancelled; the others and the window stay. */
function dialogFailed(id: number, error: Error): void {
  dismissDialog(id)
  toast.error(t('shell.crash.dialogClosed'), errorMessage(error))
}

export function DialogHost(): React.ReactElement {
  const stack = useDialogs((s) => s.stack)
  const closeDialog = useDialogs((s) => s.close)
  return (
    <>
      {stack.map((d) => (
        <div key={d.id}>
          <Boundary name={d.kind} onError={(e) => dialogFailed(d.id, e)}>
            {RENDERERS[d.kind](d, (result) => closeDialog(d.id, result))}
          </Boundary>
        </div>
      ))}
    </>
  )
}
