# Admin Platform Audit — 2026-04-19

## Scope
- `/admin` shell page and tabs orchestration
- Analytics tab data pipeline and rendering performance
- Fintech and broadcast tabs for correctness/security

## Key findings

### 1) Analytics tab was doing heavy client-side processing (high impact)
**Symptoms**: long UI freezes while switching to analytics or changing period.

**Root causes (before fix):**
- broad `select('*')` from `analytics` for current and previous periods
- repeated `events.filter(...)` inside daily/hourly loops, creating O(N * D) complexity
- unnecessary extra query to `blocks` that was not used

**Fix implemented in this patch:**
- narrowed analytics payload to required fields only
- replaced repeated filtering with one-pass bucket aggregation for day/hour and dimensions
- removed unused `blocks` query from initial load

### 2) “All time” period is potentially unsafe at scale (high risk)
Current `'all'` means `3650` days and still performs a large raw fetch. This is better after optimization, but can still become expensive on very large datasets.

**Recommendation**:
- move aggregation to SQL/RPC (materialized daily/hourly tables or server-side grouped queries)
- cap “all time” in UI or use paginated + cached backend aggregates

### 3) Broadcast token storage approach needs hardening (security)
`TELEGRAM_BOT_TOKEN` is loaded/saved from `app_settings` directly from the admin UI flow.

**Recommendation**:
- move bot token to Supabase secrets / edge function env vars
- only expose masked token state in admin panel
- add explicit audit logging for token updates

### 4) Fintech tab loads full withdrawal dataset each refresh (medium)
Current requests list pulls full table and enriches profiles client-side.

**Recommendation**:
- add server-side pagination and status/date filters
- fetch only visible page
- optionally use PostgREST embedded relation to avoid second query

## Expected outcome from implemented fix
- reduced network payload for analytics tab
- significantly lower CPU usage in browser on period changes
- faster initial render for “Detailed analytics” tab under medium/high event volume

## Verification checklist
- Open `/admin` → `Detailed` tab
- switch periods (`7d`, `30d`, `90d`, `all`) and ensure UI remains responsive
- check charts still display daily/hourly series and top lists correctly
