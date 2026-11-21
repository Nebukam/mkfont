// French messages of the main process: native menus and dialogs. The renderer has its
// own catalogs (src/renderer/src/locales). See docs/i18n.md.
import type en from './en'
import type { Catalog } from './catalog'

export default {
  /** macOS application menu; the role menus (app, Edit, Window) are named by the system. */
  menu: {
    view: 'Affichage'
  },
  /** Native file dialogs; the renderer usually passes its own (translated) title. */
  dialogs: {
    selectApplication: 'Choisir une application',
    applications: 'Applications',
    selectFolder: 'Choisir un dossier'
  },
  /** The window did not answer a request to close (its page crashed, hangs, or its interface failed). */
  closeUnanswered: {
    message: 'MkFont ne répond pas',
    detail: 'La fenêtre n’a pas répondu à la demande de fermeture. La fermer quand même ? Les modifications non enregistrées seront perdues.',
    wait: 'Attendre',
    close: 'Fermer sans enregistrer'
  },
  /** The window's page crashed; {{reason}} is Electron's code for why (crashed, oom, killed…). */
  pageGone: {
    message: 'La fenêtre de MkFont a cessé de fonctionner',
    detail: 'Les modifications non enregistrées n’ont pas pu être récupérées ({{reason}}).',
    reload: 'Recharger',
    close: 'Fermer'
  }
} satisfies Catalog<typeof en>
