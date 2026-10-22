import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// latin subsets only, to keep the page light
import '@fontsource/benne/latin-400.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/patrick-hand/latin-400.css'
import './index.css'
import App from './App.tsx'

// On phones the fridge textures (WebGPU) can crash Safari and leave a blank screen, so phones get the
// plain gradients instead, the same fallback as browsers without WebGPU.
if (window.matchMedia('(pointer: coarse)').matches && 'gpu' in navigator) {
  Object.defineProperty(navigator, 'gpu', { value: undefined })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
