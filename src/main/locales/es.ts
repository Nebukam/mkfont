// Spanish messages of the main process: native menus and dialogs. The renderer has its
// own catalogs (src/renderer/src/locales). See docs/i18n.md.
import type en from './en'
import type { Catalog } from './catalog'

export default {
  /** macOS application menu; the role menus (app, Edit, Window) are named by the system. */
  menu: {
    view: 'Ver'
  },
  /** Native file dialogs; the renderer usually passes its own (translated) title. */
  dialogs: {
    selectApplication: 'Seleccionar aplicación',
    applications: 'Aplicaciones',
    selectFolder: 'Seleccionar carpeta'
  },
  /** The window did not answer a request to close (its page crashed, hangs, or its interface failed). */
  closeUnanswered: {
    message: 'MkFont no responde',
    detail: 'La ventana no respondió a la solicitud de cierre. ¿Cerrarla de todos modos? Se perderán los cambios no guardados.',
    wait: 'Esperar',
    close: 'Cerrar sin guardar'
  },
  /** The window's page crashed; {{reason}} is Electron's code for why (crashed, oom, killed…). */
  pageGone: {
    message: 'La ventana de MkFont dejó de funcionar',
    detail: 'No se pudieron recuperar los cambios no guardados ({{reason}}).',
    reload: 'Recargar',
    close: 'Cerrar'
  }
} satisfies Catalog<typeof en>
