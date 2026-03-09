
I have investigated the errors from the console logs. Here is the comprehensive plan to fix all 5 issues systematically:

### 1. Fix Content Security Policy (CSP) Violation
**Issue:** `oauth.telegram.org` is blocked from framing due to the current CSP `frame-src` directive.
**Fix:** Update `index.html` (line 9) to include `https://oauth.telegram.org` in the `frame-src` list.
```html
frame-src 'self' blob: https://www.youtube.com https://mc.yandex.ru https://challenges.cloudflare.com https://oauth.telegram.org;
```

### 2. Fix Analytics 403 Forbidden Error
**Issue:** The `analytics` table has an RLS policy (`Anyone can insert analytics for published pages`) that rejects inserts if the page is not published. When you are previewing your page inside the dashboard editor, it attempts to track views/clicks and fails if the page isn't published.
**Fix:** Modify `src/hooks/analytics/useAnalyticsTracking.tsx` to automatically disable tracking if the user is inside the dashboard editor. This avoids polluting real analytics with editor previews and fixes the 403 error.
```typescript
const isEditor = typeof window !== 'undefined' && window.location.pathname.includes('/dashboard');
const trackingEnabled = enabled && !isEditor;
// Then use trackingEnabled instead of enabled for all tracking logic
```

### 3. Fix user_wallets 404 Not Found Error
**Issue:** The `user_wallets` table does not exist in the database, causing the `/rest/v1/user_wallets` query to fail.
**Fix:** Run a database migration to create the missing table and apply appropriate Row Level Security (RLS) policies.
```sql
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  balance numeric DEFAULT 0 NOT NULL,
  currency text DEFAULT 'KZT' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet" ON public.user_wallets 
FOR SELECT TO authenticated USING (auth.uid() = user_id);
```

### 4. Fix Google Calendar Sync 500 Internal Server Error
**Issue:** The `google-calendar-sync` edge function crashes and returns a 500 error, likely due to a missing payload property (`payload.redirect_url` undefined check throwing an uncaught exception) or `crypto.subtle` throwing an error on invalid keys.
**Fix:** Update `supabase/functions/google-calendar-sync/index.ts` to add robust error handling, better payload validation, and ensure that all errors return a graceful JSON response with CORS headers instead of crashing.

### 5. Fix Recharts BarChart Negative Dimension Error
**Issue:** `The width(-1) and height(-1) of chart should be greater than 0`. This happens because the `ResponsiveContainer` is placed inside a flex/grid container without an explicit minimum size, causing its dimensions to collapse to 0 during initial render.
**Fix:** In `src/components/zones/ZoneDashboard.tsx` and `src/components/zones/ZoneAnalyticsScreen.tsx`, wrap the `ResponsiveContainer` components in a `div` with a fixed minimum width and height to ensure Recharts always has valid dimensions to calculate from.
```tsx
<div style={{ width: '100%', minHeight: 220, minWidth: 0 }}>
  <ResponsiveContainer width="100%" height={220}>
     <BarChart ... />
  </ResponsiveContainer>
</div>
```
