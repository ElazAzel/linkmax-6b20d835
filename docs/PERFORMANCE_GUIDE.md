# Performance Optimization Guide

> **Objective:** Ensure lnkmx loads in <1.5s on mobile (3G) and achieves Core Web Vitals scores of 90+.

## 1. Frontend Optimization (Vite + React)

### 1.1 Code Splitting & Lazy Loading
Split heavy components to reduce the initial bundle size.

**Where to apply:**
- Block Editors (only load when editing a specific block)
- Admin Panel Routes
- Heavy libraries (e.g., `recharts`, `framer-motion` if used sparingly)

**Implementation:**
```tsx
import { lazy, Suspense } from 'react';

// Lazy load the heavy chart component
const AnalyticsChart = lazy(() => import('./AnalyticsChart'));

export function AnalyticsWidget() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100" />}>
      <AnalyticsChart />
    </Suspense>
  );
}
```

### 1.2 Image Optimization
Images are the largest content paint (LCP) blockers.

**Best Practices:**
- Use **WebP/AVIF** formats.
- Explicitly set `width` and `height` to prevent Layout Shifts (CLS).
- Lazy load images below the fold (`loading="lazy"`).
- Use a CDN (Supabase Storage handles this automatically, but ensure resizing parameters are used).

**Example (Supabase Image Resizing):**
```tsx
// Request a resized version from Supabase Storage
const imageUrl = `${supabaseUrl}/storage/v1/object/public/images/avatar.jpg?width=200&quality=80`;
```

### 1.3 React Rendering Performance
Prevent unnecessary re-renders in the drag-and-drop builder.

**Techniques:**
- **`memo`**: Wrap pure UI components (e.g., static Block previews).
- **`useCallback`**: Memoize handlers passed to list items.
- **Context Splitting**: Don't put everything in one `GlobalContext`. Split into `UserContext`, `ThemeContext`, `EditorContext`.

**Anti-Pattern to Avoid:**
```tsx
// BAD: Re-creates object every render, triggering useEffects
const config = { color: 'red' }; 
```

### 1.4 Font Optimization
- Self-host fonts (already in `public/fonts`) or use Google Fonts with `display=swap`.
- Preload critical fonts in `index.html`:
```html
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
```

---

## 2. Backend Performance (Supabase)

### 2.1 Database Indexing
Speed up common queries by indexing foreign keys and filter columns.

**Critical Indexes:**
```sql
-- Leads often filtered by page_id and status
CREATE INDEX idx_leads_page_status ON leads(page_id, status);

-- Blocks always queried by page_id
CREATE INDEX idx_blocks_page_position ON blocks(page_id, position);
```

### 2.2 RLS Performance
Row Level Security runs on *every* row. Keep policies simple.

**Optimization:**
- Avoid `join` logic in policies if possible.
- Use `auth.uid()` directly.
- **SECURITY DEFINER** functions can bypass complex RLS checks for specific, controlled operations (e.g., `increment_view_count`).

### 2.3 Realtime Subscriptions
Don't subscribe to `*` (all events). Subscribe only to necessary rows/columns.

```ts
// GOOD: Subscribe only to this page's blocks
const subscription = supabase
  .channel(`page-${pageId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'blocks', filter: `page_id=eq.${pageId}` }, callback)
  .subscribe();
```

---

## 3. Edge Functions

### 3.1 Cold Starts
Deno functions can take 1-2s to boot effectively.

**Mitigation:**
- Keep functions small (monolith functions start slower).
- **Warm-up Cron**: Use `pg_cron` to ping proper functions every 10-15 minutes (already implemented for critical paths).

### 3.2 Global Distribution
Enable "Smart Routing" in Supabase Dashboard to route requests to the nearest edge node.

---

## 4. Monitoring (Core Web Vitals)

Use the built-in `onCLS`, `onFCP`, `onLCP` handlers from `web-vitals` library to log metrics to Supabase Analytics.

```ts
import { onLCP, onFID, onCLS } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to backend
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
```
