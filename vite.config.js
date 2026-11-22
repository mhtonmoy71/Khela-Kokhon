import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192x192.png", "icon-512x512.png"],
      manifest: {
        name: "খেলা কখন?",
        short_name: "খেলা কখন",
        description: "১৯টা প্রতিযোগিতার লাইভ স্কোর, সূচি, টেবিল, প্রেডিকশন আর কুইজ — বাংলাদেশ সময়ে",
        id: "/",
        categories: ["sports"],
        lang: "bn",
        start_url: "/",
        display: "standalone",
        background_color: "#064e3b",
        theme_color: "#064e3b",
        icons: [
          { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          // নোটিফিকেশনের ছোট আইকনের জন্য: শুধু সাদা, পেছন স্বচ্ছ
          { src: "/icon-mono-512.png?v=4", sizes: "512x512", type: "image/png", purpose: "monochrome" },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        importScripts: ["/push-sw.js?v=6"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/crests\.football-data\.org\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "crests", expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "fonts", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  build: { outDir: "dist", sourcemap: false },
});
