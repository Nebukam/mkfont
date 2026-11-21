import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

type Variant = 'default' | 'primary' | 'ghost' | 'danger' | 'subtle'
type Size = 'xs' | 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: LucideIcon
  iconRight?: LucideIcon
  /** Tooltip text (shown by the global tooltip layer). */
  tip?: string
  active?: boolean
  children?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  default: 'bg-raised border border-line hover:bg-hover hover:border-line-strong text-fg',
  primary: 'bg-accent-solid text-accent-fg border border-transparent hover:brightness-110',
  ghost: 'border border-transparent text-muted hover:text-fg hover:bg-hover',
  subtle: 'border border-transparent bg-hover/60 text-fg hover:bg-hover',
  danger: 'bg-raised border border-line text-danger hover:bg-danger-solid hover:text-white hover:border-danger-solid'
}

const SIZES: Record<Size, string> = {
  xs: 'h-5 px-1.5 text-2xs gap-1 rounded',
  sm: 'h-6 px-2 text-xs gap-1.5 rounded',
  md: 'h-8 px-3 text-sm gap-2 rounded-md'
}

const ICON_SIZES: Record<Size, number> = { xs: 11, sm: 13, md: 15 }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'sm', icon: Icon, iconRight: IconRight, tip, active, className, children, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      data-tip={tip}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-[background-color,border-color,color,filter] disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        active && 'bg-accent/15 text-accent border-accent/40 hover:bg-accent/20 hover:text-accent',
        className
      )}
      {...rest}
    >
      {Icon && <Icon size={ICON_SIZES[size]} strokeWidth={2} className="shrink-0" />}
      {children}
      {IconRight && <IconRight size={ICON_SIZES[size]} strokeWidth={2} className="shrink-0" />}
    </button>
  )
})

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon'> {
  icon: LucideIcon
  tip: string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, size = 'sm', variant = 'ghost', className, tip, ...rest },
  ref
) {
  const dims = size === 'xs' ? 'h-5 w-5' : size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'
  return (
    <Button ref={ref} variant={variant} size={size} tip={tip} aria-label={tip} className={cn(dims, '!px-0', className)} {...rest}>
      <Icon size={ICON_SIZES[size]} strokeWidth={2} />
    </Button>
  )
})
