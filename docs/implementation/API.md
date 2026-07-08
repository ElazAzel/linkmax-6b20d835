# API & Backend Documentation

This document serves as a reference for the backend logic of the **LinkMAX** platform, built on Supabase (Postgres + Edge Functions).


## 1. Edge Functions (50+ total)


Stateless server-side functions running on **Deno runtime**. Located in `supabase/functions/`.

### AI & Content

| Function | Auth | Description |
| :--- | :--- | :--- |
| `ai-content-generator` | No JWT | Generates page content and copy using Google Gemini |
| `chatbot-stream` | No JWT | Streams AI chatbot responses for public page widget |
| `translate-content` | No JWT | Translates block content between RU/EN/KK |

### Lead & CRM

| Function | Auth | Description |
| :--- | :--- | :--- |
| `process-lead` | No JWT | Processes form submissions, creates contacts & deals |
| `api-leads` | API Key | Public API Endpoint. GET/POST Contacts & Leads (for external integration) |
| `api-deals` | API Key | Public API Endpoint. GET/POST Deals & Pipelines (for external integration) |
| `send-lead-notification` | No JWT | Notifies page owner of new leads via Telegram/Email |
| `process-crm-automations` | No JWT | Cron (hourly) — executes lead follow-up, time clarification, and booking-backed review-request automation rules |
| `google-forms-parser` | No JWT | Imports Google Forms as lnkmx blocks |

### Booking & Events

| Function | Auth | Description |
| :--- | :--- | :--- |
| `send-booking-notification` | No JWT | Notifies of new bookings via Telegram/Email |
| `send-booking-reminder` | No JWT | Sends booking reminders (scheduled) |
| `send-event-confirmation` | No JWT | Sends ticket/confirmation to event attendees |
| `send-attendee-email` | No JWT | Sends follow-up emails to event attendees |
| `google-calendar-sync` | No JWT | Syncs bookings with Google Calendar (OAuth) handling local user timezones |
| `submit-booking` | No JWT | Validates time slots, checks for double-bookings, and inserts bookings safely |

### Fintech & Payments

| Function | Auth | Description |
| :--- | :--- | :--- |
| `robokassa` | No JWT | Generates Robokassa payment links/invoice |
| `kaspi-pay` | No JWT | Integration with Kaspi QR and merchant API |
| `get-paddle-price` | No JWT | Resolves LinkMAX price aliases to Paddle price IDs through the existing Paddle gateway |
| `payments-webhook` | No JWT | Verifies Paddle webhooks, syncs subscriptions, records billing recovery facts, queues owner recovery notices, and emits billing product/webhook events |
| `process-transaction-fee` | Internal | Calculates and splits 7% (Starter) or 1% (Pro) fees |
| `monetization-webhook` | No JWT | Unified handler for all payment events |
| `robokassa-webhook` | No JWT | Verifies Robokassa signature and confirms payment in Supabase |

### Telegram Integration

| Function | Auth | Description |
| :--- | :--- | :--- |
| `telegram-bot-webhook` | No JWT | Handles incoming Telegram messages. Warm-up: `?warmup=true` |
| `validate-telegram` | No JWT | Verifies Telegram login widgets |
| `telegram-password-reset` | No JWT | Handles password reset via Telegram |

### Notifications (Social/Team)

| Function | Auth | Description |
| :--- | :--- | :--- |
| `send-collab-notification` | No JWT | Collaboration request notifications |
| `send-friend-notification` | No JWT | Friend invitation notifications |
| `send-social-notification` | No JWT | Social interaction notifications |
| `send-team-notification` | No JWT | Team membership notifications |
| `send-weekly-digest` | No JWT | Weekly activity digest emails |
| `send-weekly-motivation` | No JWT | Weekly motivational notifications |
| `send-trial-ending-notification` | No JWT | Pro trial expiry reminders |
| `send-email` | No JWT | Generic email delivery service |

### SEO & Analytics

| Function | Auth | Description |
| :--- | :--- | :--- |
| `seo-ssr` | No JWT | Server-side rendered HTML for bots/crawlers. Rate limited (60/min). Warm-up support |
| `generate-sitemap` | No JWT | Generates `sitemap.xml` for SEO |
| `pixel-proxy` | No JWT | **Server-side pixel forwarding** — FB CAPI, TikTok Events, GA4 MP. Rate limited (100/min) |

### Other

| Function | Auth | Description |
| :--- | :--- | :--- |
| `public-experts` | No JWT | Returns public expert directory dataset for GEO/AEO consumers |
| `resolve-domain` | No JWT | Resolves custom domains to pages |
| `verify-domain` | No JWT | Verifies CNAME/DNS for custom domains |
| `seed-demo-accounts` | No JWT | Seeds demo accounts (admin-only check inside) |
| `language-upload` | No JWT | Uploads language translation files |
| `health-check` | No JWT | System health monitor for uptime tracking |

### Developer Platform (Zenith Phase)

| Function | Auth | Description |
| :--- | :--- | :--- |
| `api-leads` | API Key | Public API endpoint for contacts/leads. V2 migration target: `verify_user_api_key(..., 'leads:read'/'leads:write')` |
| `api-deals` | API Key | Public API endpoint for deals. V2 migration target: scoped `api_keys` verification |
| `broadcast-update` | Internal | Mass-notify users/pages of system changes |
| `run-zone-automations` | No JWT | Executes user-defined business zone rules |
| `cleanup-orphaned-media`| Admin | Maintenance: Removes unused storage assets |


> [!NOTE]
> All functions use `verify_jwt = false` in `config.toml` but implement their own auth checks where needed (e.g., `seed-demo-accounts` verifies admin role).

---

## 2. Database RPCs (Remote Procedure Calls)

PostgreSQL functions for atomic operations and secure logic.

| Function | Params | Purpose |
| :--- | :--- | :--- |
| `check_page_limits` | `user_id` | Verifies if user can create more pages based on tier |
| `save_page_blocks` | `page_id`, `blocks_json` | Atomically replaces blocks for a page with versioning |
| `generate_user_api_key`| `key_name`, `requested_scopes` | Securely generates and hashes a new `lk_live_` token and returns the plaintext once |
| `verify_user_api_key` | `p_api_key`, `p_required_scope` | Validates a hashed `lk_live_` token, checks optional scope, and updates `last_used_at` |
| `create_webhook_endpoint` | `p_name`, `p_target_url`, `p_event_types`, `p_zone_id` | Creates a Webhooks V2 endpoint and returns the generated HMAC signing secret once |
| `rotate_webhook_secret` | `p_endpoint_id` | Rotates the current HMAC signing secret and returns the generated secret once |
| `enqueue_webhook_event` | `p_event_type`, `p_user_id`, `p_zone_id`, `p_source_table`, `p_source_id`, `p_payload`, `p_idempotency_key` | Service-role durable outbox insert for outgoing Webhooks V2 events |
| `create_review_for_booking` | `p_booking_id`, `p_rating`, `p_body`, `p_reviewer_display_name`, `p_reviewer_contact`, `p_title`, `p_metadata` | Creates a pending verified review for a completed booking, requires authenticated customer ownership or matching booking contact proof, and deduplicates one review per booking |
| `moderate_review` | `p_review_id`, `p_status`, `p_reason` | Lets the page owner, workspace editor/admin, zone admin, or platform admin publish, hide, reject, or flag a review |
| `create_booking_review_request` | `p_booking_id`, `p_expires_in`, `p_metadata` | Creates or rotates a hashed token review request for a completed booking and returns the raw token once; authenticated owners use page permissions, service-role workers use the same RPC for CRM automation |
| `get_review_request_by_token` | `p_token` | Returns public-safe page and booking context for a pending review request token |
| `submit_review_request` | `p_token`, `p_rating`, `p_body`, `p_reviewer_display_name`, `p_reviewer_contact`, `p_title`, `p_metadata` | Consumes a pending review request token and delegates creation to the verified booking review RPC |
| `get_wallet_balance` | `wallet_id` | Returns current ledger-verified balance |
| `track_ledger_entry` | `amount`, `type` | Atomic financial logging for Step-by-Growth fees |

| `increment_view_count` | `page_id` | Efficiently increments page views +1 |
| `claim_daily_token_reward` | `user_id` | Awards lnkmx tokens for daily login (**auth.uid() check**) |
| `get_token_analytics` | — | Returns token economy stats (**admin-only**) |
| `process_marketplace_purchase` | `buyer_id`, `template_id` | Handles template purchases (**auth.uid() check, self-purchase prevention**) |
| `export_user_data` | `user_id` | **GDPR**: Returns all user data as JSONB |
| `delete_user_account` | `user_id` | **GDPR**: Cascading delete across 15+ tables |
| `warmup_edge_functions` | — | Pings critical edge functions (called by pg_cron) |
| `is_zone_member` | `zone_id` | **Security Definer**: Checks if `auth.uid()` is an active member of the zone |
| `is_zone_admin` | `zone_id` | **Security Definer**: Checks if `auth.uid()` has admin/owner permissions in the zone |

### Public Review Request Route

| Route | Purpose |
| :--- | :--- |
| `/review/request/:token` | Public noindex form that resolves `get_review_request_by_token`, collects a rating and optional text, and submits through `submit_review_request` without reading `review_requests` directly |

Owner CRM surfaces create request links through `create_booking_review_request`; `BookingsPanel` only receives the raw token once, builds the public URL, and copies it for manual customer follow-up. `process-crm-automations` uses the same RPC for completed bookings, sends the owner Telegram notification, and records the result on `automation_logs.booking_id`.

Public pages render verified trust through `page_review_summaries` plus published rows from `reviews`; this is read-only public data and remains separate from editable testimonial blocks.

The Activity inbox reviews tab reads owner-visible `reviews` through existing RLS and mutates publication state only through `moderate_review`; it does not perform direct table updates.

The `/experts` directory reads published `pages` plus `page_review_summaries` through `fetchExpertDirectoryProfiles(...)`; it exposes rating badges, city/search/verified filters, trust-aware ranking, and `AggregateRating` JSON-LD without reading raw review text for directory cards.

### Billing Recovery Events

Phase 26 extends Paddle billing events without adding a second payment engine:

| Event | Source | Effect |
| :--- | :--- | :--- |
| `subscription.past_due` | Paddle | Records failed billing fact, updates `subscriptions.recovery_*`, queues owner email/Telegram recovery notices |
| `transaction.payment_failed` | Paddle | Same recovery path, idempotent by provider event ID |
| `transaction.past_due` | Paddle | Same recovery path, idempotent by provider event ID |
| `transaction.completed` / `transaction.paid` | Paddle | Records success and clears active recovery state when applicable |
| `subscription.activated` / active `subscription.updated` | Paddle | Syncs subscription and clears active recovery state when applicable |

Product Analytics events: `billing_payment_failed`, `billing_recovery_scheduled`, `billing_recovered`, `billing_recovery_exhausted`, `promo_code_applied`.

Webhooks V2 events: `billing.payment_failed`, `billing.recovery_scheduled`, `billing.recovered`, `billing.recovery_exhausted`, `promo.applied`.

### Website Analytics Events

Public page analytics uses the existing guarded `analytics` insert path. Phase 25 adds one qualitative signal without adding a session replay API:

| Event | Source | Metadata |
| :--- | :--- | :--- |
| `heatmap_clicks` | Public page heatmap tracker | Aggregated click positions and relative page coordinates |
| `heatmap_scroll` | Public page heatmap tracker | Max scroll depth plus viewport/page dimensions |
| `heatmap_rage_clicks` | Public page heatmap tracker | Repeated-click clusters with normalized coordinates, click count, detection window, and timestamp |

`heatmap_rage_clicks` is coordinate-only. It does not store DOM text, selectors, screenshots, recordings, or submitted field values.

---

## 3. Row Level Security (RLS)

Security enforced at the database level using Postgres RLS on **all tables**.

### Policy Categories

- **`public`**: Can view published pages, user profiles, and blocks.
- **`owner`**: Can view, edit, and delete own data (`auth.uid() = user_id`).
- **`anon`**: Can insert leads, bookings, and analytics events.
- **`admin`**: Full access via `has_role(auth.uid(), 'admin')`.

### Critical Tables

| Table | RLS | Policies |
| :--- | :--- | :--- |
| `pages` | ✅ | Public read (if `is_published`), Owner write |
| `blocks` | ✅ | Access through page ownership |
| `user_profiles` | ✅ | Public read (sanitized), Owner write |
| `leads` | ✅ | Owner read, Public insert (via edge function) |
| `bookings` | ✅ | Owner + customer access only |
| `analytics` | ✅ | Page owner read, Public insert |
| `reviews` | ✅ | Public published read, owner/workspace/zone/admin operational read, writes only through RPCs |
| `page_review_summaries` | ✅ | Public read for published pages, owner/workspace/zone/admin operational read |
| `review_requests` | ✅ | Owner/workspace operational read, public token flows only through RPCs |
| `automation_logs` | ✅ | Owner/admin read through parent automation; targets either `lead_id` or `booking_id` |
| `zones` | ✅ | Owner/Member read, Owner write |
| `zone_members` | ✅ | Member read, Admin/Owner write |
| `zone_deals` | ✅ | Zone member access via `is_zone_member` |
| `zone_tasks` | ✅ | Zone member access via `is_zone_member` |
| `zone_contacts` | ✅ | Zone member access via `is_zone_member` |
| `zone_invoices` | ✅ | Zone member access via `is_zone_member` |
| `zone_documents` | ✅ | Zone member access via `is_zone_member` |
| `token_transactions` | ✅ | User/seller/buyer access |
| `rate_limits` | ✅ | Edge function service-role access |

> [!CAUTION]
> Never disable RLS. Use `SECURITY DEFINER` functions carefully and always validate `auth.uid()`.

---

> [!IMPORTANT]
> Last updated: 2026-07-02
