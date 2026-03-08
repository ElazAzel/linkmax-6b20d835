

# P1: Entity-First Public Architecture for LinkMAX

## 1. Technical Verdict

**Main bottleneck after P0**: SSR exists but only for bots. Humans still get empty SPA shell on all public pages. Profile pages lack entity-grade data — `pages` table has `title`, `description`, `niche`, `avatar_url` but no `city`, `profession`, `sameAs`, `contactPoint`. There are no child page URLs for services/events at all. The `events` table exists but has zero public route. Services live only inside block JSON (`pricing` block `content.items`) with no dedicated table or URL. Sitemap is a single flat XML file approaching scale limits.

**Why bot-SSR on some routes isn't a win**: Google increasingly devalues dynamic rendering as a workaround. Bot-only SSR creates a "two versions" problem where schema/content can drift from SPA output. Social preview bots get SSR but actual users clicking those links get a blank shell for 2-3 seconds. This hurts engagement signals which hurts ranking.

**P1 architectural principle**: Every public indexable URL must return the **same** complete HTML to all user agents. SSR output becomes the primary document; React hydrates on top for interactivity. No more bot/human split.

---

## 2. Public Route Map

### A. Marketing surfaces (already SSR for bots — need universal SSR)
| Route | Schema | Canonical | Sitemap | Index |
|-------|--------|-----------|---------|-------|
| `/` | WebSite + Organization + SoftwareApp | `https://lnkmx.my/` | yes | yes |
| `/pricing` | WebPage | `https://lnkmx.my/pricing` | yes | yes |
| `/alternatives` | WebPage | `https://lnkmx.my/alternatives` | yes | yes |
| `/for-masters` | WebPage | `https://lnkmx.my/for-masters` | yes | yes |
| `/seo-landing` | WebPage | `https://lnkmx.my/seo-landing` | yes | yes |
| `/experts` | CollectionPage + ItemList | `https://lnkmx.my/experts` | yes | yes |
| `/experts/:tag` | CollectionPage + ItemList | `https://lnkmx.my/experts/{tag}` | yes, if ≥3 profiles | yes |
| `/gallery` | CollectionPage + ItemList | `https://lnkmx.my/gallery` | yes | yes |
| `/terms`, `/privacy`, `/payment-terms` | WebPage | canonical self | yes | yes (low priority) |

### B. Entity surfaces
| Route | Schema | Canonical | Sitemap | Index rule |
|-------|--------|-----------|---------|------------|
| `/:slug` | ProfilePage + Person/Org | `https://lnkmx.my/{slug}` | yes if passes quality gate | yes if published + quality ≥ 40 |
| Custom domain | ProfilePage + Person/Org | `https://custom-domain/` | separate sitemap entry | yes if published + quality ≥ 40 |

### C. Child entity surfaces (NEW)
| Route | Schema | Canonical | Sitemap | Index rule |
|-------|--------|-----------|---------|------------|
| `/:slug/services/:serviceSlug` | Service + Offer | self | yes if content sufficient | name + desc ≥ 30 chars + price |
| `/:slug/events/:eventId` | Event | self | yes if future or < 30d past | title + date + desc ≥ 30 chars |

### D. Non-indexable (no SSR, no sitemap)
`/dashboard/*`, `/auth`, `/admin/*`, `/editor/*`, `/crm`, `/settings`, `/install`, `/team/*`, `/join/*`, `/invites/*`, `/p/:compressed`, `/from/:slug`, `/collab/*`, `gallery?niche=X&sort=Y` (multi-param filter combos)

---

## 3. Unified Public SSR Architecture

### Target architecture
```text
User/Bot → Cloudflare Worker → checks route type:
  ├── Static asset (.js,.css,.png) → origin CDN
  ├── Blacklisted (/dashboard,/auth) → origin SPA (add X-Robots-Tag: noindex)
  ├── Public route → Edge Function SSR → complete HTML response
  │     └── React SPA hydrates on top (same HTML structure)
  └── Sitemap → Edge Function → XML
```

### How it works
1. **CF Worker**: For ALL public routes (marketing, profiles, child pages, gallery), proxy to SSR Edge Function regardless of user agent. Remove the `isBot()` check for public routes entirely. Bot detection only remains for analytics tagging (`X-Bot-Request: true` header).

2. **SSR Edge Function** (`generate-sitemap` or split into `seo-ssr`): Returns full HTML with `<div id="root">` containing server-rendered content + `<script>` tags loading the Vite SPA bundle. The SPA hydrates over the server HTML.

3. **Cache**: CF Worker caches SSR responses at edge:
   - Marketing pages: `s-maxage=3600`
   - Profile pages: `s-maxage=600, stale-while-revalidate=3600`
   - Child pages: `s-maxage=600, stale-while-revalidate=3600`
   - Gallery: `s-maxage=300`
   - Invalidation via `Cache-Tag` + purge API on publish/update

4. **Hydration approach**: SSR HTML includes a `<script type="module" src="/assets/index-[hash].js"></script>` tag. The React app detects pre-rendered content and hydrates instead of full re-render. This is the key architectural shift — SSR is no longer a separate "bot page" but the actual initial page load for everyone.

5. **Dashboard/editor**: Zero change. CF Worker continues to serve origin SPA for all `/dashboard/*`, `/auth`, `/admin/*` paths. These remain pure CSR.

### Implementation reality check
Full universal SSR with hydration is a P2 effort (requires the SSR templates to exactly match React component DOM structure). **For P1, the pragmatic approach**:
- Serve SSR HTML to ALL user agents (not just bots) for public routes
- SSR HTML includes a redirect/bootstrap script that loads the SPA
- SPA replaces SSR content on mount (not true hydration, but users get instant content + fast FCP)
- This eliminates the bot/human split immediately without requiring DOM-perfect hydration

---

## 4. Entity-First Profile Architecture

### Current `pages` table entity fields
Has: `title`, `description`, `niche`, `avatar_url`, `slug`, `custom_domain`, `is_published`, `is_indexable`, `quality_score`

### Missing entity-grade fields (add to `pages`)
| Field | Type | Purpose |
|-------|------|---------|
| `city` | text | PostalAddress.addressLocality |
| `country_code` | text | ISO 3166-1 alpha-2 |
| `profession` | text | jobTitle / role (more specific than niche) |
| `entity_type` | text | 'person' or 'organization' (default 'person') |
| `contact_email` | text | public contact (opt-in) |
| `contact_phone` | text | public contact (opt-in) |
| `contact_whatsapp` | text | public WhatsApp link |

### Fields derivable from blocks (compute at SSR time, don't store)
- `sameAs` → extracted from `socials` block `content.platforms[].url`
- `knowsAbout` → extracted from `pricing` block service names
- `services list` → from `pricing` blocks
- `bio/description` → from `text` blocks or `profile` block
- `booking availability` → from `booking` block existence
- `FAQ` → from `faq` block

### Minimum entity profile for indexation (quality gate)
Score 0-100, computed on save:
- Has title/display name: 15pts
- Has avatar: 10pts
- Has bio > 50 chars (text/profile block): 15pts
- Has niche set (not 'other'): 10pts
- Has ≥ 1 service/pricing item: 15pts
- Has city: 10pts
- Has ≥ 1 social link: 10pts
- Has booking or contact method: 15pts

**Indexable threshold: ≥ 40 points**. Below 40 → `noindex`, excluded from sitemap.

The existing `quality_score` column on `pages` will store this. Recompute on every `save_page_blocks` call.

---

## 5. Child Page Architecture

### Services
- **Data source**: `pricing` block `content.items[]` — each item has `name`, `description`, `price`, `currency`
- **No new table needed** for P1. Services are extracted from block JSON at SSR time.
- **Child URL**: `/:slug/services/:serviceIndex` (using 0-based index as ID since items don't have stable IDs)
  - Better: generate a slug from service name: `/:slug/services/manikur-gel`
- **Quality gate**: name present + (description ≥ 30 chars OR price present). If not met → no child page, stays inline.
- **Schema**: `Service` with `provider` → parent `Person/Organization`

### Events
- **Data source**: `events` table (already exists with `title_i18n_json`, `description_i18n_json`, `start_at`, `location_value`, `price_amount`, `page_id`)
- **Child URL**: `/:slug/events/:eventId`
- **Quality gate**: has title + start_at + (description length ≥ 30 chars OR is_paid). Future events or within last 30 days.
- **Schema**: `Event` with `organizer` → parent entity

### Canonical rules
- Child page canonical = self (`https://lnkmx.my/{slug}/services/{serviceSlug}`)
- If child page too thin → canonical to parent `https://lnkmx.my/{slug}`
- Parent profile page links to all qualifying child pages

### Breadcrumbs
`Home → [Experts/{niche} | Gallery] → {Profile Name} → {Service/Event Name}`

---

## 6. Data Model Changes

### Migration 1: Add entity fields to `pages`
```sql
ALTER TABLE public.pages 
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'KZ',
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS entity_type text DEFAULT 'person',
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_whatsapp text;
```

### Migration 2: Add `slug` to events for URL-friendly child pages
```sql
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS slug text;
```

### No new tables for services
Services are extracted from block JSON. If a dedicated services table is needed later (P2), it can be added then. For P1, SSR extracts from `blocks` where `type = 'pricing'`.

### Quality score recomputation
Update the `save_page_blocks` function to also recompute `quality_score` based on the scoring rubric. Or add a separate trigger.

---

## 7. Metadata Engine v2

### Title formulas
| Page type | Formula |
|-----------|---------|
| Profile | `{displayName} — {profession\|niche} в {city} \| LinkMAX` |
| Profile (no city) | `{displayName} — {profession\|niche} \| LinkMAX` |
| Service child | `{serviceName} — {displayName} \| LinkMAX` |
| Event child | `{eventTitle}, {date} — {displayName} \| LinkMAX` |
| Gallery | `Галерея LinkMAX — примеры страниц {niche?}` |
| Experts | `Эксперты {tag} — LinkMAX` |

### Meta description formulas
- Profile: First 155 chars of bio/description + ". Услуги: {top 2-3 service names}. {city}."
- Service: Service description truncated to 155 chars + ". {price} {currency}."
- Event: Event description + ". {date}, {location}."
- Fallback: "{displayName} на LinkMAX — {niche}"

### Canonical
- All pages: self-referencing canonical
- `?lang=X` is NOT a separate canonical (same content, different language)
- `?niche=X` on gallery: canonicalize to `/experts/{niche}` instead (gallery filter params → noindex or canonical to experts)
- Custom domains: canonical = custom domain URL

### Hreflang
Keep current `?lang=ru|en|kk` + `x-default` pattern. Applied in SSR HTML.

---

## 8. Structured Data Engine v2

### Unified schema builder in Edge Function
Create `buildSchemaGraph(pageType, data)` function that returns JSON-LD `@graph` array:

- **Profile**: `[ProfilePage, Person|Organization, BreadcrumbList, ?FAQPage, ?ItemList(services)]`
- **Service child**: `[WebPage, Service, BreadcrumbList, ?Offer]`
- **Event child**: `[WebPage, Event, BreadcrumbList, ?Offer]`
- **Gallery/Experts**: `[CollectionPage, ItemList, BreadcrumbList]`
- **Marketing**: `[WebPage, ?FAQPage, Organization(LinkMAX)]`

Rules:
- `aggregateRating` only if real reviews exist (currently: never)
- `sameAs` only from verified social links
- `image` from avatar_url, never a placeholder
- `address` only if city is set
- `offers.price` only if real price exists
- All schema fields must have visible HTML counterpart

---

## 9. Indexability Governance

### Rules engine (computed in SSR + sitemap generator)

```
isIndexable(page) =
  page.is_published === true
  AND page.quality_score >= 40
  AND page.slug NOT IN reserved_slugs
  AND (page.is_indexable IS NULL OR page.is_indexable = true)

isChildPageIndexable(service) =
  service.name is not empty
  AND (service.description?.length >= 30 OR service.price exists)

isEventIndexable(event) =
  event.title is not empty
  AND event.start_at is not null
  AND (event.start_at > now() - 30 days)
  AND event.description?.length >= 30
```

Pages failing quality gate: `<meta name="robots" content="noindex, follow">` + excluded from sitemap.

---

## 10. Sitemap Index Architecture

### Target structure
```
GET /sitemap.xml → Sitemap Index:
  - /sitemap-static.xml (marketing + legal pages)
  - /sitemap-profiles.xml (published profiles passing quality gate)
  - /sitemap-experts.xml (expert niche pages)
  - /sitemap-events.xml (future/recent events with child URLs)
```

Service child pages go into `sitemap-profiles.xml` alongside their parent (as additional `<url>` entries) since they share the same data source query.

### Pagination
If profiles > 10K → `sitemap-profiles-1.xml`, `sitemap-profiles-2.xml` etc.

### lastmod
Use actual `pages.updated_at` and `events.updated_at`, never `today`.

### Regeneration
On each request with 1h cache. The Edge Function already uses ETag + stale-while-revalidate. This is sufficient for P1.

---

## 11. Publish/Update/Delete Indexing Pipeline

### New Edge Function: `notify-indexnow`
Accepts `{ urls: string[] }` body. Submits to IndexNow API (Bing/Yandex).

### Triggers
| Event | Action |
|-------|--------|
| Page published | Purge CF cache for `/{slug}`, submit to IndexNow |
| Page updated (save_page_blocks) | Recompute quality_score, purge CF cache |
| Page unpublished | Purge CF cache, URL returns 404 on next crawl |
| Event created | If indexable → submit `/{slug}/events/{eventId}` to IndexNow |
| Event deleted/cancelled | Purge cache |

### Client-side hook
After successful `save_page_blocks` or publish toggle:
```ts
await supabase.functions.invoke('notify-indexnow', { 
  body: { urls: [`https://lnkmx.my/${slug}`] } 
});
```

---

## 12. Internal Linking

### In SSR output
- **Profile page** → links to each qualifying service child page, each event child page
- **Profile page** → breadcrumb link to `/experts/{niche}`
- **Gallery SSR** → each profile card is an `<a href="/{slug}">`
- **Experts SSR** → links to top profiles in niche + link to `/gallery`
- **Landing SSR** → links to `/gallery`, `/experts`, `/pricing`
- **Child pages** → back-link to parent profile

### Breadcrumb schema on every page
Rendered both as visible HTML and BreadcrumbList schema.

---

## 13. Implementation Roadmap

### P1-A: Universal SSR + Quality Score (highest impact)
**Files**:
- `cloudflare-worker/prerender-worker.js` — Remove `isBot()` check for public routes. ALL public routes → SSR Edge Function. Include SPA bundle script tags in SSR response.
- `supabase/functions/generate-sitemap/index.ts` — Update `handleProfileSSR` to include `<script src="/assets/...">` for SPA bootstrap
- `supabase/functions/generate-sitemap/ssr-templates.ts` — Add SPA bootstrap script to all templates
- DB migration: Add entity fields to `pages` table
- DB migration: Update `save_page_blocks` to recompute `quality_score`

**Risk**: CF Worker serving SSR to all users means SSR latency affects everyone. Mitigate with aggressive edge caching (s-maxage=600).

### P1-B: Child Pages + CF Worker Routing
**Files**:
- `src/main.tsx` — Add routes: `/:slug/services/:serviceSlug`, `/:slug/events/:eventId`
- New: `src/pages/PublicServicePage.tsx` — Client-side service page
- New: `src/pages/PublicEventPage.tsx` — Client-side event page
- `cloudflare-worker/prerender-worker.js` — Route `/:slug/services/*` and `/:slug/events/*` to SSR
- `supabase/functions/generate-sitemap/index.ts` — Add `handleServiceSSR` and `handleEventSSR`
- `supabase/functions/generate-sitemap/ssr-templates.ts` — Add `buildServicePageHtml` and `buildEventPageHtml`

**Risk**: Service items lack stable IDs (they're JSON array items). Use name-based slugs with collision handling.

### P1-C: Sitemap Index + IndexNow
**Files**:
- `supabase/functions/generate-sitemap/index.ts` — Rewrite `handleSitemap` to return sitemap index, add sub-sitemap handlers
- New: `supabase/functions/notify-indexnow/index.ts` — IndexNow submission
- Client hooks: Call `notify-indexnow` on publish/update

**Risk**: Low. Sitemap rewrite is contained in one function.

### P1-D: Monitoring
- New: `supabase/functions/seo-health-check/index.ts` — Validate top profiles return 200, check sitemap XML
- Schema validation in SSR templates (ensure JSON-LD is valid)
- Log quality_score distribution

---

## 14. What NOT to Do
- Don't implement full React SSR hydration (P2 at earliest — too complex for P1)
- Don't create child pages for every pricing item regardless of content
- Don't index `gallery?niche=X` separately from `/experts/X` (pick one canonical)
- Don't add entity fields users won't fill (keep it to city, profession, entity_type)
- Don't schema-markup data that isn't visible on the page
- Don't remove the existing SPA rendering — SSR enhances, doesn't replace
- Don't try to SSR dashboard/editor routes

---

## 15. Final Recommendation

**Target P1 architecture in one phrase**: Every public URL returns complete HTML with entity-grade metadata and schema to all user agents, with child pages for services/events expanding the indexable surface per user.

**Main radical change**: Removing the bot/human SSR split — CF Worker sends ALL public traffic through SSR, turning LinkMAX from "SPA with bot workaround" into "HTML-first platform with SPA enhancement".

**Key engineering decision**: Whether to serve SSR HTML to all users in P1 (with SPA bootstrap script) or defer to P2. Recommendation: **do it in P1** — the SSR templates already exist and work. Adding `<script>` tags for SPA bootstrap is ~20 lines of change. The performance win (instant content) and SEO win (no more two-version problem) justify the effort.

**First implementation phase**: **P1-A** — universal SSR routing + entity fields + quality score. This single phase eliminates the bot/human split and establishes the quality gate. Everything else builds on top.

