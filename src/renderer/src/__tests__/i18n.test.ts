import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { checkRepo, checkSource, isTextLike } from '../../../../scripts/i18n-literals'
import en from '../locales/en'
import es from '../locales/es'
import fr from '../locales/fr'
import zh from '../locales/zh'
import mainEn from '../../../main/locales/en'
import mainEs from '../../../main/locales/es'
import mainFr from '../../../main/locales/fr'
import mainZh from '../../../main/locales/zh'
import { formatNumber, i18n, setLanguage, systemLanguage, t, tm, msg } from '../i18n'
import { sanitizePrefs } from '../stores/prefs-store'
import { GC_KEYS } from '../core/gc-ranges'
import { CATEGORY_GROUPS } from '../core/unicode'
import { categoryGroupName, categoryName } from '../lib/category-names'

const ROOT = resolve(__dirname, '../../../..')

describe('user-facing literals', () => {
  it('none outside the catalogs', () => {
    const found = checkRepo(ROOT).map((f) => `${f.file}:${f.line} [${f.why}] ${f.text}`)
    expect(found).toEqual([])
  })

  it('tells text from ids, classes and markup', () => {
    for (const s of ['Save', 'not exported', 'Filter blocks', 'Open…', 'This SVG draws too many copies through <use> to import.'])
      expect(isTextLike(s), s).toBe(true)
    for (const s of ['all', 'block', 'flex h-7 w-full items-center', 'ArrowUp ArrowDown', 'U+', 'M 0 0 L 0 0 z', 'tr: :', '<path d="M0"/>', '10px Inter, "Segoe UI", sans-serif', 'OTF', 'https://x.y', 'commands.', 'kerning.commonGroups.'])
      expect(isTextLike(s), s).toBe(false)
  })

  it('finds JSX text, text attributes, text props and shown calls', () => {
    const src = [
      'const a = <p title="Hello there">No glyphs</p>',
      "const b = { label: 'Save', id: 'all' }",
      "toast.info('Copied')",
      "const c = <i className='flex h-7' aria-label={x ? 'Open' : t('k')} />",
      "// i18n-ignore: brand",
      "const d = 'MkFont Studio'"
    ].join('\n')
    expect(checkSource('x.tsx', src).map((f) => f.text)).toEqual(['Hello there', 'No glyphs', 'Save', 'Copied', 'Open'])
  })
})

/** Every message of a catalog, as [dotted key, text]. */
function leavesOf(o: object, path = '', out: [string, string][] = []): [string, string][] {
  for (const [k, v] of Object.entries(o)) {
    const p = path ? `${path}.${k}` : k
    if (typeof v === 'string') out.push([p, v])
    else leavesOf(v as object, p, out)
  }
  return out
}

describe('catalog', () => {
  const leaves = leavesOf(en)

  it('has no empty messages', () => {
    expect(leaves.filter(([, v]) => !v.trim()).map(([k]) => k)).toEqual([])
  })

  it('writes interpolations as {{name}} or {{name, format}}', () => {
    const bad = leaves.filter(([, v]) => /\{\{(?![\w]+(, ?\w+)?\}\})/.test(v) || /(^|[^{])\{(?!\{)[\w]+\}/.test(v)).map(([k]) => k)
    expect(bad).toEqual([])
  })

  it('gives every plural an _other form', () => {
    const keys = new Set(leaves.map(([k]) => k))
    const missing = [...keys].filter((k) => /_(one|two|few|many|zero)$/.test(k) && !keys.has(k.replace(/_\w+$/, '_other')))
    expect(missing).toEqual([])
  })

  it('names every general category and category group', () => {
    // GC_KEYS holds the categories the data assigns; unassigned code points are 'Cn'.
    expect([...GC_KEYS, 'Cn'].filter((gc) => !(gc in en.unicode.categories))).toEqual([])
    expect(CATEGORY_GROUPS.map((g) => g.id).filter((id) => !(id in en.unicode.categoryGroups))).toEqual([])
    expect(categoryName('Lu')).toBe('Uppercase')
    expect(categoryName('Liga')).toBe('Liga')
    expect(categoryGroupName('Letter')).toBe('Letter')
  })
})

const PLURAL = /_(zero|one|two|few|many|other)$/
/** What a message must keep in every language: its {{values}} and its <tags>. */
const placeholders = (text: string): string[] =>
  [...[...text.matchAll(/\{\{\s*(\w+)/g)].map((m) => `{{${m[1]}}}`), ...[...text.matchAll(/<\/?(\w+)\s*\/?>/g)].map((m) => m[0].replace(/\s/g, ''))].sort()

describe.each([
  ['fr', fr, mainFr],
  ['es', es, mainEs],
  ['zh', zh, mainZh]
] as const)('%s translation', (lng, catalog, mainCatalog) => {
  const categories = new Intl.PluralRules(lng).resolvedOptions().pluralCategories as string[]

  describe.each([
    ['renderer', en, catalog],
    ['main process', mainEn, mainCatalog]
  ] as const)('%s', (_, source, target) => {
    const english = new Map(leavesOf(source))
    const translated = new Map(leavesOf(target))
    const base = (k: string): string => k.replace(PLURAL, '')
    const plurals = new Set([...english.keys()].filter((k) => PLURAL.test(k)).map(base))

    it('has every message of the English catalog, and no other', () => {
      const missing = [...english.keys()].filter((k) => !PLURAL.test(k) && !translated.has(k))
      const extra = [...translated.keys()].filter((k) => (PLURAL.test(k) ? !plurals.has(base(k)) : !english.has(k)))
      expect({ missing, extra }).toEqual({ missing: [], extra: [] })
    })

    it(`gives every plural the forms the language needs (${categories.join(', ')})`, () => {
      const wrong = [...plurals].filter((b) => {
        const forms = [...translated.keys()].filter((k) => PLURAL.test(k) && base(k) === b).map((k) => k.slice(b.length + 1))
        return forms.sort().join() !== [...categories].sort().join()
      })
      expect(wrong).toEqual([])
    })

    it('has no empty messages', () => {
      expect([...translated].filter(([, v]) => !v.trim()).map(([k]) => k)).toEqual([])
    })

    it('keeps the values and tags of each message', () => {
      const wrong = [...translated]
        .filter(([k, v]) => {
          const from = english.get(k) ?? english.get(`${base(k)}_other`)
          // A plural's singular may leave the count out ("un glyphe"); its other values stay.
          const expected = placeholders(from ?? '').filter((p) => !(PLURAL.test(k) && p === '{{count}}'))
          const got = placeholders(v).filter((p) => !(PLURAL.test(k) && p === '{{count}}'))
          return expected.join() !== got.join()
        })
        .map(([k]) => k)
      expect(wrong).toEqual([])
    })
  })
})

describe('language', () => {
  it('follows the first system language the app ships', () => {
    expect(systemLanguage(['de-DE', 'fr-CA', 'en-US'])).toBe('fr')
    expect(systemLanguage(['zh-CN'])).toBe('zh')
    expect(systemLanguage(['es_419'])).toBe('es')
    expect(systemLanguage(['de', 'ja'])).toBe('en')
    expect(systemLanguage([])).toBe('en')
  })

  it('switches messages, plurals and numbers', () => {
    try {
      setLanguage('fr')
      expect(t('dialogs.prefs.title')).toBe(fr.dialogs.prefs.title)
      expect(formatNumber(1234)).toBe(new Intl.NumberFormat('fr').format(1234))
      setLanguage('zh')
      expect(t('dialogs.prefs.title')).toBe(zh.dialogs.prefs.title)
    } finally {
      setLanguage('en')
    }
    expect(i18n.language).toBe('en')
  })

  it('keeps a stored language only when the app ships it', () => {
    expect(sanitizePrefs({ language: 'fr' })).toEqual({ language: 'fr' })
    expect(sanitizePrefs({ language: 'system' })).toEqual({ language: 'system' })
    expect(sanitizePrefs({ language: 'de' })).toEqual({})
  })
})

describe('lookups', () => {
  it('interpolates and formats numbers in the app language', () => {
    expect(t('browse.noBlockMatch', { filter: 'xyz' })).toBe('No block matches “xyz”.')
    expect(formatNumber(1234)).toBe('1,234')
    expect(tm(msg('browse.title'))).toBe('Browse')
  })
})
