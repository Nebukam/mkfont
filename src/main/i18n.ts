// ============================================================
// Translations for the main process (native menus and dialogs).
// Its own i18next instance: the renderer's lives in another process.
// ============================================================

import i18next, { type i18n as I18n, type TFunction } from 'i18next'
import en from './locales/en'
import es from './locales/es'
import fr from './locales/fr'
import zh from './locales/zh'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof en }
    nsSeparator: false
    returnNull: false
  }
}

/** The renderer's languages (src/renderer/src/i18n): it tells this process which one is on. */
const LANGUAGES = ['en', 'fr', 'es', 'zh'] as const
type Language = (typeof LANGUAGES)[number]

export const i18n: I18n = i18next.createInstance()

void i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: LANGUAGES,
  resources: { en: { translation: en }, fr: { translation: fr }, es: { translation: es }, zh: { translation: zh } },
  initAsync: false,
  nsSeparator: false,
  // Native menus and dialogs show text as is.
  interpolation: { escapeValue: false },
  returnNull: false
})

/** Looks a message up; call it when the menu or dialog is built, not at module load. */
export const t: TFunction = i18n.t.bind(i18n)

/** A language code ("fr", "zh-CN") as one the app ships, or null. */
export function supportedLanguage(code: string): Language | null {
  const base = code.toLowerCase().split(/[-_]/)[0]
  return (LANGUAGES as readonly string[]).includes(base) ? (base as Language) : null
}

/** Switches the native menus and dialogs to a language; false when it is not one the app ships, or already on. */
export function setLanguage(code: string): boolean {
  const lng = supportedLanguage(code)
  if (!lng || lng === i18n.language) return false
  void i18n.changeLanguage(lng)
  return true
}
