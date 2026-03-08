

# Retention Hardening: Consistency & Outcome Fixes

## Problems Identified

1. **`first-conversion` milestone is too soft**: `leadsCount >= 1 || totalClicks >= 1` — a click is not a conversion. Should require form submission, booking, or event registration.

2. **`first-booking` milestone gets no data**: HomeScreen calls `useActivationChecklist` without passing `bookingsCount` — so the 5th step never completes.

3. **`first-conversion` and `first-booking` semantics overlap**: Need clear separation — "first response received" vs "first booking received."

4. **50-lead limit is client-side only**: `submit-lead` edge function has zero limit enforcement. Free users can receive unlimited leads server-side.

5. **Domain entity `FREE_TIER_LIMITS` is stale**: `src/domain/entities/User.ts` still has `canUseCRM: false` and `maxLeadsPerMonth: 0` — contradicts the hook.

6. **No upgrade nudge when approaching lead limit**: No UI tells free users "42/50 leads used."

## Plan

### Task 1: Fix first-conversion to use real outcomes
In `useActivationChecklist.ts`, change `hasFirstConversion` from:
```
leadsCount >= 1 || totalClicks >= 1
```
to:
```
leadsCount >= 1 || bookingsCount >= 1
```
Remove `totalClicks` from the options interface entirely (unused elsewhere). This makes "first response" = a real form submission or booking, not a click.

### Task 2: Pass bookingsCount to activation checklist
In `HomeScreen.tsx`, fetch bookings count for the current page (query `bookings` table count where `page_id = pageData.id`) and pass it to `useActivationChecklist({ ..., bookingsCount })`.

### Task 3: Server-side lead limit enforcement
In `supabase/functions/submit-lead/index.ts`, before inserting:
- Look up page owner's `user_id` from `pages`
- Check owner's `premium_tier` from `user_profiles`
- If free tier: count leads this month for that `user_id` — if ≥ 50, return 429 with `{ error: 'lead_limit_reached' }` message
- Pro/Business: no limit

### Task 4: Sync domain entity limits
In `src/domain/entities/User.ts`, update `FREE_TIER_LIMITS`:
- `canUseCRM: true`
- `maxLeadsPerMonth: 50`

### Task 5: Lead limit progress banner on ActivityScreen
Add a small banner at the top of the leads tab in `ActivityScreen.tsx` for free users:
- Show "Использовано X из 50 заявок в этом месяце"
- When X ≥ 40: amber warning color
- When X = 50: red + "Лимит достигнут — перейдите на PRO"
- Query: count leads where `user_id = auth.uid()` and `created_at >= start of month`

### Task 6: i18n keys for limits and milestone fixes
Add to ru/en/kk:
- `activation.steps.firstResponse` (replaces firstConversion label — "Получите первый отклик")
- `crm.leadLimit.used` — "{{used}} из {{max}} заявок"
- `crm.leadLimit.warning` — "Осталось {{remaining}} заявок до лимита"
- `crm.leadLimit.reached` — "Лимит заявок достигнут"
- `crm.leadLimit.upgrade` — "Снять лимит →"

## Files

| File | Action |
|------|--------|
| `src/hooks/onboarding/useActivationChecklist.ts` | Fix first-conversion logic, remove totalClicks |
| `src/components/dashboard-v2/screens/HomeScreen.tsx` | Fetch & pass bookingsCount |
| `supabase/functions/submit-lead/index.ts` | Add 50-lead/month enforcement for free tier |
| `src/domain/entities/User.ts` | Sync FREE_TIER_LIMITS |
| `src/components/dashboard-v2/screens/ActivityScreen.tsx` | Lead limit banner |
| `src/i18n/locales/ru.json`, `en.json`, `kk.json` | New keys |

