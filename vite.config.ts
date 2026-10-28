/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: /api is proxied to the game API (FeedingFranzeeAPI, "Urls": http://localhost:5003).
// Point at another instance with API_TARGET=http://localhost:5013 npm run dev.
// Production builds call the API directly via VITE_API_BASE (.env.production).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5187,
    proxy: {
      '/api': { target: process.env.API_TARGET ?? 'http://localhost:5003', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
