

# P2.10: Child Search Control Plane — Assessment & Plan

## 1. Verdict

After P2.8, the **entity integrity layer is solid**: IDs persist, orphans redirect, resolver is canonical. The next real bottleneck is that **service child pages have no observable search lifecycle**. "Active" in `service_slugs` ≠ "actually in sitemap" ≠ "actually submitted to IndexNow". There's no way for creator, admin, or diagnostics to know where a child URL stands in the search pipeline. The system does things but doesn't know what it did.

**Principle**: Every child URL must have a deterministic, observable search state — not inferred from `service_slugs.state`, but tracked as a fact.

## 2. What's Already Working (skip)

- `service_slugs` item-id-keyed ✓
- Canonical resolver ✓
- SSR/client/sitemap use mapping ✓
- Persistence hardening ✓
- `indexing_submissions` has `child_item_id`, `child_slug` ✓
- `notify-indexnow` logs child metadata ✓
- Client sends child entries after save ✓

## 3. Remaining Problem: SSR Profile Service Links (P0 Adjacent)

**Lines 352-389 in generate-sitemap/index.ts** still use title-based lookup (`slugsByTitle`) to generate service links in profile SSR HTML. This means if a service is renamed, the SSR profile page will generate a dead link because it matches on `entry.title` not `item.id`. This is a leftover from P2.7 that should have been caught.

**Fix**: Change the profile SSR service links to use item ID matching. The pricing items array already has `id` fields (persisted since P2.8). Match `pricingItem.id` → `service_slugs[itemId]` directly.

## 4. Core Changes

### Phase A — Fix SSR profile service links (P0)

**File**: `supabase/functions/generate-sitemap/index.ts` lines 352-389

Current broken flow:
```
for entry in service_slugs → slugsByTitle.set(entry.title, entry.slug)
for service in services → serviceSlug = slugsByTitle.get(s.name)
```

New correct flow:
```
Build itemIdToSlug map: service_slugs[itemId].slug (only active)
When rendering services, each pricing item has item.id
serviceSlug = itemIdToSlug.get(item.id)
```

This requires carrying `item.id` through the services array in the SSR rendering loop. Currently `services` is built at line 323-329 without preserving item ID. Need to add `id` to the services collection.

### Phase B — Diagnostics: child search state enrichment

**Expand `get_page_search_diagnostics` RPC** to join child entries with their latest `indexing_submissions` row per (child_item_id, provider). This already partially exists but should be formalized:

For each child in `service_slugs`:
- `last_indexnow_at`: MAX created_at from submissions where child_item_id matches and status = 'sent'
- `last_submission_status`: latest status
- `is_in_sitemap`: derived from state = 'active' AND parent quality >= 40

No new table needed. The `indexing_submissions` table already has `child_item_id` and `child_slug`. Diagnostics just needs to query it properly.

### Phase C — Creator-facing child search summary

Update `SearchReadinessCard` (or wherever creator sees diagnostics) to show:
- "N services visible in search"
- "N services excluded (add description)"
- "N services removed"

This is a UI-only change using existing `child_summary` data from diagnostics.

## 5. Files to Change

| File | Change |
|------|--------|
| `supabase/functions/generate-sitemap/index.ts` | Fix profile SSR service links: use item.id → service_slugs mapping instead of title-based lookup |
| `supabase/functions/generate-sitemap/index.ts` | Deploy after fix |

## 6. Detailed SSR Fix

Lines 323-329 currently build services array as `{ name, description, price }`. Change to also capture `id`:
```ts
services.push({ id: String(item.id || ''), name: ..., description: ..., price: ... });
```

Lines 358-369 replace `slugsByTitle` with `itemIdToSlug`:
```ts
const itemIdToSlug: Map<string, string> = new Map();
if (svcSlugs && typeof svcSlugs === 'object') {
  for (const [itemId, entry] of Object.entries(svcSlugs)) {
    if (entry && entry.state === 'active' && entry.slug) {
      itemIdToSlug.set(itemId, entry.slug);
    }
  }
}
```

Lines 371-388 replace title lookup with ID lookup:
```ts
let serviceSlug = s.id ? itemIdToSlug.get(s.id) : undefined;
let isActive = !!serviceSlug;
// Legacy fallback unchanged for pages not yet re-saved
```

## 7. What NOT to Do

- No new tables — `indexing_submissions` already covers child tracking
- No new edge functions — existing `notify-indexnow` handles child submissions
- No materialized views — diagnostics RPC is sufficient
- No client-side search state tracking — server is the truth

## 8. Adjacent Platform Improvements

### P0 adjacent — SSR profile service links (included above)
Title-based lookup in profile SSR is the last remaining title-dependent resolution path. Without fixing it, renamed services get dead links in bot-facing HTML. **This is the primary deliverable.**

### P1 adjacent — Diagnostics child submission history
The `get_page_search_diagnostics` RPC should join `indexing_submissions` by `child_item_id` to show last submission time/status per child. Currently child_details exist but may not reflect actual submission history. Low-risk SQL expansion.

### P2 adjacent — Stale emission detection
Add a check: if a child URL was in sitemap last week but state changed to `removed`, and no IndexNow was sent for the removal, flag it. This is polish — not blocking.

## 9. Priority

**Phase A is the only critical change**. It's a surgical fix to ~30 lines in the SSR function. Everything else is incremental improvement on an already-functional pipeline.

