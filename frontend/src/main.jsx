import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import ErrorBoundary from './components/common/ErrorBoundary'

// Automatically reload the page when a stale chunk fails to load after a deployment/rebuild
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

