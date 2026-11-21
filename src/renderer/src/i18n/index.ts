// ============================================================
// Translations — one i18next instance for the renderer.
// See docs/i18n.md for the conventions.
// ============================================================

import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en'
import es from '../locales/es'
import fr from '../locales/fr'
import zh from '../locales/zh'
import type { Message } from './message'

/** Languages the app ships. English is the source language and the fallback. */
export const LANGUAGES = ['en', 'fr', 'es', 'zh'] as const
export type Language = (typeof LANGUAGES)[number]

/** Each language named in itself, for the language picker. Chinese is Simplified Chinese. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English', // i18n-ignore: language names are written in their own language
  fr: 'Français', // i18n-ignore: language names are written in their own language
  es: 'Español', // i18n-ignore: language names are written in their own language
  zh: '简体中文' // i18n-ignore: language names are written in their own language
}

/** The `lang` of the page per language: it picks the right CJK font. */
const HTML_LANG: Record<Language, string> = { en: 'en', fr: 'fr', es: 'es', zh: 'zh-Hans' }

/** The first of the system's languages (most preferred first) the app ships, or English. */
export function systemLanguage(preferred: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages): Language {
  for (const code of preferred) {
    const base = code.toLowerCase().split(/[-_]/)[0]
    if ((LANGUAGES as readonly string[]).includes(base)) return base as Language
  }
  return 'en'
}

/** Switches the interface to a language (React components follow `languageChanged`). */
export function setLanguage(lng: Language): void {
  if (i18n.language !== lng) void i18n.changeLanguage(lng)
  if (typeof document !== 'undefined') document.documentElement.lang = HTML_LANG[lng]
}

export const i18n = i18next.createInstance()

// Synchronous: the catalogs are bundled, so `t` works as soon as this module is imported
// (non-React modules and tests included), before the first render.
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: LANGUAGES,
  resources: { en: { translation: en }, fr: { translation: fr }, es: { translation: es }, zh: { translation: zh } },
  initAsync: false,
  // One namespace with nested keys ("browse.title"); a colon in a key is plain text.
  nsSeparator: false,
  // React escapes text itself.
  interpolation: { escapeValue: false },
  returnNull: false,
  react: {
    // Components re-render when the language changes, not when resources load.
    bindI18n: 'languageChanged',
    bindI18nStore: false,
    useSuspense: false
  }
})

/**
 * Looks a message up. For code outside React (commands, menus, toasts) and for
 * components rendered in large numbers (grid slots), where a hook per item is waste.
 * Call it when the text is shown, never at module load: the result must follow the
 * language.
 */
export const t = i18n.t.bind(i18n)

let numberFormat: Intl.NumberFormat | null = null
let numberLng = ''

/** A number in the app's language ("1,234"), not the system's. */
export function formatNumber(n: number): string {
  if (!numberFormat || numberLng !== i18n.language) {
    numberLng = i18n.language
    numberFormat = new Intl.NumberFormat(numberLng)
  }
  return numberFormat.format(n)
}

let timeFormat: Intl.DateTimeFormat | null = null
let timeLng = ''

/** A time of day in the app's language ("07:55:02 PM"), not the system's. */
export function formatTime(time: number | Date): string {
  if (!timeFormat || timeLng !== i18n.language) {
    timeLng = i18n.language
    timeFormat = new Intl.DateTimeFormat(timeLng, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  return timeFormat.format(time)
}

export { useTranslation, Trans } from 'react-i18next'
export { msg, MessageError, isMessage, type Message, type MessageKey } from './message'

/** Translates a message from code that has no access to `t` (see ./message). */
export function tm(m: Message): string {
  return (t as (key: string, values?: Record<string, unknown>) => string)(m.key, m.values)
}
