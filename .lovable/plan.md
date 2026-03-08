

# Retention & Repeat Revenue Layer — Implementation Plan

## Verdict

Activation and booking/payment are solid. The product now risks being **single-use**: creator publishes, gets a few bookings, and has no reason to return. End-customers book once and disappear. There is no post-service loop, no repeat booking nudge, no stale creator reactivation, and no operator summary that creates a daily habit.

## What We Build (P0 — This Iteration)

### Task 1: Daily Operator Summary Widget on HomeScreen

**Problem:** After IncomingWidget shows 0 new items, HomeScreen becomes static. No reason to check daily.

**Solution:** New `OperatorSummaryWidget` below IncomingWidget showing:
- Today's upcoming bookings (count + next one)
- Unanswered leads count with aging alert
- This week's stats vs last week (views, leads, bookings delta)
- "Stale page" alert if no edits in 14+ days

**Files:**
- `src/components/dashboard-v2/widgets/OperatorSummaryWidget.tsx` — **create**
- `src/components/dashboard-v2/screens/HomeScreen.tsx` — add widget after IncomingWidget

### Task 2: Post-Service Follow-Up Prompt

**Problem:** After a booking is completed (date passed), nothing happens. No prompt to follow up, no repeat booking nudge.

**Solution:** In `IncomingWidget` and `ActivityScreen`, show "completed yesterday" bookings with:
- One-tap "Send follow-up" (WhatsApp pre-filled: "Спасибо за визит! Как вам? Запишетесь снова?")
- Badge "Follow-up" on completed bookings without interaction
- Track `post_service_followup_sent` event

**Files:**
- `src/components/dashboard-v2/widgets/IncomingWidget.tsx` — add completed bookings section
- `src/components/dashboard-v2/screens/ActivityScreen.tsx` — follow-up CTA on completed bookings
- `src/lib/activation-events.ts` — add retention events

### Task 3: Repeat Booking Detection & Nudge

**Problem:** No way to identify returning customers or prompt repeat bookings.

**Solution:** 
- In `BookingBlock.tsx` confirmation screen, detect if `client_phone` has previous bookings (query bookings table)
- If returning customer: show "Добро пожаловать снова!" badge
- For owner: in ActivityScreen, tag leads/bookings from repeat customers with a "Повторный" badge
- New hook `useRepeatCustomers` that identifies phones/emails with 2+ bookings

**Files:**
- `src/hooks/crm/useRepeatCustomers.ts` — **create**
- `src/components/dashboard-v2/screens/ActivityScreen.tsx` — repeat customer badge
- `src/components/blocks/BookingBlock.tsx` — returning customer detection in confirmation

### Task 4: Stale Creator Reactivation Alerts

**Problem:** Creator stops logging in. No in-product mechanism to surface this.

**Solution:**
- On HomeScreen, if `last_active_date` is 7+ days ago AND there are unprocessed leads/bookings, show alert card: "У вас X необработанных заявок за последнюю неделю"
- Extend `send-weekly-digest` edge function to include: unprocessed leads count, upcoming bookings, repeat customer count
- Add `creator_reactivated` event when returning after 7+ day gap

**Files:**
- `src/components/dashboard-v2/widgets/OperatorSummaryWidget.tsx` — stale alert section
- `supabase/functions/send-weekly-digest/index.ts` — enhance with CRM data
- `src/lib/activation-events.ts` — retention events

### Task 5: Retention Event Tracking

**Problem:** No instrumentation for post-first-booking lifecycle.

**Solution:** Expand `activation-events.ts` with:
- `post_service_followup_sent` — owner sent follow-up after service
- `repeat_booking_detected` — same phone/email booked again
- `creator_returned_after_gap` — returned after 3+ days
- `stale_leads_alert_shown` — stale alert displayed
- `weekly_digest_sent` — digest delivered
- `booking_completed` — service date passed (already in type but not tracked)

**Files:**
- `src/lib/activation-events.ts` — add types + helpers

### Task 6: i18n Keys for Retention Layer

**Files:**
- `src/i18n/locales/ru.json` — operator summary, follow-up, repeat customer, stale alerts
- `src/i18n/locales/en.json` — same
- `src/i18n/locales/kk.json` — same

---

## What We Do NOT Build Now

- Automated email/Telegram follow-up sequences (P1)
- Loyalty points / packages / bundles (P2)
- AI-suggested follow-up messages (P2)
- Customer-facing "book again" reminders via SMS/WhatsApp (P1 — requires explicit consent flow)
- Kanban/pipeline for repeat customers (Zone CRM scope)
- Churn prediction / ML scoring (P2)

## Expected Outcome

- Creator sees daily operator summary → habit loop
- Completed bookings trigger follow-up prompt → post-service engagement
- Repeat customers are identified and tagged → revenue signal
- Stale creators get contextual alerts → reactivation
- All retention events tracked → measurable

