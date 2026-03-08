

# P2.7: Service Resolution Layer — Migrate to item-id-keyed Truth Model

## 1. Verdict

**Bottleneck**: `service_slugs` is correctly maintained in `save_page_blocks` as `{itemId: {slug, state, title}}`, but zero resolution paths use it. All three consumers — client `PublicServicePage`, SSR `handleServiceSSR`, and profile SSR service links — still `slugify(item.name)` at resolution time. A single service rename breaks the child URL despite the mapping being stable in DB. The entire P2.6 refactor is dead code from a routing perspective.

**Principle**: Resolution must go `routeSlug → service_slugs → itemId → pricing item`. Title-derived slug generation is allowed only at creation time inside `save_page_blocks`.

---

## 2. Resolution Contract

New shared helper returns:

```ts
interface ServiceResolution {
  found: boolean;
  itemId?: string;
  slug?: string;
  state?: 'active' | 'thin' | 'removed';
  title?: string;
  pricingItem?: { name: string; description?: string; price?: number; currency?: string };
  notFoundReason?: 'no_mapping' | 'item_missing' | 'removed' | 'parent_unpublished';
}
```

---

## 3. Behavior Matrix

| State | SSR | Client | Sitemap | Robots |
|-------|-----|--------|---------|--------|
| active | 200 | render | include | index |
| thin | 200, noindex | render | exclude | noindex |
| removed | 301 → parent | redirect | exclude | — |
| no mapping match | 404 | "not found" | — | — |
| item exists but no mapping | 404 | "not found" | — | — |

---

## 4. Changes

### Phase A — Resolution helpers + client fix

**New file**: `src/lib/seo/service-resolver.ts`
- `resolveServiceBySlug(serviceSlugs, pricingItems, routeSlug)` → `ServiceResolution`
- Works with both new id-keyed format and legacy entries
- Single source of resolution truth for client code

**Refactor**: `src/components/screens/PublicServicePage.tsx`
- Fetch `service_slugs` from `pages` table alongside page data
- Fetch pricing blocks as before
- Call `resolveServiceBySlug()` instead of inline slugify loop
- Handle `removed` state → redirect to parent
- Handle `thin` state → render but no canonical boost

### Phase B — SSR fix

**Refactor**: `supabase/functions/generate-sitemap/index.ts`

1. **`handleServiceSSR()`** (lines 473-515): 
   - Add `service_slugs` to the page query SELECT
   - Replace the slugify-loop with: iterate `service_slugs` entries, find entry where `entry.slug === serviceSlug`, then find pricing item by `itemId`
   - Handle states: `removed` → 301 to parent, `thin` → 200 with `noindex`, `active` → 200 with `index`
   - Legacy fallback: if no `service_slugs` match found, try old slugify loop (temporary, for pages not yet re-saved)

2. **Profile SSR service links** (lines 352-365):
   - Add `service_slugs` to page query
   - When building service links in profile HTML, use slug from `service_slugs` mapping instead of `slugify(name)`
   - Match items to mapping entries by item `id` field
   - Only link services with `state === 'active'`

### Phase C — Sitemap service child URLs

Currently no service child sitemap exists. Add to `buildProfilesSitemap()`:
- Fetch `service_slugs` alongside page data
- For each page with service_slugs, emit child URLs where `state === 'active'`
- Use the stable slug from the mapping, not title-derived

Or: add a `sitemap-services.xml` segment to the sitemap index. Either approach works; embedding in profiles sitemap is simpler for now.

### Phase D — Missing ID normalization

**Problem**: Old pricing items may lack `id`. These items won't appear in `service_slugs` at all (the `save_page_blocks` function skips items with `length(id) < 2`).

**Fix**: In `PricingBlockEditor.tsx`, the `addItem` already generates UUID ids. Add normalization on block load:
- In the pricing block content loading path, if any item lacks `id`, assign `price-${crypto.randomUUID()}` before first render
- This ensures next save will create a proper `service_slugs` entry

**Server safeguard**: In `save_page_blocks`, for items without id, generate one server-side instead of skipping:
```sql
IF length(v_item_id) < 2 THEN
  v_item_id := 'auto-' || gen_random_uuid()::text;
END IF;
```

---

## 5. Files to Change

| File | Change |
|------|--------|
| **New**: `src/lib/seo/service-resolver.ts` | Shared resolution helper |
| `src/components/screens/PublicServicePage.tsx` | Use resolver, fetch service_slugs |
| `supabase/functions/generate-sitemap/index.ts` | SSR resolution + profile links + sitemap child URLs |
| `src/components/block-editors/PricingBlockEditor.tsx` | Normalize missing IDs on load |
| Migration SQL | Update `save_page_blocks` to auto-generate IDs for items without one |

---

## 6. Migration

One migration to update `save_page_blocks`: remove the `IF length(v_item_id) < 2 THEN CONTINUE` and replace with auto-id generation. No schema changes needed.

---

## 7. Legacy Fallback

SSR keeps a temporary fallback: if `service_slugs` is null/empty (page never re-saved after migration), fall back to old slugify loop. This fallback:
- Is clearly commented as temporary
- Logs a warning when triggered
- Will be removed after all pages have been re-saved (or a batch backfill runs)

Client `PublicServicePage` gets the same fallback.

---

## 8. What NOT to Do

- Do not slugify title for lookup anywhere except inside `save_page_blocks` at creation time
- Do not create a separate services table — the JSONB model is sufficient
- Do not add manual slug editing UI in this phase
- Do not remove legacy fallback yet — pages that haven't been re-saved still need it

---

## 9. Priority Order

1. **Phase A** (resolver + client) — immediate, highest impact on URL stability
2. **Phase B** (SSR) — critical for bots seeing correct pages after rename  
3. **Phase D** (missing ID normalization) — prevents orphan items
4. **Phase C** (sitemap child URLs) — completes the loop

---

## 10. Risk

**Main risk**: Pages never re-saved after P2.6 migration have legacy-N keys in `service_slugs` that don't match actual pricing item IDs. The legacy fallback handles this, but a future batch re-save or backfill migration should be planned.

**One-sentence architecture**: Every service child URL resolves through the `service_slugs` mapping as the single lookup index, never through title slugification.

