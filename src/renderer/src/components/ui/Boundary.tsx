// ============================================================
// Error boundaries for parts of the window. With React 19, an error thrown while
// rendering unmounts everything up to the nearest boundary: without one around a
// dialog, a menu or a panel, one bug there would blank the whole window.
// ============================================================

import { Component, type ReactNode } from 'react'
import { AlertOctagon } from 'lucide-react'
import { Button } from './Button'
import { useTranslation } from '../../i18n'
import { errorMessage } from '../../lib/errors'
import { cn } from '../../lib/cn'

interface BoundaryProps {
  /** Names the part in the console report. */
  name: string
  children: ReactNode
  /** Shown instead of the content after an error (nothing by default). */
  fallback?: (error: Error, retry: () => void) => ReactNode
  /** Runs once per error: close the dialog or menu that failed, tell the user. */
  onError?: (error: Error) => void
  /** The content gets another try when one of these changes (another font, panel or range). */
  resetKeys?: readonly unknown[]
}

interface BoundaryState {
  error: Error | null
  keys: readonly unknown[] | undefined
}

function sameKeys(a: readonly unknown[] | undefined, b: readonly unknown[] | undefined): boolean {
  return a === b || (!!a && !!b && a.length === b.length && a.every((v, i) => Object.is(v, b[i])))
}

/** Keeps an error thrown while rendering its content from taking the rest of the window down. */
export class Boundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { error: null, keys: this.props.resetKeys }

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { error }
  }

  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState): Partial<BoundaryState> | null {
    if (sameKeys(props.resetKeys, state.keys)) return null
    return { keys: props.resetKeys, error: null }
  }

  override componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    console.error(`MkFont UI error (${this.props.name})`, error, info.componentStack)
    this.props.onError?.(error)
  }

  private retry = (): void => this.setState({ error: null })

  override render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    return this.props.fallback?.(error, this.retry) ?? null
  }
}

/** What a panel shows after an error: the rest of the window keeps working. */
export function RegionError({ error, retry, className }: { error: Error; retry: () => void; className?: string }): React.ReactElement {
  const { t } = useTranslation()
  return (
    <div role="alert" className={cn('flex min-h-0 flex-col items-center justify-center gap-2 p-6 text-center', className)}>
      <AlertOctagon size={20} className="text-danger" aria-hidden />
      <p className="text-sm text-fg">{t('shell.crash.region')}</p>
      <p className="max-h-24 max-w-full overflow-auto break-words font-mono text-2xs text-subtle">{errorMessage(error)}</p>
      <Button onClick={retry}>{t('shell.crash.retry')}</Button>
    </div>
  )
}
