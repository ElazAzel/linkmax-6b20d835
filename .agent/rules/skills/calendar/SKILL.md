---
name: calendar
description: Booking, availability, time zones, calendar integrations, and scheduling workflows.
---

# Calendar

Use for booking slots, availability, or external calendar synchronization.

1. Specify time zone, slot duration, cancellation, conflict, and idempotency rules.
2. Enforce booking availability in the database or trusted backend, not only in the UI.
3. Test concurrent booking attempts and daylight-saving/time-zone boundaries where applicable.
4. Store OAuth tokens and provider secrets server-side; redact them from errors.
5. Document any changed booking state transition or external sync contract.
