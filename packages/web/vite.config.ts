import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Wild Springs & Caves',
        short_name: 'WHC',
        description: 'Discover hot springs, caves, and waterfalls',
        theme_color: '#0EA5E9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: []
      }
    })
  ],
  server: {
    port: 5173
  }
})
