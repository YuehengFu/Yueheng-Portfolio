import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative asset URLs: the same build works at
  // https://yuehengfu.github.io/yueheng-site/ and at a custom domain's root.
  // Code that fetches files (the model) prefixes import.meta.env.BASE_URL.
  base: './',
  build: {
    // The scene is one lazy chunk: three.js + @react-three/fiber + the cat,
    // about 960 kB raw / 256 kB gzipped. It loads after the text has painted
    // and never blocks it, so the 500 kB default only warns about something
    // known. 1000 kB still flags a real regression (another big dependency).
    chunkSizeWarningLimit: 1000,
  },
})
