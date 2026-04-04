# Database Schema Guide

This document serves as a reference for the **LinkMAX** platform's database structure, managed via Supabase (Postgres).


## Core Tables

### `pages`

- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `slug` (text, unique) - The public URL identifier (`lnkmx.my/slug`)
- `title` (text)
- `description` (text)
- `theme` (jsonb) - Aesthetic settings (**Living Canvas** tokens)

- `is_published` (boolean)
- `is_premium` (boolean)
- `metadata` (jsonb) - SEO tags, Pixel IDs: `fb_pixel_id`, `tt_pixel_id`, `ga_id`, `yandex_id`

### `blocks`

- `id` (uuid, PK)
- `page_id` (uuid, FK to pages)
- `type` (text) - Reference to `ALL_BLOCK_TYPES` in `block-registry.ts`
- `content` (jsonb) - Block-specific data (links, images, text)
- `position` (integer) - Order on the page
- `is_visible` (boolean)
- `deleted_at` (timestamp) - Soft-delete support


## CRM & Interactions

### `leads`

- `id` (uuid, PK)
- `page_id` (uuid, FK to pages)
- `email` (text)
- `phone` (text)
- `full_name` (text)
- `data` (jsonb) - Custom form fields
- `status` (text) - `new`, `contacted`, `qualified`, `converted`
- `source` (text) - UTM tracking

### `bookings`

- `id` (uuid, PK)
- `page_id` (uuid, FK to pages)
- `start_time` (timestamp)
- `end_time` (timestamp)
- `status` (text)
- `customer_info` (jsonb)
- `deleted_at` (timestamp, optional)


### `user_wallets` (Fintech Core)

- `id` (uuid, PK)
- `user_id` (uuid, FK to user_profiles)
- `balance` (numeric) - Ledger-verified balance
- `currency` (text)
- `status` (text) - `active`, `frozen`

### `wallet_transactions` (Ledger)

- `id` (uuid, PK)
- `wallet_id` (uuid, FK)
- `amount` (numeric)
- `type` (text) - `credit`, `debit`
- `metadata` (jsonb) - GMV, Fees (`platform_fee`, `partner_fee`), transaction IDs
- `created_at` (timestamp)


## Analytics

### `analytics`

- `id` (bigint, PK)
- `page_id` (uuid, FK)
- `event_type` (text) - `page_view`, `block_click`, `form_submit`
- `block_id` (uuid, optional)
- `metadata` (jsonb) - Geo, Device, Referral

## Business Zones (Business OS)

### `zones`

- `id` (uuid, PK)
- `owner_id` (uuid, FK to user_profiles)
- `name` (text)
- `settings` (jsonb)

### `zone_members`

- `zone_id` (uuid, FK)
- `user_id` (uuid, FK)
- `role` (text) - `owner`, `admin`, `member`

### `zone_deals`

- `id` (uuid, PK)
- `zone_id` (uuid, FK)
- `title` (text)
- `amount` (numeric)
- `status` (text)
- `contact_id` (uuid, FK)
- `deleted_at` (timestamp)


### `zone_tasks`

- `id` (uuid, PK)
- `zone_id` (uuid, FK)
- `title` (text)
- `priority` (text) - `low`, `medium`, `high`
- `due_date` (timestamp)
- `is_completed` (boolean)

### `zone_contacts`

- `id` (uuid, PK)
- `zone_id` (uuid, FK)
- `full_name` (text)
- `email` (text)
- `phone` (text)

### `zone_invoices`

- `id` (uuid, PK)
- `zone_id` (uuid, FK)
- `number` (text, unique)
- `amount` (numeric)
- `status` (text) - `draft`, `sent`, `paid`, `cancelled`

### `zone_document_templates`

- `id` (uuid, PK)
- `zone_id` (uuid, FK)
- `title` (text)
- `content` (text) - HTML template with variables

### `zone_documents`

- `id` (uuid, PK)
- `zone_id` (uuid, FK)
- `template_id` (uuid, FK)
- `title` (text)
- `status` (text) - `draft`, `sent`, `signed`
- `deal_id` (uuid, FK)
- `contact_id` (uuid, FK)
- `file_url` (text) - Link to storage

---
*Generated based on migrations up to March 2026 (Business OS Update).*
## Developer Platform (Zenith Phase)

### `api_keys`

- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `name` (text)
- `key_prefix` (text) - Stores `lk_live_` first 7 chars
- `key_hash` (text) - SHA-256 hash of the secret
- `last_used_at` (timestamp)

### `webhooks`

- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `target_url` (text)
- `event_types` (text[]) - `lead.created`, `booking.new`, `transaction.success`
- `secret` (text) - For signature verification
- `is_active` (boolean)
