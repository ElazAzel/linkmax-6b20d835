# Analytics Audit — 2026-04-19

## Scope
- Block-level analytics on public pages (views/clicks/CTR).
- User dashboard analytics aggregation (`usePageAnalytics`).
- Related tracking plumbing (internal events + pixel bridge helpers).

## Findings

### 1) Block impressions were tracked only for experiment blocks (critical)
- In `BlockRenderer`, block view events were sent only when `block.experimentId` existed.
- Result: for regular pages without A/B experiments, block views were almost always `0`, and CTR was broken/biased.

### 2) Click attribution could map to wrong block (high)
- `trackBlockClick` had fallback lookup by `content->>type`.
- If a page had multiple blocks of the same type (e.g. several `link` blocks), clicks could be attributed to a random/first matched block for DB click counters.

### 3) Dashboard block aggregation used `blockType` as fallback key (high)
- In `usePageAnalytics`, click mapping fallback chain included `blockType`.
- This could merge unrelated click events into a non-block key and distort top blocks / CTR.

### 4) Marketing click event helper received wrong parameter semantics (medium)
- `trackClickLink` expects `(blockTitle, url?)`.
- Hook passed `(blockTitle, blockType)`, causing incorrect `link_url` payload values in external pixel events.

## Fixes implemented

1. Track block impressions for all `trackable` blocks on public pages (not only experiment blocks).
2. Restrict click→block DB lookup to stable `content->>id` match only.
3. Remove `blockType` fallback from dashboard click attribution.
4. Correct `trackClickLink` call to avoid sending block type as URL.

## Expected impact
- Block analytics (views, CTR, top blocks) should start filling for all users/pages.
- Less click misattribution when multiple same-type blocks exist.
- Cleaner external marketing click payloads.

## Remaining risks / recommendations
- Some legacy events may still have sparse metadata; historic charts can remain partially noisy.
- Consider backfill/migration logic for old analytics rows if historical accuracy is required.
- Add integration tests for:
  - block view creation for non-experiment blocks,
  - click attribution with multiple same-type blocks,
  - `usePageAnalytics` top-block ranking correctness.
