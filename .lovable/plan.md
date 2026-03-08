

# LinkMAX SEO/Indexing Architecture — Radical Rebuild Plan

## 1. Technical Verdict

**Current state**: Dynamic rendering (bot-only SSR) via Cloudflare Worker → Edge Function. Works for 3 routes: `/`, `/gallery`, `/:slug`. Everything else — `/pricing`, `/experts`, `/alternatives`, `/for-masters`, `/seo-landing` — serves the empty SPA shell to bots. Bots that don't execute JS see only `index.html`'s noscript block for those pages.

**Critical problems**:
- Marketing pages (`/pricing`, `/experts/:tag`, `/alternatives`, `/for-masters`) have ZERO SSR — bots get an empty `<div id="root">` with a pulsing skeleton
- CF worker `WHITELIST_PAGES` sends bot traffic for these pages directly to origin (SPA), bypassing SSR entirely
- `index.html` contains a **fake `aggregateRating`** (4.9 / 1500 reviews) with no real review data — this violates Google's structured data guidelines and risks a manual action
- Brand inconsistency: `index.html` says "LinkMAX", SSR templates say "lnkmx" — confuses entity recognition
- `GALLERY_FILTERS` array has exact duplicates (15 items listed twice = 30 entries, double sitemap URLs)
- No child page URLs exist — services, products, events are embedded inside profile pages with no individual crawlable URL
- No IndexNow or automated submission on publish/update
- No sitemap index — single flat sitemap will hit 50K URL limit as platform grows
- Noscript fallback in `index.html` is static Russian-only — useless for route-specific SEO

**Guiding principle**: Every public URL that should rank must return complete HTML with correct metadata to ALL user agents — not just bots. Dynamic rendering is a workaround, not architecture.

---

## 2. P0 — Must Ship First (Critical Fixes)

### 2.1 Extend CF Worker SSR to ALL public marketing pages

**Problem**: `/pricing`, `/experts`, `/experts/:tag`, `/alternatives`, `/for-masters`, `/seo-landing`, `/terms`, `/privacy`, `/payment-terms` all serve empty SPA to bots.

**Fix**: 
- Add SSR handlers in the Edge Function for each marketing page (or a generic `marketing-page` handler that accepts a page key)
- Update CF Worker: move marketing pages from `WHITELIST_PAGES` (origin passthrough) to a new `SSR_MARKETING_PAGES` set that routes bots to SSR
- Each marketing SSR handler returns complete HTML with correct title, description, OG, canonical, schema, and visible content matching what JS renders

**Files**: `cloudflare-worker/prerender-worker.js`, `supabase/functions/generate-sitemap/index.ts`, new `ssr-marketing-templates.ts`

### 2.2 Remove fake aggregateRating from index.html

**Problem**: `"aggregateRating": {"ratingValue": "4.9", "ratingCount": "1500"}` in `index.html` — there is no review system backing this data. This is fabricated structured data.

**Fix**: Remove the `aggregateRating` block entirely. Add it back only when real user reviews exist with a verifiable data source.

**File**: `index.html`

### 2.3 Fix brand consistency

**Problem**: `index.html` uses "LinkMAX" everywhere. SSR templates use "lnkmx". Search engines see two different brand names for the same entity.

**Fix**: Standardize to one brand name across all SSR templates, index.html, and schema markup. Choose "LinkMAX" as primary, "lnkmx" as `alternateName`.

**Files**: `index.html`, `supabase/functions/generate-sitemap/ssr-templates.ts`, `supabase/functions/generate-sitemap/index.ts`

### 2.4 Fix duplicate GALLERY_FILTERS

**Problem**: `GALLERY_FILTERS` array in `index.ts` lists 15 niches twice (lines 66-83), generating duplicate sitemap URLs.

**Fix**: Deduplicate to a single `Set` or array.

**File**: `supabase/functions/generate-sitemap/index.ts`

### 2.5 Add `/experts/:tag` SSR for bots

**Problem**: CF Worker line 351 — multi-segment paths like `/experts/beauty` go straight to origin SPA. Bots see empty shell for all niche category pages.

**Fix**: Add explicit handling in CF Worker for `/experts/:tag` paths → route to `SSR_FUNCTION_URL/ssr/experts/{tag}`. Add corresponding `handleExpertsSSR(tag, lang)` in Edge Function.

**Files**: `cloudflare-worker/prerender-worker.js`, `supabase/functions/generate-sitemap/index.ts`

---

## 3. P1 — Strong Indexing Gains

### 3.1 Child page routes for services/products/events

**Architecture**: Add indexable child URLs under user profiles:
- `/:slug/services/:serviceId` — individual service page
- `/:slug/events/:eventId` — individual event page  

**Rules for indexability**:
- Service page: must have name, price, and description (>30 chars). Otherwise `noindex` or don't create URL.
- Event page: must have title, date, and description. Past events: `noindex` after 30 days.
- Thin pages stay canonical to parent `/:slug`

**Implementation**:
- Add routes in `main.tsx`: `{ path: ":slug/services/:serviceId", element: <PublicServicePage /> }` etc.
- Add SSR handlers in Edge Function for these routes
- Add CF Worker handling for 2-segment slug paths (`/:slug/services/:id`)
- Create `PublicServicePage.tsx` and `PublicEventPage.tsx` components
- Schema: `Service` with `provider`, `offers`, `areaServed`; `Event` with `location`, `organizer`, `offers`

### 3.2 Sitemap index architecture

**Current**: Single flat sitemap. **Target**: Sitemap index with sub-sitemaps:

```text
/sitemap.xml              → sitemap index
/sitemap-static.xml       → marketing pages (landing, pricing, etc.)
/sitemap-profiles.xml     → all published user profiles
/sitemap-experts.xml      → /experts and /experts/:tag pages
/sitemap-gallery.xml      → gallery + niche filter pages
/sitemap-services.xml     → child service pages (when implemented)
/sitemap-events.xml       → child event pages (when implemented)
```

Each sub-sitemap paginated at 10K URLs. `lastmod` from actual `updated_at`, not `today`.

**File**: Rewrite `handleSitemap()` in Edge Function.

### 3.3 IndexNow integration

**Trigger**: On page publish/unpublish/update (via `save_page_blocks` or page settings save), call IndexNow API for the changed URL.

**Implementation**: 
- New Edge Function `notify-indexnow` that accepts a URL and submits to IndexNow endpoint (Bing, Yandex support it natively)
- Call from client after successful publish: `supabase.functions.invoke('notify-indexnow', { body: { url } })`
- Also trigger for sitemap URL on batch changes

### 3.4 Content quality gate for sitemap inclusion

**Rules engine** (implement in sitemap generator):
- Profile page included in sitemap only if: `is_published = true` AND has ≥2 blocks AND has title AND has description or bio text
- Service child page: included only if has name + price + description length ≥ 30
- Event child page: included only if future or within last 30 days
- Gallery filter page: included only if ≥3 profiles match that niche
- Pages failing quality gate: excluded from sitemap, get `noindex` in SSR response

### 3.5 Internal linking architecture

Add crawlable internal links in SSR output:
- **Profile SSR** → link to `/experts/{niche}` (breadcrumb), link to child service/event pages
- **Gallery SSR** → link to each profile card as `<a href="/{slug}">`
- **Experts SSR** → link to gallery and to top profiles in that niche
- **Landing SSR** → link to `/gallery`, `/experts`, `/pricing`
- **BreadcrumbList** schema on all pages: Home → [Gallery|Experts] → [Profile] → [Service|Event]

---

## 4. P2 — Scale & Quality

### 4.1 Serve SSR HTML to ALL users (not just bots)

Move from dynamic rendering to universal SSR for public pages. The CF Worker serves SSR HTML with a `<script>` tag that hydrates the React SPA on top. This eliminates the bot/human split and gives everyone fast FCP.

This is a larger architectural change — park for later but design current SSR templates to be hydration-ready (add `data-` attributes, use same DOM structure as React components).

### 4.2 Entity profile completeness scoring

Add a `seo_completeness_score` computed field (0-100) based on:
- Has avatar (15pts), bio >50 chars (15pts), ≥3 services (15pts), location (10pts), sameAs links (10pts), FAQ (10pts), booking enabled (15pts), niche set (10pts)

Display in editor as "Profile strength" meter. Pages below 30 get `noindex` suggestion.

### 4.3 Canonical strategy for custom domains

When user has `custom_domain` set:
- Canonical for that profile = `https://custom-domain.com/`
- SSR output uses custom domain in canonical, OG, and schema
- Sitemap includes custom domain URL (not lnkmx.my URL)
- CF Worker already handles custom domain → slug resolution

### 4.4 Monitoring Edge Function

New Edge Function `seo-health-check` (cron or manual):
- Verify top 100 profiles return 200 from SSR
- Check sitemap XML validity
- Log profiles with broken/missing SSR
- Track indexing coverage via Search Console API (future)

---

## 5. Files Changed Summary

| Priority | File | Action |
|----------|------|--------|
| P0 | `index.html` | Remove fake aggregateRating, fix brand to "LinkMAX" |
| P0 | `cloudflare-worker/prerender-worker.js` | Route bot traffic for marketing pages + `/experts/:tag` to SSR |
| P0 | `supabase/functions/generate-sitemap/index.ts` | Add marketing page SSR handlers, fix GALLERY_FILTERS dupes, add experts/:tag handler |
| P0 | `supabase/functions/generate-sitemap/ssr-templates.ts` | Fix brand to "LinkMAX", add marketing page templates |
| P1 | `src/main.tsx` | Add child page routes (`/:slug/services/:id`, `/:slug/events/:id`) |
| P1 | New: `src/pages/PublicServicePage.tsx` | Individual service page component |
| P1 | New: `src/pages/PublicEventPage.tsx` | Individual event page component |
| P1 | `supabase/functions/generate-sitemap/index.ts` | Sitemap index architecture, quality gate, child page sitemap |
| P1 | New: `supabase/functions/notify-indexnow/index.ts` | IndexNow submission on publish |
| P2 | `src/components/seo/EnhancedSEOHead.tsx` | Entity completeness scoring |

---

## 6. What NOT to Do

- Don't switch to Next.js/SSG — the CF Worker + Edge Function SSR approach works, just needs to cover ALL public routes
- Don't create doorway pages for cities/keywords without real user content
- Don't add `aggregateRating` back without real reviews
- Don't create empty child pages — quality gate must prevent thin URLs
- Don't over-invest in `llms.txt` or AI-specific meta tags — proper HTML + schema is what matters
- Don't try to SSR the editor/dashboard — keep those CSR-only

---

## 7. Final Recommendation

**Target architecture**: Every public URL on lnkmx.my returns complete, correct HTML with metadata and schema to every user agent, via Cloudflare Worker → Edge Function SSR. No public page depends on client-side JS for its primary content.

**Main bottleneck**: CF Worker `WHITELIST_PAGES` silently sends bots to empty SPA shell for ~8 marketing pages. This is the single biggest indexing gap.

**Main radical change**: Child page URLs for services and events — transforms LinkMAX from "one page per user" to "entity network per user", dramatically increasing indexable surface and long-tail keyword coverage.

**First technical decision**: Extend the CF Worker to SSR ALL whitelisted marketing pages for bots. This is a ~2 hour fix that immediately makes `/pricing`, `/experts`, `/alternatives`, `/for-masters` indexable.

**Highest-impact phase**: P0 (fix CF Worker routing + remove fake schema) — unblocks indexing for pages that already exist but are currently invisible to search engines.

