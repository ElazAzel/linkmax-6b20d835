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
    // Keep default module preload behavior for correct dependency ordering in production.
    sourcemap: !!process.env.SENTRY_AUTH_TOKEN,
    chunkSizeWarningLimit: 1000,
    // Use Vite/Rollup default chunk strategy for runtime stability.
    // Custom manualChunks caused intermittent cross-chunk runtime mismatch in production.
    rollupOptions: {},
  },
}));
