import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // GitHub Pages serves the app at vvnz.github.io/svsd/, so built files live under /svsd/.
  // The dev server stays at the root; `vite preview` (the built app) matches Pages.
  base: command === 'build' || isPreview ? '/svsd/' : '/',
}))
