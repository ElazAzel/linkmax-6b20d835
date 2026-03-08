

# Unified CRM Limit Model — Implementation Plan

## 1. Current State & Core Problems

**Three critical inconsistencies found:**

1. **Backend counts per `page_id`, UI counts per `user_id`**: `submit-lead/index.ts` line 125 filters `.eq('page_id', pageId)` — meaning a multi-page user gets 50 leads PER PAGE. `ActivityScreen.tsx` line 117 counts `.eq('user_id', user.id)` — showing aggregate. The owner sees "42/50" but actually has capacity for 50 × N pages.

2. **Bookings have ZERO limit enforcement**: `BookingBlock.tsx` line 216 inserts directly into `bookings` via client-side Supabase with no limit check. A free user can receive unlimited bookings. This makes the "50 inbound/month" limit meaningless — the customer just books instead of filling a form.

3. **Domain entity, frontend hook, and edge function all define "50" independently**: `User.ts` line 148, `useFreemiumLimits.ts` line 54, `submit-lead/index.ts` line 128 — three hardcoded `50`s with no shared source of truth.

## 2. Recommended CRM Usage Unit

**Decision: Count leads + bookings + event registrations as one unified "inbound" count, per user_id, per calendar month.**

Why:
- All three are inbound commercial actions from the same funnel
- If only leads count, users bypass limits by using booking blocks
- Simple for the user: "50 заявок в месяц" = 50 times someone reached out
- Simple to implement: one query across 3 tables

What does NOT count:
- Manual leads added by owner (via AddLeadDialog)
- Status changes, notes, replies
- Page views, clicks

## 3. Scope: Per User, Not Per Page

The limit must be **per `user_id`** (page owner), not per `page_id`. Reasons:
- Multi-page users shouldn't get N × 50 for free
- Fair: one account = one quota
- Matches how ActivityScreen already displays it
- Matches billing (subscription is per user, not per page)

## 4. Final Model

```text
┌─────────────────────────────────────────────┐
│  FREE TIER CRM LIMIT                        │
│                                             │
│  Unit: "inbound" = lead + booking + event   │
│         registration created by end-customer│
│  Scope: per owner user_id                   │
│  Limit: 50 / calendar month (UTC)           │
│  Reset: 1st of each month, 00:00 UTC        │
│                                             │
│  On limit reached:                          │
│  - New form submissions: blocked server-side│
│  - New bookings: blocked server-side        │
│  - New event regs: blocked server-side      │
│  - Existing data: fully accessible          │
│  - CRM features: fully accessible           │
│  - Reply/status/export: unaffected          │
│                                             │
│  PRO: unlimited inbound, no cap             │
└─────────────────────────────────────────────┘
```

## 5. Source of Truth Architecture

```text
Single constant: CRM_INBOUND_LIMIT = 50

Lives in: src/domain/entities/User.ts (exported)
Consumed by:
  - useFreemiumLimits.ts (imports from User.ts)
  - submit-lead edge function (hardcoded — unavoidable for edge fn, but matches)
  - booking RLS/edge function (same)

Usage count: computed at runtime via DB query
  - Backend: COUNT(*) across leads + bookings + event_registrations 
    WHERE owner's user_id, created_at >= month start
  - Frontend: same query for display

NOT duplicated in: billing copy, pricing page, banner text
  → All UI reads from useFreemiumLimits().limits.maxLeadsPerMonth
```

## 6. Implementation Plan

### P0 — Fix the three critical inconsistencies

**Task 1: Create `check-inbound-limit` shared helper for edge functions**

Create `supabase/functions/_shared/check-inbound-limit.ts` with a reusable function:
- Input: `supabaseClient`, `userId: string`
- Logic: Count leads + bookings + event_registrations for this user_id this month
- Output: `{ used: number, limit: number, allowed: boolean }`
- Hardcode limit = 50, check premium_tier to skip for paid users

**Task 2: Fix `submit-lead` to count per `user_id` across all inbound types**

Update `supabase/functions/submit-lead/index.ts`:
- Replace the current `page_id`-scoped leads-only count (lines 118-133)
- Use the shared helper to count all inbound objects for `pageData.user_id`
- Return same `429 lead_limit_reached` error

**Task 3: Create `submit-booking` edge function with limit enforcement**

Currently bookings insert directly from client (`BookingBlock.tsx` line 216). This is the biggest hole.

Create `supabase/functions/submit-booking/index.ts`:
- Accept: `pageId, blockId, slotDate, slotTime, slotEndTime, clientName, clientPhone, clientEmail, clientNotes, paymentStatus, paymentAmount, paymentMethod`
- Look up page owner → check inbound limit using shared helper
- If over limit → return `429 { error: 'inbound_limit_reached' }`
- If allowed → insert into `bookings` table (same fields as current client insert)
- Call `send-booking-notification` logic or invoke it
- Return booking data

Update `BookingBlock.tsx`:
- Replace direct `supabase.from('bookings').insert(...)` with `supabase.functions.invoke('submit-booking', { body: ... })`
- Handle `429` response: show graceful "owner's form is temporarily unavailable" message to end-customer

**Task 4: Fix ActivityScreen count to match unified model**

Update `ActivityScreen.tsx` lines 108-121:
- Count leads + bookings + event_registrations for `user_id` this month (not just leads)
- This makes the banner accurate

**Task 5: Sync domain constants**

In `src/domain/entities/User.ts`, rename `maxLeadsPerMonth` → keep name but update comment to clarify it means "all inbound objects". Export the constant `CRM_FREE_INBOUND_LIMIT = 50` for reuse.

### P1 — UX improvements

**Task 6: End-customer graceful error state**

In `BookingBlock.tsx`, when `submit-booking` returns 429:
- Show: "К сожалению, запись временно недоступна. Свяжитесь с мастером напрямую." 
- Do NOT mention limits, tiers, or pricing to the end-customer

In form submission handler (wherever submit-lead 429 is handled):
- Same pattern: graceful message, no platform internals exposed

**Task 7: Upgrade nudges**

Update HomeScreen lifecycle nudge to include limit proximity:
- At 40/50: amber nudge "У вас осталось {{remaining}} заявок в этом месяце"
- At 50/50: red nudge with upgrade CTA

**Task 8: i18n keys**

Add to ru/en/kk:
- `crm.inboundLimit.used`: "{{used}} из {{max}} обращений"
- `crm.inboundLimit.warning`: "Осталось {{remaining}} обращений до лимита"  
- `crm.inboundLimit.reached`: "Лимит обращений достигнут"
- `crm.inboundLimit.upgrade`: "Снять лимит →"
- `booking.limitReached.customer`: "Запись временно недоступна. Свяжитесь напрямую."
- `form.limitReached.customer`: "Форма временно недоступна."

### P2 — Analytics

**Task 9: Instrumentation events**

Add events to `activation-events.ts`:
- `inbound_limit_warning` (fired at 40/50)
- `inbound_limit_reached` (fired at 50/50)
- `inbound_blocked_submission` (fired when 429 returned)
- `upgrade_from_limit` (fired when user clicks upgrade from limit banner)

## Files Summary

| File | Action |
|------|--------|
| `supabase/functions/_shared/check-inbound-limit.ts` | NEW — shared limit checker |
| `supabase/functions/submit-lead/index.ts` | Fix: count per user_id, all inbound types |
| `supabase/functions/submit-booking/index.ts` | NEW — server-side booking with limit |
| `src/components/blocks/BookingBlock.tsx` | Replace direct insert with edge function call |
| `src/components/dashboard-v2/screens/ActivityScreen.tsx` | Fix count to include bookings+registrations |
| `src/domain/entities/User.ts` | Export CRM_FREE_INBOUND_LIMIT constant |
| `src/i18n/locales/ru.json`, `en.json`, `kk.json` | New inbound limit keys |
| `src/lib/activation-events.ts` | New limit events |

## What NOT to Do

- Do NOT create a separate `inbound_usage` tracking table — query at runtime
- Do NOT add per-page quotas — user-level only
- Do NOT gate existing CRM data access on limit — only new submissions
- Do NOT show platform billing language to end-customers
- Do NOT add granular per-type limits (X leads + Y bookings) — one number
- Do NOT build a billing/entitlement microservice — constants + DB query is enough

