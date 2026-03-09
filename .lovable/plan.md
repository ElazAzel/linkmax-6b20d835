

# P2.8: Persistence Integrity Hardening — Plan

## 1. Verdict

**Critical bug confirmed**: In `save_page_blocks`, blocks are inserted at lines 52-63 **before** the child lifecycle loop (lines 87-152). When an item lacks an ID, `v_item_id` is auto-generated at line 96, used for `service_slugs` — but **never written back** into the stored block content. Result: `service_slugs` references an ID that doesn't exist in `blocks.content.items[]`. The resolver then hits an orphan on every lookup, falls back to mapping title, and renders a false-positive 200 page from stale mapping data instead of real pricing item content.

**Second bug**: Orphan resolution (resolver lines 120-128) returns `found: true` with `pricingItem: { name: entry.title }`. This treats a broken entity as a valid service page. A visitor sees a page with no price, no description, no real data — just a title from mapping.

**Principle after this fix**: A child entity is valid if and only if `blocks.content.items[].id === service_slugs[key]` for some key. No match = broken state, not a pseudo-page.

## 2. Changes

### Phase A — `save_page_blocks` persistence fix (Migration)

Restructure the SQL function so item ID normalization happens **before** block insertion:

1. **Before** inserting blocks: iterate `p_blocks`, find pricing blocks, normalize items — assign `auto-{uuid}` to any item with `length(id) < 2`, write the ID back into the JSONB array element.
2. Insert the **normalized** `p_blocks` into `blocks` table.
3. Then run the child lifecycle loop as before (it will now always find matching IDs in stored content).

This is a single atomic operation — normalize JSON, insert, then sync `service_slugs`.

### Phase B — Resolver orphan state fix

Update `src/lib/seo/service-resolver.ts`:
- Orphan case (mapping exists, item not found by ID) → return `{ found: false, notFoundReason: 'item_missing' }` instead of `found: true`.
- Add `notFoundReason: 'item_missing'` to the contract.

Update `src/components/screens/PublicServicePage.tsx`:
- `item_missing` → show "Service not found" (same as `no_mapping`), or redirect to parent. Choose: **redirect to parent** (301 equivalent via `<Navigate>`), since the mapping once existed, meaning there was a real URL — better to redirect than 404 for SEO.

Update `supabase/functions/generate-sitemap/index.ts` `handleServiceSSR`:
- Orphan case (lines 549-552) → return 301 to parent instead of rendering a hollow page.

### Phase C — Client normalization alignment

`PricingBlockEditor` already normalizes IDs on load (lines 50-56). This is correct as a **convenience layer** — it ensures the editor always works with IDs. But it must not be the only defense. After Phase A, the server is the guarantee.

No changes needed here — the existing client normalization is fine as-is.

### Phase D — Diagnostics (minimal)

Update `get_page_search_diagnostics` RPC to count orphan mappings: items in `service_slugs` where the key doesn't match any item ID in pricing blocks. Expose as `orphan_count` in child_summary. This is a small SQL addition to the existing diagnostics function.

## 3. Files to Change

| File | Change |
|------|--------|
| **New migration SQL** | Rewrite `save_page_blocks` — normalize item IDs in `p_blocks` JSONB before insert |
| `src/lib/seo/service-resolver.ts` | Orphan → `found: false, notFoundReason: 'item_missing'` |
| `src/components/screens/PublicServicePage.tsx` | Handle `item_missing` → redirect to parent |
| `supabase/functions/generate-sitemap/index.ts` | SSR orphan → 301 to parent |

## 4. Migration SQL approach

The key change in `save_page_blocks`:

```text
1. Declare v_normalized_blocks jsonb := p_blocks
2. Loop through v_normalized_blocks array elements
3. For each pricing block, loop through content.items
4. If item has no id or id too short, set id = 'auto-' || gen_random_uuid()
5. Write modified item back into v_normalized_blocks via jsonb_set
6. INSERT blocks FROM v_normalized_blocks (not p_blocks)
7. Run child lifecycle loop against v_normalized_blocks
```

JSONB array mutation in PL/pgSQL requires rebuilding the array. The approach:
- For each pricing block, rebuild the items array with normalized IDs
- Replace the block's content.items with the normalized array
- Replace the block in the blocks array

## 5. Behavior Matrix (updated)

| State | SSR | Client | Sitemap |
|-------|-----|--------|---------|
| active (item found) | 200 | render | include |
| thin (item found) | 200 noindex | render | exclude |
| removed | 301 → parent | redirect | exclude |
| orphan (mapping, no item) | 301 → parent | redirect | exclude |
| no mapping | 404 | "not found" | — |
| legacy fallback | 200 | render | exclude |

## 6. Priority

**Phase A first** — this is the root cause. Without persisted IDs, everything downstream is broken. Phase B immediately after — stops rendering fake pages. C is already done. D is polish.

## 7. Risks

- JSONB array mutation in PL/pgSQL is verbose but safe. Must test that `jsonb_set` with array indices works correctly for multi-item pricing blocks.
- Existing pages with orphan mappings will start redirecting instead of showing hollow pages — this is **correct behavior**, not a regression.
- Legacy fallback in resolver stays for now (pages never re-saved).

