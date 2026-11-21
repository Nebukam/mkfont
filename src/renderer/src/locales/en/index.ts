// English, the source language. Each area of the app has its own file; keys are
// "<area>.<key>" ("browse.title"). See docs/i18n.md.
import browse from './browse'
import commands from './commands'
import dialogs from './dialogs'
import document from './document'
import edit from './edit'
import help from './help'
import imports from './imports'
import inspector from './inspector'
import kerning from './kerning'
import menus from './menus'
import outline from './outline'
import shell from './shell'
import sidebar from './sidebar'
import ui from './ui'
import unicode from './unicode'
import viewport from './viewport'

const en = {
  browse,
  commands,
  dialogs,
  document,
  edit,
  help,
  imports,
  inspector,
  kerning,
  menus,
  outline,
  shell,
  sidebar,
  ui,
  unicode,
  viewport
}

export default en
export type Messages = typeof en
