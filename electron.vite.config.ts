import { resolve } from 'path'
import { readFileSync } from 'fs'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as { version: string }

/**
 * Content Security Policy for the packaged renderer. Production only: the dev
 * server needs inline scripts (React refresh) and a websocket for HMR.
 * Nothing loads remote code; the only remote request is the update check.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data: blob:",
  "connect-src 'self' https://api.github.com",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'"
].join('; ')

function contentSecurityPolicy(): Plugin {
  return {
    name: 'mkfont-csp',
    apply: 'build',
    // Right after the charset, before any script.
    transformIndexHtml: (html) =>
      html.replace(/<meta charset="UTF-8" \/>/i, (m) => `${m}
    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`)
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version)
    },
    plugins: [react(), contentSecurityPolicy()],
    css: {
      postcss: './postcss.config.js'
    }
  }
})
