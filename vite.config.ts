import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      // Proxy pour l'API Anthropic (Claude) - clé API gérée côté serveur
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Injecter la clé API depuis les variables d'environnement serveur
            const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
            if (apiKey) {
              proxyReq.setHeader('x-api-key', apiKey);
            }
            proxyReq.setHeader('anthropic-version', '2023-06-01');
          });
        },
      },
      // Proxy pour OpenRouter
      '/api/openrouter': {
        target: 'https://openrouter.ai/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openrouter/, ''),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Cockpit - Project Management',
        short_name: 'Cockpit',
        description: 'Application de pilotage de projet - Developed by Pamela Atokouna',
        theme_color: '#18181b',
        background_color: '#fafafa',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@db': path.resolve(__dirname, './src/db'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@types': path.resolve(__dirname, './src/types'),
      '@data': path.resolve(__dirname, './src/data'),
      '@pages': path.resolve(__dirname, './src/pages'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Avertir si un chunk depasse 500KB
    chunkSizeWarningLimit: 500,
    // Utiliser esbuild (plus stable que terser)
    minify: 'esbuild',
    // Code splitting pour réduire la taille des bundles
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks - librairies tierces
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react') || id.includes('recharts')) {
              return 'vendor-ui';
            }
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            if (id.includes('dexie')) {
              return 'vendor-db';
            }
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            if (id.includes('xlsx')) {
              return 'vendor-excel';
            }
            if (id.includes('pptxgenjs')) {
              return 'vendor-pptx';
            }
            if (id.includes('pdfjs-dist') || id.includes('react-pdf')) {
              return 'vendor-pdf-viewer';
            }
          }
          // App data chunks
          if (id.includes('/data/cosmosAngre')) {
            return 'app-data';
          }
          // App services chunks
          if (id.includes('/services/')) {
            return 'app-services';
          }
        },
      },
    },
  },
});
