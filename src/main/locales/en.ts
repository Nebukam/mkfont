// English messages of the main process: native menus and dialogs. The renderer has its
// own catalogs (src/renderer/src/locales). See docs/i18n.md.
export default {
  /** macOS application menu; the role menus (app, Edit, Window) are named by the system. */
  menu: {
    view: 'View'
  },
  /** Native file dialogs; the renderer usually passes its own (translated) title. */
  dialogs: {
    selectApplication: 'Select application',
    applications: 'Applications',
    selectFolder: 'Select folder'
  },
  /** The window did not answer a request to close (its page crashed, hangs, or its interface failed). */
  closeUnanswered: {
    message: 'MkFont is not responding',
    detail: 'The window did not answer the request to close. Close it anyway? Changes that were not saved will be lost.',
    wait: 'Wait',
    close: 'Close without saving'
  },
  /** The window's page crashed; {{reason}} is Electron's code for why (crashed, oom, killed…). */
  pageGone: {
    message: 'The MkFont window stopped working',
    detail: 'Changes that were not saved could not be recovered ({{reason}}).',
    reload: 'Reload',
    close: 'Close'
  }
} as const
