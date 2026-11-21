import { useEffect, useState } from 'react'
import { Info, Keyboard } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { COMMAND_GROUPS, COMMANDS, formatShortcut, groupLabel, shortcutLabel } from '../../app/commands'
import { Logo } from '../shell/Logo'
import { UCD_VERSION } from '../../core/unicode'
import { appVersion } from '../../app/updates'
import { msg, tm, useTranslation, type MessageKey } from '../../i18n'
import type help from '../../locales/en/help'

type Extra = (typeof help)['shortcuts']['extra']

/** Shortcuts besides the commands', by group: `help.shortcuts.extra.<group>.<item>` holds their keys and what they do. */
const EXTRA = {
  grid: ['click', 'drag', 'arrows', 'cursor', 'menu', 'create', 'zoom', 'drop'],
  slots: ['store', 'restore', 'append'],
  fields: ['scrub', 'step', 'expression'],
  mouse: ['sideButtons'],
  outline: ['open', 'select', 'move', 'handle', 'insert', 'convert', 'remove', 'contour', 'transform', 'snap', 'view']
} as const satisfies { [G in keyof Extra]: readonly Exclude<keyof Extra[G], 'title'>[] }

const EXTRA_GROUPS = Object.keys(EXTRA) as (keyof typeof EXTRA)[]

export function ShortcutsDialog({ onClose }: { onClose: () => void }): React.ReactElement {
  const { t } = useTranslation()
  // Keys built from the ids above (checked by `satisfies`).
  const extra = (group: string, item: string, part: 'keys' | 'does'): string => tm(msg(`help.shortcuts.extra.${group}.${item}.${part}` as MessageKey))
  return (
    <Dialog title={t('help.shortcuts.title')} icon={Keyboard} onClose={onClose} width={760} footer={<Button onClick={onClose}>{t('help.close')}</Button>}>
      <div className="columns-2 gap-6">
        {COMMAND_GROUPS.map((g) => {
          const items = COMMANDS.filter((c) => c.group === g && c.shortcut && !c.hidden)
          if (!items.length) return null
          return (
            <div key={g} className="mb-4 break-inside-avoid">
              <div className="label-xs mb-1">{groupLabel(g)}</div>
              {items.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 py-0.5 text-sm">
                  <span className="text-muted">{c.label}</span>
                  <kbd className="shrink-0 rounded border border-line bg-raised px-1.5 font-mono text-2xs text-fg">{c.shortcut!.split(' / ').map(formatShortcut).join('  ')}</kbd>
                </div>
              ))}
            </div>
          )
        })}
        {EXTRA_GROUPS.map((g) => (
          <div key={g} className="mb-4 break-inside-avoid">
            <div className="label-xs mb-1">{t(`help.shortcuts.extra.${g}.title`)}</div>
            {EXTRA[g].map((item: string) => (
              <div key={item} className="flex items-center justify-between gap-3 py-0.5 text-sm">
                <span className="text-muted">{extra(g, item, 'does')}</span>
                <span className="shrink-0 text-right text-2xs text-fg">{extra(g, item, 'keys')}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Dialog>
  )
}

export function AboutDialog({ onClose }: { onClose: () => void }): React.ReactElement {
  const { t } = useTranslation()
  const [version, setVersion] = useState(__APP_VERSION__)
  useEffect(() => {
    void appVersion().then(setVersion)
  }, [])
  return (
    <Dialog title={t('help.about.title')} icon={Info} onClose={onClose} width={420} footer={<Button onClick={onClose}>{t('help.close')}</Button>}>
      <div className="flex items-center gap-3">
        <Logo size={48} />
        <div>
          <div className="text-lg font-semibold text-fg">{t('help.about.name', { version })}</div>
          <div className="text-sm text-muted">{t('help.about.tagline')}</div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{t('help.about.description')}</p>
      <p className="mt-2 text-xs text-subtle">{t('help.about.data', { version: UCD_VERSION, shortcut: shortcutLabel('help.shortcuts') ?? '' })}</p>
      <p className="mt-1 text-xs text-subtle">{t('help.about.credits')}</p>
    </Dialog>
  )
}
