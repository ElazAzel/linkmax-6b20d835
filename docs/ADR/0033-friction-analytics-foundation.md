# ADR 0033: Privacy-Safe Friction Analytics Foundation

## Status

Accepted - Phase 49, July 5, 2026

## Context

The Phase 25 roadmap asks LinkMAX to move from counting page activity to diagnosing where visitors get stuck. The repository already has a native website analytics path:

- public pages call `useHeatmapTracking`
- events are stored in the existing `analytics` table
- owners inspect aggregated heatmap data in `HeatmapVisualization`
- public ingestion is guarded by `is_allowed_analytics_event_type`

Creating a second session replay service would duplicate this path, increase privacy risk, and add operational weight. The first production step should extend the current heatmap stream with a compact friction signal.

## Gap Analysis

| Area | Status |
| --- | --- |
| Already implemented | Page views, clicks, shares, scroll-depth heatmap, click-zone heatmap, owner CRM heatmap UI |
| Partially implemented | Phase 25 qualitative analytics through aggregated heatmap visualization |
| Missing | A durable signal for repeated clicks in the same page area, which is the highest-value lightweight proxy for user frustration |
| Can extend | `analytics`, `useHeatmapTracking`, `useHeatmapData`, `HeatmapVisualization`, analytics event allowlist |
| Must not change | Existing Pixel Proxy, Product Analytics `product_events`, and block-level analytics semantics |

## Decision

Add `heatmap_rage_clicks` as a privacy-safe event type in the existing `analytics` table. The client detects three or more nearby clicks inside a short time window and stores only:

- normalized coordinates
- click count
- detection window in milliseconds
- viewport/page dimensions
- timestamp

No DOM text, element selectors, form values, screenshots, recordings, or visitor contact fields are stored.

## Product Design

Owners need an answer to: "Where are visitors trying to click but not progressing?"

The CRM heatmap screen now keeps the existing click and scroll visual language while adding friction zones as a small diagnostic card and ranked list. This avoids another dashboard and gives the owner a direct page-improvement hint.

## Backend And Database

- No new table.
- No new API.
- Migration `20260705090000_friction_analytics_signals.sql` extends `is_allowed_analytics_event_type` with `heatmap_rage_clicks`.
- RLS remains unchanged because the existing public insert policy delegates event validation to the same allowlist function.

## Frontend

- `src/hooks/analytics/heatmap-model.ts` owns pure detection and aggregation logic.
- `useHeatmapTracking` appends `heatmap_rage_clicks` batches through the existing Supabase insert path.
- `useHeatmapData` reads and aggregates clusters into owner-facing friction zones.
- `HeatmapVisualization` displays the friction count and top zones alongside existing click/scroll metrics.

## Security And Privacy

- The signal is aggregated and coordinate-only.
- The event is allowed only through the existing analytics event allowlist.
- Existing page publication checks still control public inserts.
- Owner visibility remains controlled by existing analytics policies.

## Performance

- Detection runs in memory over a small recent-click window.
- Writes are batched with existing heatmap events.
- Reads are bounded to the selected analytics date range and aggregated client-side, matching current heatmap behavior.

## Scalability

At 100 to 10,000 users, the event volume stays proportional to frustration bursts, not every click. At 100,000+ users, the next scaling step is a server-side rollup over `analytics` rather than a new tracking product.

## Backward Compatibility

Existing heatmap events keep their shape. Owners with no friction signals see the existing heatmap without the friction list.
