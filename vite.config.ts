import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Plugin to make CSS non-render-blocking in production
function nonBlockingCssPlugin() {
  return {
    name: 'non-blocking-css',
    enforce: 'post' as const,
    transformIndexHtml(html: string) {
      // Convert <link rel="stylesheet"> to non-blocking pattern
      return html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
        '<link rel="stylesheet" href="$1" media="print" onload="this.media=\'all\'">' +
        '<noscript><link rel="stylesheet" href="$1"></noscript>'
      );
    },
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && nonBlockingCssPlugin(),
    // Upload sourcemaps to Sentry in production builds (requires SENTRY_AUTH_TOKEN)
    // Upload sourcemaps to Sentry in production builds (requires SENTRY_AUTH_TOKEN)
    mode === 'production' && !!process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: ["./dist/**/*.map"],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "next/navigation": path.resolve(__dirname, "./src/platform/next/navigation.ts"),
      "next/link": path.resolve(__dirname, "./src/platform/next/link.ts"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    // Disable modulepreload hints to prevent eager loading of lazy-route chunks
    // (vendor-export, vendor-charts, vendor-sentry etc.) on the landing page.
    // Modules are still loaded on demand via dynamic import().
    modulePreload: false,
    sourcemap: !!process.env.SENTRY_AUTH_TOKEN,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React must NOT be in manualChunks — dedupe handles single instance
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return undefined;
          if (id.includes('node_modules/@tanstack/react-query')) return 'vendor-query';
          if (id.includes('node_modules/@radix-ui')) return 'vendor-ui';
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) return 'vendor-i18n';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'vendor-charts';
          if (id.includes('node_modules/@sentry')) return 'vendor-sentry';
          if (id.includes('node_modules/@dnd-kit')) return 'vendor-dnd';
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform') || id.includes('node_modules/zod')) return 'vendor-forms';
          if (id.includes('node_modules/date-fns')) return 'vendor-date';
          if (id.includes('node_modules/react-helmet') || id.includes('node_modules/react-day-picker')) return 'vendor-misc';
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) return 'vendor-3d';
          if (id.includes('node_modules/jspdf')) return 'vendor-export-pdf';
          if (id.includes('node_modules/exceljs')) return 'vendor-export-xlsx';
          if (id.includes('node_modules/html2canvas')) return 'vendor-export-canvas';
          if (id.includes('node_modules/qrcode')) return 'vendor-qr';
          if (id.includes('node_modules/web-vitals')) return 'vendor-vitals';
          if (id.includes('node_modules/sonner') || id.includes('node_modules/cmdk')) return 'vendor-misc';
          if (id.includes('node_modules/class-variance-authority') || id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) return 'vendor-misc';
          // Catch-all: prevent Rollup from creating unexpected large shared chunks
          if (id.includes('node_modules/')) return 'vendor-other';
          // Split locale JSON files into separate chunks
          if (id.includes('src/i18n/locales/') && !id.includes('ru.json') && !id.includes('en.json') && !id.includes('kk.json')) {
            const match = id.match(/locales\/(\w+)\.json/);
            if (match) return `locale-${match[1]}`;
          }
        },
      },
    },
  },
}));
