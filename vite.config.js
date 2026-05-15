import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'খেলা কখন? - FIFA World Cup 2026',
        short_name: 'খেলা কখন?',
        description: 'FIFA বিশ্বকাপ ২০২৬ ফিক্সচার ট্র্যাকার - বাংলাদেশ সময়',
        theme_color: '#1a6b38',
        background_color: '#f5f7f5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
