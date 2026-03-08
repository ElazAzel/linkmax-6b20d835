

# Retention Layer — Gap Fill & Hardening

## What's Already Done
OperatorSummaryWidget, IncomingWidget, useLeadAging, useRepeatCustomers, retention events, weekly digest with CRM data — all implemented. The core retention UI and hooks exist.

## What's Missing (This Iteration)

### Task 1: Pass `pageUpdatedAt` to OperatorSummaryWidget
Currently hardcoded as `null` in HomeScreen.tsx line 168. Need to pass `pageData.updatedAt` (or equivalent) so stale page detection actually works.

**Files:** `HomeScreen.tsx` — fix prop, ensure `PageData` type has `updatedAt`.

### Task 2: Repeat Customer Badge in ActivityScreen
The `useRepeatCustomers` hook exists but ActivityScreen doesn't use it. Add a "Повторный" badge on LeadCard when `isRepeatCustomer(lead.phone, lead.email)` returns true.

**Files:** `ActivityScreen.tsx` — import useRepeatCustomers, pass to LeadCard, render badge.

### Task 3: Creator Return-After-Gap Detection
The event type `creator_returned_after_gap` exists in activation-events.ts but nothing fires it. Add detection logic: on HomeScreen mount, compare `user_profiles.last_active_date` with current date. If gap ≥ 3 days, fire the event once per session.

**Files:** `HomeScreen.tsx` — add useEffect for gap detection using user profile data.

### Task 4: Lifecycle Segment Nudges on HomeScreen
Add a small `LifecycleNudge` component that shows contextual one-liner based on state:
- Published + views > 0 + leads = 0 → "Есть трафик, но нет заявок — добавьте форму"
- Leads > 0 + all status=new → "У вас есть необработанные заявки — ответьте первым!"
- Has completed bookings + repeatCount = 0 → "Напишите клиентам после визита — это повышает возврат"
- repeatCount > 0 → "У вас {{count}} постоянных клиентов 🎉"

This replaces the static "Совет" card at the bottom of HomeScreen with a data-driven one.

**Files:** `HomeScreen.tsx` — replace static tip with lifecycle-aware logic.

### Task 5: i18n Keys for en.json and kk.json
The `operator.*` keys were added to ru.json but en.json and kk.json are missing them. Add English and Kazakh translations for all operator/retention keys.

**Files:** `en.json`, `kk.json`

### Task 6: Repeat Customer Badge on BookingCard in BookingsPanel
Show "Повторный" badge on booking cards when the client is a repeat customer.

**Files:** `BookingsPanel.tsx` (or wherever booking cards render) — integrate useRepeatCustomers.

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/dashboard-v2/screens/HomeScreen.tsx` | Fix pageUpdatedAt prop, add gap detection, replace static tip with lifecycle nudge |
| `src/components/dashboard-v2/screens/ActivityScreen.tsx` | Add repeat customer badge to LeadCard |
| `src/components/crm/BookingsPanel.tsx` | Add repeat customer badge to booking cards |
| `src/i18n/locales/en.json` | Add operator/retention keys |
| `src/i18n/locales/kk.json` | Add operator/retention keys |

## What We Do NOT Build
- Automated follow-up sequences
- Push/Telegram reactivation messages
- Loyalty points or packages
- Customer-facing "book again" reminders
- Kanban/pipeline views

