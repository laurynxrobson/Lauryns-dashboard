import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useThemeStore } from './store/themeStore'

// Apply saved theme before first render to avoid flash
useThemeStore.getState().initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
