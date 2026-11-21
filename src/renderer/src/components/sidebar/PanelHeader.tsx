export function PanelHeader({ title, actions }: { title: string; actions?: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-b border-line pl-3 pr-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</span>
      {actions && <div className="flex items-center gap-0.5">{actions}</div>}
    </div>
  )
}
