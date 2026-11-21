// Simplified Chinese messages of the main process: native menus and dialogs. The renderer
// has its own catalogs (src/renderer/src/locales). See docs/i18n.md.
import type en from './en'
import type { Catalog } from './catalog'

export default {
  /** macOS application menu; the role menus (app, Edit, Window) are named by the system. */
  menu: {
    view: '视图'
  },
  /** Native file dialogs; the renderer usually passes its own (translated) title. */
  dialogs: {
    selectApplication: '选择应用程序',
    applications: '应用程序',
    selectFolder: '选择文件夹'
  },
  /** The window did not answer a request to close (its page crashed, hangs, or its interface failed). */
  closeUnanswered: {
    message: 'MkFont 没有响应',
    detail: '窗口没有响应关闭请求。仍要关闭吗？未保存的更改将会丢失。',
    wait: '等待',
    close: '关闭且不保存'
  },
  /** The window's page crashed; {{reason}} is Electron's code for why (crashed, oom, killed…). */
  pageGone: {
    message: 'MkFont 窗口已停止工作',
    detail: '未保存的更改无法恢复 ({{reason}})。',
    reload: '重新载入',
    close: '关闭'
  }
} satisfies Catalog<typeof en>
