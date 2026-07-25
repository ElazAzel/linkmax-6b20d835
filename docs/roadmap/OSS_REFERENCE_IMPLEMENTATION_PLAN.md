# OSS Reference Implementation Plan

**Created:** 2026-07-25
**Status:** active
**Decision source:** product comparison with LinkStack, Singlelink, LinkFree, Shlink, and Supabase-oriented SaaS reference architecture.

## Product Position

LinkMAX already includes a block editor, templates, smart links, UTM attribution, analytics, scheduled blocks, custom-domain data, Business Zones, and Supabase-backed authorization. The work below strengthens these existing paths rather than introducing parallel products.

| Reference | Useful pattern | LinkMAX decision |
|---|---|---|
| [LinkStack](https://github.com/LinkStackOrg/LinkStack) | Community themes and multi-user administration | Use versioned declarative theme packs, never executable theme code. |
| [Singlelink](https://github.com/singlelink-co/Singlelink) | Domains, SEO metadata, custom link types | Improve the existing publishing/domain flow; do not adopt its older application stack. |
| [LinkFree](https://github.com/MichaelBarney/LinkFree) | Portable templates and user choice | Keep page/template export portable and vendor-neutral. |
| [Shlink](https://github.com/shlinkio/shlink) | Safe redirect contracts and link analytics | Extend the existing smart-link edge function and event taxonomy. |
| [NextBase](https://github.com/imbhargav5/nextbase-nextjs-supabase-starter) | RLS tests, migrations, typed data boundaries | Apply these practices to LinkMAX's Supabase-first stack. |

## Completed Slice: Portable Appearance and Templates

- Theme import/export uses a versioned JSON envelope and schema allow-list.
- Imported image backgrounds are limited to HTTPS URLs; unsupported fields are discarded.
- The editor warns when an accent's computed text contrast is below the enhanced AAA text target.
- User templates persist `theme_settings` with their blocks and restore it on apply.
- Applying a template continues to generate fresh block IDs.

## Next Vertical Slices

### 1. Customization Quality (2 weeks)

1. Add mobile/desktop preview modes and visual regression coverage for every built-in theme.
2. Version built-in presets and add migration adapters when a theme token is renamed or removed.
3. Add template-level validation: supported block types, maximum asset size, and accessible foreground/background combinations.
4. Add copy/apply choices: replace current page, create a page copy, or apply appearance only.

**Exit criterion:** a template or imported theme never creates invalid page data and the same appearance renders in editor and public page snapshots.

### 2. Smart-Link Lifecycle (2 weeks)

1. Extend the existing smart-link UI with start/end scheduling, click limits, and archived state.
2. Add UTM presets and per-link attribution views, reusing the current `smart_links` and analytics contracts.
3. Add server-side tests for inactive, expired, malformed, and unauthorized redirect requests.
4. Preserve open-redirect protections and rate limits in the redirect edge function.

**Exit criterion:** every redirect is owner-managed, expiry is enforced server-side, and click totals remain attributable.

### 3. Analytics for Decisions (3 weeks)

1. Aggregate existing `page_view`, impression, click, lead, booking, and purchase events into a consistent funnel.
2. Exclude known bots and aggregate location/device data without storing unnecessary personal data.
3. Expose source, UTM, block CTR, and conversion reports with CSV export.
4. Add data-retention and event-schema tests before enabling new event dimensions.

**Exit criterion:** an owner can trace a conversion to source and block without client-only trust or duplicate counting.

### 4. Publishing and Domains (3 weeks)

1. Add a domain connection wizard with DNS, certificate, and rollback status.
2. Validate canonical URL, title, description, Open Graph image, favicon, and indexing state before publish.
3. Publish immutable page versions and support a one-step rollback.
4. Add edge-cache metrics and public-page performance budgets.

**Exit criterion:** a page can be safely published, diagnosed, and rolled back without manual database intervention.

### 5. Workspaces and Permissions (3 weeks)

1. Make personal account, Business Zone, page, and active account context explicit in the UI and API.
2. Add owner, editor, and analyst permissions for pages, templates, analytics, and domains.
3. Add invitation lifecycle and append-only audit records for sensitive changes.
4. Cover owner/non-owner behavior with RLS tests for every user-owned table in scope.

**Exit criterion:** users can switch accounts safely and no mutation relies on client-side role checks.

## Delivery Rules

- Ship every slice with schema/migration, RLS policy, trusted backend path, UI, telemetry, and tests.
- Use feature flags or a constrained rollout for changes affecting public rendering, authentication, analytics, or payments.
- Do not permit arbitrary third-party JavaScript in themes or templates. Use reviewed integration adapters and CSP-compatible APIs.
- Maintain the OWASP workstream in `POST_AUDIT_EXECUTION_PLAN_2026-07.md` as a release gate for affected changes.
