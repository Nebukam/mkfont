// The shape a translation must have: the English catalog's keys, each with a string.
// Plural forms are the exception: each language has its own (`_one`, `_many`, `_other`…,
// per Intl.PluralRules), so they are optional here and checked by the i18n test.
// A copy of src/renderer/src/locales/catalog.ts (the main process builds on its own).

type PluralSuffix = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'
type PluralKey = `${string}_${PluralSuffix}`
type PluralBase<K> = K extends `${infer B}_${PluralSuffix}` ? B : never

export type Catalog<T> = {
  [K in keyof T as K extends PluralKey ? never : K]: T[K] extends string ? string : Catalog<T[K]>
} & {
  [K in `${PluralBase<keyof T & string>}_${PluralSuffix}`]?: string
}
