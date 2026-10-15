# AGENTS.md

- Framework is TanStack Start (file routes in `src/routes/`); legacy page components in `src/pages/` are mounted by thin route files. Why: migrated from Vite + React Router without rewriting every page.
- Legacy react-router call sites import from `@/lib/router-compat` (shim over TanStack Router); tests use `@/testing/router` for MemoryRouter/Routes. Why: keeps ~hundreds of components working unchanged.
- App-wide providers, banners and global effects live in `src/components/layout/AppShell.tsx`; one-time browser init lives in `src/lib/client-bootstrap.ts` and runs from a root effect. Why: replaces the old App.tsx/main.tsx without touching browser APIs during SSR.
- Root route awaits `i18nReady` in `beforeLoad`. Why: SSR and first paint must have the locale bundle, never raw keys.
- Tailwind v4 reads the legacy theme via `@config "../tailwind.legacy.config.ts"` in `src/styles.css`. Why: preserves the existing design tokens without a full token rewrite.
- Existing backend functions stay as Lovable Cloud edge functions (stable URLs for webhooks, cron, MCP, SEO worker); new app-internal server logic uses `createServerFn`. Why: moving them would change external URLs.
- CommonJS-only packages that break SSR are listed in `vite.ssr.noExternal` in `vite.config.ts`. Why: Vite SSR cannot read their named exports.
