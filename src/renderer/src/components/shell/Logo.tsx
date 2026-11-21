import logoUrl from '../../assets/mkfont-logo.svg'
import { cn } from '../../lib/cn'

/**
 * The MkFont logo, drawn from the canonical artwork (assets/mkfont-logo.svg).
 * The app icon (build/icon.png) is rendered from the same file: `npm run gen:icon`.
 */
export function Logo({ className, size = 22 }: { className?: string; size?: number }): React.ReactElement {
  // i18n-ignore: brand name
  return <img src={logoUrl} width={size} height={size} alt="MkFont" draggable={false} className={cn('shrink-0', className)} />
}
