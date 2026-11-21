import { useEffect, useRef } from 'react'
import { FolderOpen, Redo2, Undo2 } from 'lucide-react'
import { useDocStore } from '../../stores/doc-store'
import { PanelHeader } from './PanelHeader'
import { IconButton } from '../ui/Button'
import { cn } from '../../lib/cn'
import { commandTip } from '../../app/commands'
import { formatTime, useTranslation } from '../../i18n'

const timeLabel = (time: number): string => formatTime(time)

export function HistoryPanel(): React.ReactElement {
  const { t } = useTranslation()
  const history = useDocStore((s) => s.history)
  const cursor = useDocStore((s) => s.cursor)
  const initialLabel = useDocStore((s) => s.initialLabel)
  const jumpTo = useDocStore((s) => s.jumpTo)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current?.querySelector('[aria-current="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor, history.length])

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        title={t('sidebar.history.title')}
        actions={
          <>
            <IconButton icon={Undo2} size="xs" tip={commandTip('edit.undo')} disabled={cursor === 0} onClick={() => jumpTo(cursor - 1)} />
            <IconButton icon={Redo2} size="xs" tip={commandTip('edit.redo')} disabled={cursor >= history.length} onClick={() => jumpTo(cursor + 1)} />
          </>
        }
      />
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-1">
        <Entry label={initialLabel} index={0} cursor={cursor} onClick={() => jumpTo(0)} icon />
        {history.map((h, i) => (
          <Entry key={h.id} label={h.label} time={h.time} index={i + 1} cursor={cursor} onClick={() => jumpTo(i + 1)} />
        ))}
        {history.length === 0 && <p className="px-3 py-3 text-xs text-subtle">{t('sidebar.history.empty')}</p>}
      </div>
    </div>
  )
}

function Entry({ label, time, index, cursor, onClick, icon }: { label: string; time?: number; index: number; cursor: number; onClick: () => void; icon?: boolean }): React.ReactElement {
  const current = index === cursor
  const future = index > cursor
  return (
    <button
      type="button"
      aria-current={current}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors',
        current ? 'bg-accent/15 text-accent' : future ? 'text-subtle hover:bg-hover' : 'text-fg hover:bg-hover'
      )}
    >
      {icon ? <FolderOpen size={13} className="shrink-0 text-subtle" /> : <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', future ? 'bg-line-strong' : 'bg-accent/70')} />}
      <span className={cn('min-w-0 flex-1 truncate', future && 'line-through decoration-subtle/40')}>{label}</span>
      {time && <span className="shrink-0 text-2xs text-subtle">{timeLabel(time)}</span>}
    </button>
  )
}
