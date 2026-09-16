import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist-embed',
    rollupOptions: {
      output: {
        entryFileNames: 'album-feature.js',
        assetFileNames: 'album-feature-[name][extname]',
      }
    }
  },
})