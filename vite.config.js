import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // রেজিস্ট্রেশন main.jsx-এ: নিজে থেকে হালনাগাদ
      includeAssets: ["icon-192x192.png", "icon-512x512.png"],
      manifest: {
        name: "খেলা কখন?",
        short_name: "খেলা কখন",
        description: "Football Live Scores: স্কোর, প্রেডিকশন আর কুইজ, বাংলায়। সব ম্যাচ বাংলাদেশ সময়ে",
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
        skipWaiting: true,   // নতুন সংস্করণ অপেক্ষায় না থেকে সাথে সাথে চালু
        clientsClaim: true,
        importScripts: ["/push-sw.js?v=7"],
        runtimeCaching: [
          {
            // ছোট করা লোগো/ছবি (/api/img): একবার এলে ফোনেই থাকে, পরের বার নেট ছাড়াই সাথে সাথে
            urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname === "/api/img",
            handler: "CacheFirst",
            options: { cacheName: "img", expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 60 }, cacheableResponse: { statuses: [200] } },
          },
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
  build: {
    outDir: "dist", sourcemap: false,
    // React আর Supabase আলাদা ফাইলে: এগুলো কালেভদ্রে বদলায়, তাই প্রতিবার আপডেটে ফোনে আবার নামাতে হয় না
    rollupOptions: { output: { manualChunks: (id) => (id.includes("node_modules/react") || id.includes("node_modules/scheduler") ? "react" : id.includes("node_modules/@supabase") ? "supabase" : undefined) } },
  },
  // কোন সংস্করণ চলছে (হালনাগাদ যাচাইয়ের জন্য)
  define: { __BUILD__: JSON.stringify(new Date().toISOString()) },
});
