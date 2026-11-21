// ============================================================
// Update check against GitHub releases (v1 welcome "Check updates").
// ============================================================

import { native, openExternal } from '../platform'
import { toast } from '../components/ui/Overlays'
import { errorMessage } from '../lib/errors'
import { MessageError, msg, t } from '../i18n'

const RELEASES_API = 'https://api.github.com/repos/Nebukam/mkfont/releases/latest'
const RELEASES_PAGE = 'https://github.com/Nebukam/mkfont/releases'

export async function appVersion(): Promise<string> {
  return (await native?.getAppVersion()) ?? __APP_VERSION__
}

/** Compare dotted versions ("2.1.0" vs "v2.0.3"); pre-release tags sort before releases. */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string): { nums: number[]; pre: string } => {
    const [core, pre = ''] = v.replace(/^v/i, '').split('-')
    return { nums: core.split('.').map((n) => parseInt(n, 10) || 0), pre }
  }
  const x = parse(a)
  const y = parse(b)
  for (let i = 0; i < Math.max(x.nums.length, y.nums.length); i++) {
    const d = (x.nums[i] ?? 0) - (y.nums[i] ?? 0)
    if (d) return d
  }
  if (x.pre === y.pre) return 0
  if (!x.pre) return 1
  if (!y.pre) return -1
  return x.pre < y.pre ? -1 : 1
}

function openReleases(): void {
  openExternal(RELEASES_PAGE)
}

export async function checkForUpdates(manual: boolean): Promise<void> {
  try {
    const res = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } })
    if (!res.ok) throw new MessageError(msg('shell.updates.httpError', { status: res.status }))
    const json = (await res.json()) as { tag_name?: string }
    const latest = json.tag_name ?? ''
    const current = await appVersion()
    if (latest && compareVersions(latest, current) > 0) {
      toast.action(t('shell.updates.available', { latest: latest.replace(/^v/i, ''), current }), { label: t('shell.updates.openReleases'), run: openReleases })
    } else if (manual) {
      toast.success(t('shell.updates.upToDate', { current }))
    }
  } catch (e) {
    if (manual) toast.warning(t('shell.updates.failed'), errorMessage(e))
  }
}
