// ============================================================
// Theme application + resolved colors for canvas drawing.
// ============================================================

import { useEffect, useState } from 'react'
import { usePrefsStore } from '../stores/prefs-store'

export type ResolvedTheme = 'dark' | 'light'

function systemTheme(): ResolvedTheme {
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** Applies the preferred theme to <html data-theme>. Returns the resolved theme. */
export function useApplyTheme(): ResolvedTheme {
  const pref = usePrefsStore((s) => s.theme)
  const [resolved, setResolved] = useState<ResolvedTheme>(() => (pref === 'system' ? systemTheme() : pref))

  useEffect(() => {
    const apply = (): void => {
      const t = pref === 'system' ? systemTheme() : pref
      document.documentElement.dataset.theme = t
      setResolved(t)
      redrawCanvases()
    }
    apply()
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [pref])

  return resolved
}

let themeVersion = 0
const themeListeners = new Set<() => void>()

function redrawCanvases(): void {
  themeVersion++
  for (const fn of themeListeners) fn()
}

let watchingPixelRatio = false

/**
 * Canvases are drawn for the screen's pixel ratio, which changes with the interface
 * zoom and on monitors with another scale: redraw them, or they turn blurry.
 */
function watchPixelRatio(): void {
  if (watchingPixelRatio || typeof window === 'undefined' || !window.matchMedia) return
  watchingPixelRatio = true
  const arm = (): void => {
    window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener(
      'change',
      () => {
        redrawCanvases()
        arm()
      },
      { once: true }
    )
  }
  arm()
}

/** rgb() string for a theme token, e.g. tokenColor('accent', 0.5). */
export function tokenColor(name: string, alpha = 1): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim()
  if (!raw) return alpha === 1 ? '#888' : `rgba(136,136,136,${alpha})`
  const [r, g, b] = raw.split(/\s+/)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Re-render when the theme or the screen's pixel ratio changes (for canvas renderers). */
export function useThemeVersion(): number {
  const [v, setV] = useState(themeVersion)
  useEffect(() => {
    watchPixelRatio()
    const fn = (): void => setV(themeVersion)
    themeListeners.add(fn)
    return () => {
      themeListeners.delete(fn)
    }
  }, [])
  return v
}
