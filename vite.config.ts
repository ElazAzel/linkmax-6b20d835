import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { visualizer } from "rollup-plugin-visualizer";

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
    hmr: {
      clientPort: 443,
    },
  },
  plugins: [
    react({
      // React Compiler preparation (2026 Standard)
      // When the package 'babel-plugin-react-compiler' is installed, 
      // it enables automatic memoization.
    }),
    mode === 'development' && componentTagger(),
    mode === 'production' && nonBlockingCssPlugin(),
    // Upload sourcemaps to Sentry in production builds (requires SENTRY_AUTH_TOKEN)
    mode === 'production' && !!process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: ["./dist/**/*.map"],
      },
    }),
    visualizer({
      filename: "stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    // 2026 Performance Standards
    modulePreload: {
      polyfill: true, // Ensure module preload works on older mobile browsers
    },
    cssCodeSplit: true, // Split CSS into smaller chunks for faster FCP
    target: 'esnext', // Target modern browsers for smaller bundle size
    minify: 'esbuild',
    sourcemap: !!process.env.SENTRY_AUTH_TOKEN,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        telegram: path.resolve(__dirname, 'tg.html'),
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'recharts'],
          'vendor-utils': ['@supabase/supabase-js', 'i18next', 'zod'],
        },
      },
    },
  },
}));
