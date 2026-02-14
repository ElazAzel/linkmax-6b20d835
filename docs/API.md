# API & Backend Documentation

This document serves as a reference for the backend logic of the lnkmx platform, which is built primarily on Supabase (PostgreSQL + Edge Functions).

## 1. Edge Functions

These server-side functions (Deno) handle complex logic, third-party integrations, and secure operations.

**Location**: `supabase/functions/`

| Function Name | Trigger | Description |
| :--- | :--- | :--- |
| `ai-content-generator` | Manual (App) | Generates page content and copy using Google Gemini. |
| `chatbot-stream` | Web Widget | Streams AI responses for the public page chatbot. |
| `create-lead` | Form Submit | Validates and inserts lead data from public forms. |
| `generate-sitemap` | Cron / Manual | Generates `sitemap.xml` for SEO. |
| `google-forms-parser` | Manual | Import logic for converting Google Forms to lnkmx blocks. |
| `process-crm-automations` | Cron (Hourly) | Checks for and executes CRM automation rules. |
| `public-experts` | Public API | Returns a directory of expert profiles. |
| `send-contact-email` | Event | Sends contact form submissions via Email. |
| `send-lead-notification` | DB Trigger | Notifies users of new leads via Telegram/Email. |
| `send-booking-notification` | DB Trigger | Notifies users of new bookings. |
| `send-event-confirmation` | DB Trigger | Sends ticket/confirmation to event attendees. |
| `telegram-bot-webhook` | Webhook | Handles incoming Telegram messages for the bot. |
| `translate-content` | Manual (App) | Translates block content between RU/EN/KK. |
| `validate-telegram` | Auth flow | Verifies Telegram login widgets. |

*(Note: List may not be exhaustive. See `supabase/functions` directory for all sources.)*

---

## 2. Database RPCs (Remote Procedure Calls)

We use PostgreSQL functions for atomic operations and logic that needs to run close to the data.

| Function | Params | Purpose |
| :--- | :--- | :--- |
| `check_page_limits` | `user_id` | Verifies if a user can create more pages based on their tier. |
| `save_page_blocks` | `page_id`, `blocks_json` | Atomically replaces blocks for a page, handling versioning. |
| `increment_view_count` | `page_id` | Efficiently increments page views +1 without locking. |
| `claim_daily_token_reward` | `user_id` | Awards Linkkon tokens for daily login quest. |
| `upgrade_page_to_paid` | `page_id` | Marks a specific page as premium (Pro feature). |

---

## 3. Row Level Security (RLS)

Security is enforced at the database level using Postgres RLS.

### General Policies
- **`public`**: Can view published pages, user profiles, and blocks.
- **`owner`**: Can view, edit, and delete their own data (`auth.uid() = user_id`).
- **`anon`**: Can insert leads, bookings, and analytics events (requires `public` role).

### Critical Tables
- **`user_profiles`**: Public read (sanitized), Owner write.
- **`pages`**: Public read (if `is_published`), Owner write.
- **`leads`**: Owner read, Public insert (via `create-lead` function or direct policy).
- **`analytics`**: Owner read, Public insert.

> **Security Note**: Never disable RLS on public tables. Always use `security definer` functions carefully.
