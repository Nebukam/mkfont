import { resolve } from 'path'
import { readFileSync } from 'fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as { version: string }

// Standalone Vite config for browser-only preview (no Electron)
export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src')
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [react()],
  css: {
    postcss: resolve(__dirname, 'postcss.config.js')
  },
  server: {
    port: 5199,
    strictPort: true
  }
})
