import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { IconButton } from './Button'
import { useModal } from './modal'
import { useTranslation } from '../../i18n'

export function Dialog({
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  onClose,
  width = 560,
  className,
  bodyClassName,
  describeBody
}: {
  title: ReactNode
  subtitle?: ReactNode
  icon?: React.ComponentType<{ size?: number; className?: string }>
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  width?: number
  className?: string
  bodyClassName?: string
  /** The body is a short message (prompts): screen readers read it with the title. */
  describeBody?: boolean
}): React.ReactElement {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const id = useId()
  useModal(overlayRef, panelRef, onClose)

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/50 p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={describeBody ? `${id}-body` : subtitle ? `${id}-subtitle` : undefined}
        tabIndex={-1}
        className={cn('flex max-h-full animate-pop-in flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-pop outline-none', className)}
        style={{ width, maxWidth: '100%' }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start gap-2.5 border-b border-line px-4 py-3">
          {Icon && <Icon size={16} className="mt-0.5 shrink-0 text-accent" />}
          <div className="min-w-0 flex-1">
            <h2 id={`${id}-title`} className="text-base font-semibold text-fg">
              {title}
            </h2>
            {subtitle && (
              <p id={`${id}-subtitle`} className="mt-0.5 text-xs text-muted">
                {subtitle}
              </p>
            )}
          </div>
          <IconButton icon={X} tip={t('ui.dialog.close')} onClick={onClose} className="-mr-1 -mt-0.5" />
        </header>
        <div id={`${id}-body`} className={cn('min-h-0 flex-1 overflow-y-auto px-4 py-3', bodyClassName)}>
          {children}
        </div>
        {footer && <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-bg/40 px-4 py-2.5">{footer}</footer>}
      </div>
    </div>,
    document.body
  )
}
