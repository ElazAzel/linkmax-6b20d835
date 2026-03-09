

# P2.11: Diff-Based Child Indexing Orchestration

## 1. Verdict

Current behavior: every save/publish fetches `service_slugs`, builds child entries for ALL active services, and sends them ALL to IndexNow. If a page has 10 services and a user edits their bio, 10 child URLs + 1 parent URL get re-submitted. This creates: (1) noisy submission logs where support can't distinguish real changes from no-ops, (2) wasted IndexNow quota, (3) no visibility into what actually changed. The system knows states but doesn't track transitions.

**Principle**: IndexNow should fire only when a search entity's discoverable state actually changed.

## 2. Architecture

The diff runs **client-side in `useCloudPageState`** by comparing the previous `service_slugs` snapshot (fetched after last save) with the new one (fetched after current save). This is the simplest approach: no new tables, no SQL changes, no edge function changes. The client already fetches `service_slugs` post-save — it just needs to remember the previous fetch.

### Snapshot shape
```ts
type ChildSnapshot = Record<string, { slug: string; state: string }>;
// keyed by itemId
```

### Transitions computed
Compare `old[itemId]` vs `new[itemId]`:
- **new_active**: not in old, in new with state=active → submit child
- **restored**: old state=removed, new state=active → submit child  
- **thin_to_active**: old state=thin, new state=active → submit child
- **active_to_thin**: old state=active, new state=thin → skip (log only)
- **active_to_removed**: old state=active, new state=removed → skip (log only)
- **unchanged_active**: same state=active, same slug → no-op (don't submit)
- **slug_changed**: same itemId, state=active, different slug → submit child (new URL)
- **parent_blocked**: parent qualityScore < 40 or not published → suppress all

### Parent submission rule
Submit parent URL only if:
- First publish ever (no old snapshot)
- Parent was not indexable → became indexable
- NOT on every save when only children changed

## 3. Changes

### Phase A — Client-side diff engine + selective submission

**File: `src/lib/seo/indexnow-client.ts`**

New helper:
```ts
export type ChildTransition = 'new_active' | 'restored' | 'thin_to_active' | 
  'active_to_thin' | 'active_to_removed' | 'unchanged_active' | 'slug_changed' | 'unchanged_other';

export interface ChildDiffResult {
  itemId: string;
  slug: string;
  transition: ChildTransition;
  shouldSubmit: boolean;
}

export function computeChildDiff(
  oldSlugs: Record<string, ServiceSlugEntryRaw> | null,
  newSlugs: Record<string, ServiceSlugEntryRaw> | null,
): ChildDiffResult[]
```

Update `notifyIndexNow` signature to accept `previousServiceSlugs` parameter. Internally:
1. Compute diff
2. Build `child_entries` only from items where `shouldSubmit === true`
3. Pass `transition` as metadata to edge function for logging
4. If no children changed AND parent unchanged → return `'no_changes'` (new result type)

**File: `src/hooks/page/useCloudPageState.ts`**

Add `previousServiceSlugsRef = useRef<Record<...> | null>(null)` to track last-known service_slugs.

In the post-save IndexNow block (lines 157-178):
1. Fetch new `service_slugs` (already done)
2. Call `notifyIndexNow` with both `previousServiceSlugsRef.current` and new slugs
3. Update `previousServiceSlugsRef.current = newSlugs`

On initial load (when `userData` arrives), seed `previousServiceSlugsRef` by fetching current `service_slugs` once.

### Phase B — Edge function logging enrichment

**File: `supabase/functions/notify-indexnow/index.ts`**

Extend `ChildEntry` to include optional `transition` field:
```ts
interface ChildEntry {
  url: string;
  item_id: string;
  slug: string;
  transition?: string; // 'new_active' | 'restored' | 'thin_to_active' | 'slug_changed'
}
```

When logging to `indexing_submissions`, store `transition` in the `action_type` field (or a new dedicated field if schema allows). This way support sees WHY each child was submitted.

Also: log skip entries for children that were intentionally not submitted (e.g., `active_to_thin`, `active_to_removed`) with `submission_status: 'skipped_no_change'` or `'skipped_transition'`.

### Phase C — Add `IndexNowResult` type `'no_changes'`

When diff shows zero actionable transitions: don't invoke the edge function at all. Return `'no_changes'` from `notifyIndexNow`. This eliminates empty submissions entirely.

## 4. Files to Change

| File | Change |
|------|--------|
| `src/lib/seo/indexnow-client.ts` | Add `computeChildDiff()`, update `notifyIndexNow` to accept old/new slugs, add `'no_changes'` result |
| `src/hooks/page/useCloudPageState.ts` | Add `previousServiceSlugsRef`, seed on load, pass to `notifyIndexNow` |
| `supabase/functions/notify-indexnow/index.ts` | Accept `transition` in child entries, log it |

## 5. What NOT changes

- No new DB tables or columns
- No migration needed
- No changes to `save_page_blocks`
- No changes to resolver, SSR, or sitemap
- Diagnostics RPC unchanged (submission logs become more meaningful automatically)

## 6. Behavior examples

**User edits bio, 5 active services unchanged**:
- Diff: 5x `unchanged_active` → 0 child submissions
- Parent: already indexed, no structural change → skip parent too
- Result: `'no_changes'`, no edge function call

**User adds new pricing item (6th service)**:
- Diff: 5x `unchanged_active` + 1x `new_active`
- Submit: only the new child URL
- Parent: not resubmitted (no parent change)

**User deletes a service (removed)**:
- Diff: 1x `active_to_removed` + 4x `unchanged_active`  
- Submit: nothing (removed services don't get submitted)
- Log: skip entry for the removed child

**User restores thin service with description**:
- Diff: 1x `thin_to_active`
- Submit: that one child URL

## 7. Risks

- **First save after deploy**: `previousServiceSlugsRef` is null → treats all active children as `new_active` → submits all. This is correct behavior (same as current) and only happens once per session.
- **Race condition**: Two rapid saves could have stale `previousServiceSlugsRef`. Mitigated by existing debounce (1500ms) and save versioning.

## 8. Adjacent improvements

**P0 adjacent**: None — this change is self-contained.

**P1 adjacent**: The `indexing_submissions` table could benefit from a `transition_reason` column to store the diff reason separately from `action_type`. But storing it in existing fields works for now.

**P2 adjacent**: Creator-facing "2 services submitted, 3 unchanged" toast after publish. Pure UI, no backend.

## 9. Priority

Phase A is the entire deliverable. Phase B is a small enhancement to logging. Phase C is a one-line optimization. All can ship together.

**One-sentence architecture**: IndexNow fires only for child entities whose search state actually transitioned, determined by diffing the previous and current `service_slugs` snapshots client-side.

**Main bottleneck**: Every save re-submits all active children regardless of change.

**Most important refactor**: `computeChildDiff()` — the pure function that compares old vs new snapshots and returns only actionable transitions.

**First phase**: Phase A — diff engine + selective submission in the client.

