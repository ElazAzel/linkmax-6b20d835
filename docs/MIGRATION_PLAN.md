# Migration Plan

| Module | Exists | Works | Change needed |
|---|---|---|---|
| Pages | yes (60) | yes | — |
| Blocks | yes (517) | yes | — |
| CRM (leads) | yes (554) | yes | link to contacts, simple stages |
| Booking | yes (3) | yes, low usage | contact link, service entity later |
| Events | yes (1) | yes, staff check-in link | contact link |
| Commerce | yes (0 sales) | untested with real payments | unified checkout later |
| Analytics | yes (24k) | yes | funnel + source revenue later |
| Business Zones | yes (1 contact) | yes | none |

## Order
1. Audit docs (done).
2. `contacts` table + `upsert_contact` + backfill from leads + triggers with UTM on leads, bookings, event_registrations, digital_purchases (done).
3. Contact timeline RPC + UI in Inbox card (`LeadDetails` + `ContactTimeline` wired in `LeadsScreen` and `ActivityScreen`) (done).
4. CRM Lite stages (Новые → Связались → Записан → Оплатил → Завершено + custom stage naming), notes, tasks (done).
5–12. Services, booking, checkout, funnel analytics, event log, automations, AI tools, AI copilot — separate plans.
