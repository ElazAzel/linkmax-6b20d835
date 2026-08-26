---
name: calendar
description: Appointment bookings, slot calculations, calendar feeds, and Google Calendar two-way sync.
---

# Calendar & Bookings

Use for booking blocks, service appointment scheduling, calendar feeds (iCal), and Google Calendar integration in LinkMAX.

## When to Use
- Booking block configuration and public booking flow (`BookingBlock`, `BookingBlockEditor`).
- Setting master/business working hours, buffer times, and available time slots.
- Synchronizing appointments with Google Calendar (`gcal-callback`, `google-calendar-sync`).
- Exporting and subscribing to iCal calendar feeds (`calendar-feed`).

## Core Workflows

### 1. Booking Block Setup
1. Define service list, duration (e.g. 30m, 60m), price, and payment requirement.
2. Configure weekly availability schedule and break intervals in `src/components/block-editors/BookingBlockEditor.tsx`.
3. Save block config to `useEditorStore`.

### 2. Client Slot Selection & Booking Submission
1. Public page visitor selects service, date, and available slot.
2. Slots are calculated dynamically considering existing confirmed bookings and Google Calendar busy times.
3. Submit booking via `src/services/google-calendar-integration.ts` or Edge Function `submit-booking`.
4. Trigger notification to master and client confirmation email.

### 3. Google Calendar Two-Way Sync
1. User connects Google Account via OAuth (`src/services/account-connections.ts`).
2. Edge Function `google-calendar-sync` pushes new LinkMAX bookings to Google Calendar and reads busy intervals to prevent double-booking.

## Key Files & Services
- **Components**: `src/components/blocks/BookingBlock.tsx`, `src/components/block-editors/BookingBlockEditor.tsx`, `src/components/zones/ZoneCalendarScreen.tsx`
- **Services**: `src/services/google-calendar-integration.ts`, `src/services/events.ts`
- **Edge Functions**: `supabase/functions/submit-booking`, `supabase/functions/google-calendar-sync`, `supabase/functions/calendar-feed`, `supabase/functions/gcal-callback`

## Commands & Verification
```bash
npm run test -- src/services/__tests__/google-calendar-integration.test.ts
```

## Best Practices & Guardrails
- **Timezones**: Always store timestamps in UTC and convert to the user's local timezone in the UI (`src/hooks/useTimezone.ts`).
- **Concurrency**: Lock or defensively check slot availability before confirming to prevent simultaneous double-booking.
- **Graceful Offline**: Allow appointment management even during temporary Google Calendar sync delays.
