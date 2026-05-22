import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 5000,
      host: '0.0.0.0',
      // Cross-origin isolation headers — required so the browser exposes
      // SharedArrayBuffer to web-ifc's multi-threaded WASM build (web-ifc-mt.wasm).
      // Without these, web-ifc silently falls back to single-threaded parsing
      // which is ~3-4× slower on large IFCs (>100 MB). Match these headers in
      // production (Vercel / nginx) too — see vercel.json.
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    plugins: [react()],
    define: {
      // Gemini API key đã chuyển sang Edge Function secrets (gemini-proxy)
      // Không còn expose API key trong client bundle
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    optimizeDeps: {
      exclude: ['@thatopen/components', '@thatopen/components-front', '@thatopen/fragments']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            // 3D/BIM vendor (~5MB) — only loaded on BIM tab
            if (id.includes('node_modules/three/') || id.includes('node_modules/web-ifc/')) {
              return 'vendor-3d';
            }
            // Charts vendor — loaded on Dashboard + Reports
            if (id.includes('node_modules/recharts/')) {
              return 'vendor-charts';
            }
            // Map vendor — loaded on Dashboard + Project map views
            if (id.includes('node_modules/leaflet/') || id.includes('node_modules/react-leaflet/')) {
              return 'vendor-map';
            }
            // Document generation vendor — loaded on export
            if (id.includes('node_modules/docx/') || id.includes('node_modules/jspdf') || id.includes('node_modules/file-saver/')) {
              return 'vendor-docs';
            }
            // Icons — shared across all pages
            if (id.includes('node_modules/lucide-react/')) {
              return 'vendor-icons';
            }
            // React core — cached long-term
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router')) {
              return 'vendor-react';
            }
            // Data layer
            if (id.includes('node_modules/@supabase/') || id.includes('node_modules/@tanstack/')) {
              return 'vendor-data';
            }
          }
        }
      },
      chunkSizeWarningLimit: 5000
    },
    worker: {
      format: 'es'
    }
  };
});
