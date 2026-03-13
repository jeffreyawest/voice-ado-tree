import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['microsoft-cognitiveservices-speech-sdk'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
