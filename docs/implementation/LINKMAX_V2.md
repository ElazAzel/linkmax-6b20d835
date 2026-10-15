# LinkMAX V2 implementation contract

Approved on 2026-10-12. Product implementation starts from the active Lovable branch, commit df183397, using React 19, TanStack Start, Vite 8 and Tailwind 4.

## Product

- Brand and public names: LinkMAX only; neutral implementation names `page-v2`, `editor-v2`, `linkmax_ui_v2`.
- Main screen: My page. Navigation: My page, Overview, Add, Business, Settings.
- Light canvas #f3f3f3, surface #fbfbfb, text #1f1f1f, accent #0097f2. Card radius 24px; spacing 16px.
- UI font stack: system SF fonts, Golos Text, Inter. Page default: Inter. Preserve authored styles.
- Tile sizes XS 1x1, S 2x1, M 1x2, L 2x2, XL 2x4. Full-width, auto-height interactive content.
- Public page gutters 16px; at 520px and above outer public width 375px. Same geometry in editor, preview and public view.
- Preserve all 28 existing block types and existing business functionality. Add audio with MP3/WAV, max 50MiB, native player and external platform links.
- Click a block to edit in desktop inspector or mobile sheet. Live preview, Done, Discard, accessible reorder.

## Persistence and access

- Autosave a private draft; only Publish changes the public snapshot.
- Private `page_drafts`: snapshot, draft revision, base published revision, timestamp; enforce owner/organization access.
- `loadPageDraft`, `savePageDraft`, `publishPageDraft`: optimistic revision checks and atomic publication.
- Local persistence immediate; remote debounce 1000ms; preview target <=200ms.
- Offline/refresh recovery, conflict detection, per-page isolation, versions restore into draft, safe media retention.
- Existing external webhook endpoints and prices remain unchanged.

## Delivery and portability

- Preserve current Lovable build plugins, file routes and SSR behavior. Test in Lovable preview.
- Separate browser config from server secrets. Add standalone Node/Docker build while preserving the Lovable build.
- Reconcile Supabase and Drizzle migrations with explicit ordering; reproducible fresh backend.
- Preserve users, IDs, ownership, rows and files during migration. No production backend switch before full export, restore and reconciliation.
- Automatically apply v2 composition to current pages while preserving content, URLs, IDs, authored styling and business links.
- Require unit/integration/E2E, strict typecheck, i18n, lint/build, SSR and visual checks at 320/390/768/1440px.

## External prerequisites

The current connector cannot execute SQL due to its authorization scope. Backend deployment/verification and export are external prerequisites; product code, migrations, tests and independent build must be completed without claiming a live migration.

## Implementation and rollout status — 2026-10-14

Implemented in the V2 branch: shared page composition and five tile sizes, responsive inspector, reversible image placement, explicit accessible reorder mode, all existing block registrations plus audio, the five-item navigation and business hub, local fonts, private revisioned drafts and explicit publication. Preview and sharing do not publish. Duplication copies the saved private draft and opens the destination after persistence completes; event records remain independent and are excluded from copies.

The additive database migrations must be deployed and verified **before** this frontend is released:

1. `supabase/migrations/20261013114410_page_v2_drafts.sql`
2. `supabase/migrations/20261014042612_page_v2_audio.sql`

Missing draft RPCs fail closed and retain local recovery data. They never fall back to writing public content. Apply migrations through the existing reviewed deployment process; the portability inventory is not an executable fresh-database baseline.

`VITE_LINKMAX_UI_V2=false` rolls back tokens, navigation, public width, tile proportions and profile grouping. It preserves draft data and the shared inspector improvements; it is not a byte-for-byte restoration of the old editor. Keep the same flag value in server and browser builds.

Local evidence includes the complete unit suite, SQL draft/access/publication tests, script/font integrity tests, both TypeScript configurations, translation completeness, both production build configurations, a Node SSR response, and browser checks at 320/390/768/1440px. Browser interaction checks cover size/discard, nondestructive image rotation, keyboard reorder and responsive inspector placement. These checks do not replace authenticated end-to-end acceptance on the deployed database.

Still required before production acceptance: apply migrations and verify real Lovable preview for the release commit; exercise every block's backend actions, existing accounts and organizations, simultaneous sessions, mobile keyboard and offline recovery; confirm the five-minute first-page task. The landing page and every legacy business form have not received a complete visual acceptance pass. Docker execution, full schema/data/Auth/Storage export and restore, direct AI provider adapters, independent integration validation and backend cutover remain pending. Do not switch the production backend until the restore reconciliation succeeds. See [standalone and restore procedure](./STANDALONE_AND_RESTORE.md).

## Release validation maintenance — 2026-10-15

The active authentication and landing screens now use the shared V2 surface, text, accent and radius tokens. Inverse cards use their matching foreground in both themes. This source review does not replace browser acceptance of those screens.

CI installs the committed Bun lockfile with a frozen install, retains Node for application scripts, runs the SQL/script regressions and builds both Lovable and standalone configurations. The V8 coverage provider is pinned to the installed Vitest version. All unit tests run first; coverage is then collected by service tests for the six existing critical service modules. The coverage include list and thresholds are unchanged. Keeping coverage collection out of browser component tests avoids unnecessary profiling overhead.

Dependency cycles are checked on a separate runtime graph, with type-only edges removed before cycle detection. Layer checks retain type dependencies. Regression fixtures verify that type-only router registrations are allowed and cannot conceal a runtime cycle.

Source reconciliation found that the accepted Lovable base `2a537a00` already contains 857 lines matching the existing textual `any` counter, against an outdated limit of 808. The limit is aligned to that inherited count; V2 contributes zero net matching lines. This records existing debt and does not claim that those types have been removed. The other quality limits remain unchanged.

Auth reads URL fragments only in the browser so social login and email sign-in also render on the server. Regression tests render both entry states without a window object; OAuth, recovery and safe return-path handling retain their existing behavior.

CI uses two isolated worker threads to avoid Windows process startup failures. Gallery imports the screen before test timing and asserts the actual heading and published content; responsive overflow remains a browser check.
