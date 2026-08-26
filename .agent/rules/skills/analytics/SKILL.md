---
name: analytics
description: PostHog event tracking, bio-page telemetry, heatmaps, conversion funnels, and feature flags.
---

# Analytics & Telemetry

Use for event tracking, page views, click telemetry, heatmaps, conversion funnels, A/B experiments, and feature flags in LinkMAX.

## When to Use
- Adding telemetry events for new user actions or blocks.
- Building or modifying analytics dashboards in `/dashboard/insights` or `/dashboard/zone-analytics`.
- Creating A/B experiments and feature flag rollouts.
- Visualizing heatmaps and scroll depth.

## Core Workflows

### 1. Tracking Page & Block Telemetry
1. Track public page view using `src/services/analytics.ts` (`trackPageView`).
2. Track block clicks / interactions with `trackBlockClick(blockId, blockType, pageId)`.
3. Dispatch batched events to `supabase/functions/track-analytics-event` or PostHog (`src/lib/posthog.ts`).

### 2. Aggregating Metrics
1. Compute period aggregates (today, 7d, 30d, 90d) efficiently without client freezes.
2. Use single-pass bucketing or server-side grouping to prevent O(N * D) browser CPU spikes.
3. Cache query results via TanStack Query with appropriate `staleTime`.

### 3. Feature Flags & Experiments
1. Define feature flags in `src/services/feature-flags.ts`.
2. Check flag state in components with `useFeatureFlag('flag_name')`.
3. Record variant impressions and conversion events for statistical evaluation.

## Key Files & Services
- **Services**: `src/services/analytics.ts`, `src/services/product-analytics.ts`, `src/services/feature-flags.ts`, `src/services/experiments.ts`
- **Hooks**: `src/hooks/analytics/useInsights.ts`, `src/hooks/analytics/usePageAnalytics.ts`, `src/hooks/analytics/useHeatmap.ts`
- **Components**: `src/components/analytics/`, `src/components/dashboard-v2/screens/InsightsScreen.tsx`

## Commands & Verification
```bash
npm run test -- src/services/__tests__/analytics.test.ts src/services/__tests__/product-analytics.test.ts
```

## Best Practices & Guardrails
- **GDPR & Privacy**: Never capture passwords, card details, or unmasked PII in analytics payloads.
- **Client Performance**: Debounce scroll and mouse telemetry; avoid blocking rendering threads.
- **Resilient Fallbacks**: Telemetry failures must never disrupt user experience.
