---
description: Production Vite build verification
---

# Build Command

```bash
npm run build
```

The command regenerates `public/sitemap.xml` through `prebuild` and writes the web bundle to `dist/`. When `SENTRY_AUTH_TOKEN` is configured, Vite may upload and then remove production source maps according to `vite.config.ts`.

Review generated sitemap changes before committing. A successful build is required after routing, bundler, dependency, or environment changes.
