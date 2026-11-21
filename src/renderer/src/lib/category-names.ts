// Names of Unicode general categories in the app's language. core/unicode holds the
// codes and the groups; the names are messages (locales/<lng>/unicode.ts).

import { i18n, t } from '../i18n'
import type { Messages } from '../locales/en'

type Names = Messages['unicode']

/** A general category's name ("Lu" → "Uppercase"); the code itself when it has none. */
export function categoryName(gc: string): string {
  return i18n.exists(`unicode.categories.${gc}`) ? t(`unicode.categories.${gc as keyof Names['categories']}`) : gc
}

/** A category group's name, by its id (CATEGORY_GROUPS); the id itself when it has none. */
export function categoryGroupName(id: string): string {
  return i18n.exists(`unicode.categoryGroups.${id}`) ? t(`unicode.categoryGroups.${id as keyof Names['categoryGroups']}`) : id
}
