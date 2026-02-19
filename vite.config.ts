import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
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
  },
  build: {
    // Enable sourcemaps in production when Sentry token is available
    sourcemap: mode === "development" || !!process.env.SENTRY_AUTH_TOKEN,
  },
}));
