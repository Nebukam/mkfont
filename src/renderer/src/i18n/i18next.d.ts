// Typed keys and interpolation values: t('browse.title') is checked against the English
// catalog, and t('browse.noBlockMatch', { filter }) must pass `filter`.
import 'i18next'
import type { Messages } from '../locales/en'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: Messages }
    nsSeparator: false
    returnNull: false
  }
}
