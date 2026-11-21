import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cn } from '../../lib/cn'

interface SectionState {
  open: Record<string, boolean>
  toggle: (id: string, fallback: boolean) => void
}

const useSections = create<SectionState>()(
  persist(
    (set) => ({
      open: {},
      toggle: (id, fallback) => set((s) => ({ open: { ...s.open, [id]: !(s.open[id] ?? fallback) } }))
    }),
    { name: 'mkfont.sections' }
  )
)

export function Section({
  id,
  title,
  icon: Icon,
  children,
  actions,
  defaultOpen = true,
  badge,
  className,
  flush,
  collapsible = true,
  sticky
}: {
  /** Persisted open state key. */
  id: string
  title: ReactNode
  icon?: React.ComponentType<{ size?: number; className?: string }>
  children: ReactNode
  /** Buttons shown on the right of the header. */
  actions?: ReactNode
  defaultOpen?: boolean
  badge?: ReactNode
  className?: string
  /** No inner padding (lists). */
  flush?: boolean
  /** False: always open, with a plain header (no toggle). */
  collapsible?: boolean
  /** The header stays at the top of the scrolling panel while its content scrolls by. */
  sticky?: boolean
}): React.ReactElement {
  const stored = useSections((s) => s.open[id] ?? defaultOpen)
  const toggle = useSections((s) => s.toggle)
  const open = !collapsible || stored
  const heading = (
    <>
      {/* Without a toggle, a blank keeps the title in line with the collapsible ones. */}
      {collapsible ? (
        <ChevronRight size={12} className={cn('shrink-0 text-subtle transition-transform', open && 'rotate-90')} />
      ) : (
        <span className="w-3 shrink-0" />
      )}
      {Icon && <Icon size={13} className="shrink-0 text-subtle" />}
      <span className="truncate text-xs font-semibold text-fg">{title}</span>
      {badge !== undefined && badge !== null && <span className="rounded bg-hover px-1 text-2xs font-medium text-muted">{badge}</span>}
    </>
  )
  return (
    <section className={cn('border-b border-line', className)}>
      <div className={cn('group flex h-8 items-center gap-1 pl-2 pr-1.5', sticky && 'sticky top-0 z-10 bg-panel')}>
        {collapsible ? (
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-1.5 self-stretch text-left"
            onClick={() => toggle(id, defaultOpen)}
            aria-expanded={open}
          >
            {heading}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1.5 self-stretch">{heading}</div>
        )}
        {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
      </div>
      {open && <div className={cn(!flush && 'flex flex-col gap-1.5 px-3 pb-3 pt-0.5')}>{children}</div>}
    </section>
  )
}

/** A small "show more" toggle inside a section; the dot hints at non-default hidden values. */
export function Disclosure({
  open,
  onToggle,
  children,
  dot,
  className
}: {
  open: boolean
  onToggle: () => void
  children: ReactNode
  dot?: boolean
  className?: string
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={cn('flex items-center gap-1 pt-0.5 text-left text-2xs font-medium uppercase tracking-wider text-subtle hover:text-fg', className)}
    >
      <ChevronRight size={11} className={cn('transition-transform', open && 'rotate-90')} />
      {children}
      {dot && !open && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-accent" />}
    </button>
  )
}

export function SubHeader({ children, className }: { children: ReactNode; className?: string }): React.ReactElement {
  return <div className={cn('label-xs pt-1.5', className)}>{children}</div>
}
