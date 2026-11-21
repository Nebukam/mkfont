// ============================================================
// Language application: the preference → the interface and the native menus.
// ============================================================

import { useEffect } from 'react'
import { setLanguage, systemLanguage, type Language } from '../i18n'
import { native } from '../platform'
import { usePrefsStore, type LanguagePref } from '../stores/prefs-store'

/** The language a preference stands for. */
export function resolveLanguage(pref: LanguagePref): Language {
  return pref === 'system' ? systemLanguage() : pref
}

/** Switches the interface, and the main process's menus and dialogs, to the preferred language. */
export function applyLanguage(pref: LanguagePref = usePrefsStore.getState().language): void {
  const lng = resolveLanguage(pref)
  setLanguage(lng)
  native?.setLanguage(lng)
}

/** Follows the language preference, and the system's languages while it is 'system'. */
export function useApplyLanguage(): void {
  const pref = usePrefsStore((s) => s.language)
  useEffect(() => {
    applyLanguage(pref)
    if (pref !== 'system') return
    const follow = (): void => applyLanguage(pref)
    window.addEventListener('languagechange', follow)
    return () => window.removeEventListener('languagechange', follow)
  }, [pref])
}
