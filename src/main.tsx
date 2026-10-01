import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/theme-provider.tsx'
import { SystemInitProvider } from '@/context/system-init-context.tsx'
import { initDb } from '@/db/client'

// Start database initialization early
initDb().catch((err) => console.error('Database initialization error:', err))

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SystemInitProvider>
        <App />
      </SystemInitProvider>
    </ThemeProvider>
  </StrictMode>
)
