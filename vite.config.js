import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist-embed',
    rollupOptions: {
      input: {
        index: 'index.html',
        'guest-submission': 'guest-submission.html',
      },
      output: {
        // Main page keeps album-feature.js so the site's existing embed doesn't change.
        entryFileNames: (chunk) => chunk.name === 'index' ? 'album-feature.js' : '[name].js',
        chunkFileNames: 'album-feature-[name].js', // code shared by both pages (e.g. React)
        assetFileNames: 'album-feature-[name][extname]',
      }
    }
  },
})