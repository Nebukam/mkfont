// Must stay first: installs the dev-only Electron API mock before the app reads it.
import './dev-mock-electron'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/shell/ErrorBoundary'
import { applyLanguage } from './lib/language'
import './index.css'

// Before the first render, so the window never shows another language first.
applyLanguage()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* The last net: App has boundaries of its own, but an error that escapes them must not
        blank the window. The rescue screen still offers to save every open font. */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
