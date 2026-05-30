import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// User page (matteovissani.github.io) is served from the domain root.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
  },
})
