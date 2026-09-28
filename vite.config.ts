import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// A relative base lets the same build run from a domain root (Vercel, Netlify)
// or a subpath (GitHub Pages). Routing is hash-based, so no rewrites are needed.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
