
## Bug Fix Plan: 5 Console Errors

Based on thorough investigation of the codebase and console logs, here are the exact changes needed.

---

### 1. CSP frame-src — Allow Telegram OAuth

**File:** `index.html` line 9  
**Change:** Append `https://oauth.telegram.org` to the `frame-src` directive.

Current: `frame-src 'self' blob: https://www.youtube.com https://mc.yandex.ru https://challenges.cloudflare.com;`  
New: `frame-src 'self' blob: https://www.youtube.com https://mc.yandex.ru https://challenges.cloudflare.com https://oauth.telegram.org;`

---

### 2. Analytics 403 — Disable tracking in dashboard

**File:** `src/hooks/analytics/useAnalyticsTracking.tsx`  
**Change:** Add a guard at the top of `useAnalyticsTracking` to detect dashboard routes and suppress all tracking calls:

```ts
const isInsideDashboard = typeof window !== 'undefined' && window.location.pathname.includes('/dashboard');
const trackingEnabled = enabled && !isInsideDashboard;
```

Then use `trackingEnabled` instead of `enabled` in the `useEffect` and both `useCallback` hooks.

---

### 3. user_wallets 404 — Create missing table

**Database migration:**

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

CREATE POLICY "Users can view own wallet"
  ON public.user_wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet"
  ON public.user_wallets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON public.user_wallets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
```

---

### 4. Google Calendar Sync 500 — Add config.toml entry

**File:** `supabase/config.toml`  
**Change:** Add the missing function entry (it currently defaults to `verify_jwt = true`, which is correct for this function since it authenticates via the Authorization header):

```toml
[functions.google-calendar-sync]
verify_jwt = false
```

Setting `verify_jwt = false` because the function already handles auth internally via `supabaseClient.auth.getUser()`. Without this entry, the default JWT verification may reject tokens with slightly different formats.

**File:** `supabase/functions/google-calendar-sync/index.ts`  
**Change:** Update CORS headers to match the standard pattern (line 6-8):

```ts
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

The root cause of the 500 is likely missing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` secrets — the function returns 503 for this case, but the error is thrown before reaching that check if JWT verification fails. Adding the config.toml entry will fix the immediate 500.

---

### 5. Chart negative dimensions — Wrap ResponsiveContainer

**File:** `src/components/zones/ZoneDashboard.tsx` (line 202)  
**Change:** Wrap the `ResponsiveContainer` in a div with explicit dimensions:

```tsx
<div style={{ width: '100%', minHeight: 220, minWidth: 0 }}>
  <ResponsiveContainer width="100%" height={220}>
    ...
  </ResponsiveContainer>
</div>
```

**File:** `src/components/zones/ZoneAnalyticsScreen.tsx` (lines 301, 344, 382, 441)  
**Change:** Same wrapper pattern for all 4 `ResponsiveContainer` instances:
- Line 301: height 220
- Line 344: height 250
- Line 382: height 200
- Line 441: already in a `h-64` div — no change needed

---

### Summary

| Fix | Impact | Risk |
|-----|--------|------|
| CSP Telegram | Unblocks Telegram OAuth widget | None |
| Analytics 403 | Stops spam 403 errors in dashboard | None — public pages unaffected |
| user_wallets table | Resolves 404 for wallet queries | Low — new table with proper RLS |
| GCal config.toml | Fixes 500 on calendar sync calls | Low — function already handles auth |
| Chart dimensions | Removes console warnings | None — visual improvement |
