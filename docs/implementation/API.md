# API & Backend Documentation

This document serves as a reference for the backend logic of the lnkmx platform, built on Supabase (PostgreSQL + Edge Functions).

## 1. Edge Functions (28 total)

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
| `process-crm-automations` | No JWT | Cron (hourly) — executes CRM automation rules |
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
| `public-experts` | No JWT | Returns public expert directory |
| `resolve-domain` | No JWT | Resolves custom domains to pages |
| `verify-domain` | No JWT | Verifies CNAME/DNS for custom domains |
| `seed-demo-accounts` | No JWT | Seeds demo accounts (admin-only check inside) |
| `language-upload` | No JWT | Uploads language translation files |

> [!NOTE]
> All functions use `verify_jwt = false` in `config.toml` but implement their own auth checks where needed (e.g., `seed-demo-accounts` verifies admin role).

---

## 2. Database RPCs (Remote Procedure Calls)

PostgreSQL functions for atomic operations and secure logic.

| Function | Params | Purpose |
| :--- | :--- | :--- |
| `check_page_limits` | `user_id` | Verifies if user can create more pages based on tier |
| `save_page_blocks` | `page_id`, `blocks_json` | Atomically replaces blocks for a page with versioning |
| `increment_view_count` | `page_id` | Efficiently increments page views +1 |
| `claim_daily_token_reward` | `user_id` | Awards lnkmx tokens for daily login (**auth.uid() check**) |
| `get_token_analytics` | — | Returns token economy stats (**admin-only**) |
| `process_marketplace_purchase` | `buyer_id`, `template_id` | Handles template purchases (**auth.uid() check, self-purchase prevention**) |
| `export_user_data` | `user_id` | **GDPR**: Returns all user data as JSONB |
| `delete_user_account` | `user_id` | **GDPR**: Cascading delete across 15+ tables |
| `warmup_edge_functions` | — | Pings critical edge functions (called by pg_cron) |
| `is_zone_member` | `zone_id` | **Security Definer**: Checks if `auth.uid()` is an active member of the zone |
| `is_zone_admin` | `zone_id` | **Security Definer**: Checks if `auth.uid()` has admin/owner permissions in the zone |

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
> Last updated: 2026-03-07
