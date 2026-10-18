import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// latin subsets only, to keep the page light
import '@fontsource/benne/latin-400.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/inter/latin-400.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
