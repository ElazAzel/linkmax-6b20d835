# Database Schema Guide

This document serves as a reference for the lnkmx platform's database structure, managed via Supabase (Postgres).

## Core Tables

### `pages`
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `slug` (text, unique) - The public URL identifier (`lnkmx.my/slug`)
- `title` (text)
- `description` (text)
- `theme` (jsonb) - Aesthetic settings (Liquid Glass tokens)
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

## Fintech (Draft implementation)

### `user_wallets`
- `id` (uuid, PK)
- `user_id` (uuid, FK to user_profiles)
- `balance` (numeric)
- `currency` (text)

### `wallet_transactions`
- `id` (uuid, PK)
- `wallet_id` (uuid, FK)
- `amount` (numeric)
- `type` (text) - `credit`, `debit`
- `metadata` (jsonb) - GMV, Fees

## Analytics

### `analytics`
- `id` (bigint, PK)
- `page_id` (uuid, FK)
- `event_type` (text) - `page_view`, `block_click`, `form_submit`
- `block_id` (uuid, optional)
- `metadata` (jsonb) - Geo, Device, Referral

---
*Generated based on migrations up to Feb 2026.*
