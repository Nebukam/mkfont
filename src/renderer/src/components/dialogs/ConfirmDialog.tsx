import { AlertTriangle, HelpCircle } from 'lucide-react'
import type { ConfirmOptions, ConfirmResult } from '../../app/dialogs'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { useTranslation } from '../../i18n'

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  altLabel,
  cancelLabel,
  danger,
  onClose
}: ConfirmOptions & { onClose: (r: ConfirmResult) => void }): React.ReactElement {
  const { t } = useTranslation()
  return (
    <Dialog
      title={title}
      icon={danger ? AlertTriangle : HelpCircle}
      onClose={() => onClose(null)}
      width={440}
      describeBody
      footer={
        <>
          {altLabel && (
            <Button className="mr-auto" onClick={() => onClose('alt')}>
              {altLabel}
            </Button>
          )}
          <Button onClick={() => onClose(null)}>{cancelLabel ?? t('dialogs.cancel')}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => onClose('confirm')} data-autofocus>
            {confirmLabel ?? t('dialogs.ok')}
          </Button>
        </>
      }
    >
      {message && <p className="text-sm leading-relaxed text-muted">{message}</p>}
    </Dialog>
  )
}
