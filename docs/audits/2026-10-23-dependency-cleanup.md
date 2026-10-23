# Dependency and dead-code cleanup — 2026-10-23

## Results

- Deleted 73 unreachable source files and 15 obsolete migration scripts.
- Removed 25 unused direct npm dependencies and regenerated `bun.lock` offline. Frozen-lockfile validation passes.
- Removed 26 duplicate named/default export pairs and the unused `NavLink` implementation/alias. Updated default imports and lazy adapters.
- Made 623 unused exported names local without removing their implementations or internal types.
- Updated Knip's conventional entry points for TanStack Start, native keyboard support, retained business APIs and the legacy Tailwind configuration.
- Knip findings decreased from 882 to 85. The quality limit decreased from 940 to the measured 85: 5 files, 31 exports, 47 types and 2 binary findings; no unused dependencies or duplicate exports remain.
- Repaired the SSR verification script for ESM and added six regression tests. It now rejects HTTP errors and client-only shells, checks profile metadata and verifies that the JSON-LD entity name is present in the initial body HTML.

## Deliberately retained

- At the original cleanup base, `AEOOptimizer` was dynamically imported by the active landing page; the later integration described below supersedes this.
- Capacitor keyboard support has a real dynamic import; iOS remains a supported package-script target.
- Collaboration, money and document-signing APIs remain available under the business-feature retention policy in `AGENTS.md`.
- All 12 vendored font families are reachable through runtime theme/font selectors or global CSS; no unreferenced WOFF2 files were found.
- At the original cleanup base, `vite.config.ts` had no `optimizeDeps.include` override to remove. The required SSR `noExternal` setting remains.
- Five Knip file findings remain: gallery filter component/hook, domain-verification hook, and the two Supabase server/auth integration files. They were preserved outside the confirmed deletion set.
- Existing user edits were preserved. Generated sitemap and MCP artifacts produced by `prebuild` were restored to their original contents.

## Validation

- `npm run analyze:unused`: passed, 85/85 findings.
- `npm run typecheck:strict`: passed after fixing retained consumers of localized exports.
- `npm run test:scripts`: 24 tests passed.
- Full Vitest, one thread with a temporary diagnostic reporter: 189 files and 1047 tests passed, no unhandled errors (589.40 seconds).
- Targeted Auth SSR/email and PublicPage tests: 10 tests passed.
- `npm run build` and a final direct Vite build after the last cleanup edits: client, SSR and Cloudflare worker builds passed.
- `git diff --check`: passed.
- Built worker fetch integration: root page returns HTTP 200 with server-rendered text and metadata. A profile with a controlled REST snapshot returns HTTP 200 with its name in initial HTML, canonical, Open Graph and ProfilePage JSON-LD. This does not verify connectivity to a live published profile backend.

The ordinary Vite preview command fails because the TanStack preview plugin looks for `dist/server/server.js`, whereas Nitro emits `.output/server`. The worker fetch integration was used to verify the actual build instead.

Initial resource-constrained Vitest attempts reported four failures in `CompactInspector.test.tsx`, lost a worker or were stopped after prolonged execution. The final diagnostic run passed all 10 CompactInspector tests and the entire suite without changing those tests or their implementation to address these transient failures. An additional full-project `tsc --noEmit` was stopped after prolonged resource use; the project's normal strict quality check passed.

Detailed validation logs and temporary audit tooling are archived locally in the ignored `tmp/dependency-cleanup/` directory.

## Integration with main and Lovable

Merged the cleanup with `origin/lovable-fallback` at `cbaa9438`, which already includes `origin/main` at `b6dcf47e`. New SEO, profile, event and security changes were preserved. Restored exported types now consumed by the newer code, and preserved the updated widget-schema reset implementation and its new test consumer.

The newer hosted routes made `src/pages/PublicServicePage.tsx`, `src/pages/SeoLanding.tsx` and `AEOOptimizer` unreachable; those three files and one stale test mock were removed. Total source deletions across cleanup and integration: 76. Four further unused exports were localized to keep the quality ratchet intact. The new Lovable Vite prebundling override was retained because it prevents duplicate React instances during development.

Pre-existing local multilingual edits and their untracked test were kept outside the integration commits and preserved for restoration after publishing the Git branches.

Integration validation: strict TypeScript passed; Knip passed at 85/85; client, SSR and Cloudflare worker builds passed; all 207 Vitest files and 1142 tests passed; all 32 script tests passed. The rebuilt worker also passed initial-HTML checks for the root page and a public profile backed by a controlled REST fixture.
