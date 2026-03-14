import { defineConfig } from 'vite'

export default defineConfig({
  root: './',
  base: './', // Ensures relative paths for assets
  build: {
    outDir: 'dist',
  },
  css: {
    // Prevent picking up root tailwind config
    postcss: {
      plugins: []
    }
  }
})
