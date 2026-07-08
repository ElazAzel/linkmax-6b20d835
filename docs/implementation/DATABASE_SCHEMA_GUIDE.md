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

## Payments & Billing

### `subscriptions`

- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `paddle_subscription_id` (text, unique)
- `paddle_customer_id` (text)
- `product_id`, `price_id` (text)
- `status` (text) - Paddle subscription state such as `active`, `trialing`, `past_due`, `canceled`
- `current_period_start`, `current_period_end`
- `cancel_at_period_end` (boolean)
- `environment` (text) - `sandbox` or `live`
- `recovery_status` (text) - `none`, `scheduled`, `notified`, `recovered`, `exhausted`
- `recovery_attempt_count` (integer, 0-3)
- `recovery_started_at`, `recovery_next_action_at`, `recovery_last_notified_at`, `recovery_last_event_at`
- `recovery_last_failure_code`, `recovery_last_failure_message`
- `created_at`, `updated_at`

Indexes:

- `idx_subscriptions_user_id`
- `idx_subscriptions_paddle_id`
- `idx_subscriptions_recovery_due` for scheduled recovery work

### `billing_history`

- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `order_id` (uuid, FK to orders, optional)
- `subscription_id` (uuid, FK to subscriptions, optional)
- `type` (text) - `subscription`, `zone_upgrade`, `payment`, `refund`
- `amount`, `currency`
- `description`
- `status` (text) - `completed`, `paid`, `failed`, `cancelled`, etc.
- `provider` (text) - payment provider such as `paddle` or `robokassa`
- `provider_event_id` (text) - idempotency key for provider webhook events
- `metadata` (jsonb)
- `created_at`

Indexes:

- `idx_billing_history_user_id`
- `idx_billing_history_created_at`
- `idx_billing_history_subscription_id`
- `idx_billing_history_provider_event` unique provider-event guard

## Trust & Reviews

### `reviews`

- `id` (uuid, PK)
- `page_id` (uuid, FK to pages)
- `owner_id` (uuid, FK to auth.users)
- `organization_id` (uuid, FK to organizations, optional)
- `zone_id` (uuid, FK to zones, optional)
- `booking_id` (uuid, FK to bookings, optional) - required for verified booking reviews
- `order_id` (uuid, FK to orders, optional) - required for verified order reviews
- `staff_id` (uuid, FK to zone_staff, optional)
- `rating` (integer, 1-5)
- `title`, `body`, `reviewer_display_name`
- `reviewer_contact_hash` (text, optional) - salted SHA-256 hash for deduplication and privacy
- `source` (text) - `booking`, `order`, `owner_import`, `manual`
- `status` (text) - `pending`, `published`, `hidden`, `rejected`, `flagged`
- `verification_status` (text) - `verified_booking`, `verified_order`, `owner_imported`, `unverified`
- `is_featured` (boolean)
- `published_at`, `hidden_at`, `created_at`, `updated_at`
- `metadata` (jsonb)

Constraints and indexes:

- One review per booking (`reviews_unique_booking`) and one review per order (`reviews_unique_order`).
- Booking/order sources must reference the matching business fact; owner-import/manual reviews may exist without a booking/order.
- Published review reads are public only when the related page is published.
- Owners, organization editors/admins, zone members/admins, and platform admins can read operational review records.

RPCs:

- `create_review_for_booking(...)` - creates a pending, verified booking review after a completed booking; anonymous submissions must match the booking email or phone, while authenticated booking customers can submit for their own booking.
- `moderate_review(...)` - publishes, hides, rejects, or flags a review after owner/admin authorization.

Frontend consumers:

- Activity inbox review moderation reads owner-visible rows through the existing `reviews` RLS policy and calls `moderate_review(...)` for all publication state changes.

Events:

- Product analytics events: `review_created`, `review_published`.
- Webhook events: `review.created`, `review.published`.

### `review_requests`

- `id` (uuid, PK)
- `page_id` (uuid, FK to pages)
- `owner_id` (uuid, FK to auth.users)
- `organization_id`, `zone_id` (optional workspace references)
- `booking_id`, `order_id` (optional business fact references; at least one required)
- `review_id` (uuid, FK to reviews, optional until submitted)
- `request_token_hash` (text, unique) - SHA-256 hash of the raw `rv_` token
- `recipient_contact_hash` (text, optional) - hashed customer contact proof
- `status` (text) - `pending`, `used`, `expired`, `revoked`
- `expires_at`, `sent_at`, `used_at`, `revoked_at`, `created_at`, `updated_at`
- `metadata` (jsonb)

Constraints and indexes:

- One request per booking (`idx_review_requests_one_per_booking`) and one request per order (`idx_review_requests_one_per_order`).
- Owner/page status indexes support moderation and automation queues.
- Pending expiry index supports future cleanup jobs.

RPCs:

- `create_booking_review_request(...)` - creates or rotates a pending token for a completed booking and returns the raw token once.
- `get_review_request_by_token(...)` - exposes only public-safe page and booking context for a pending token.
- `submit_review_request(...)` - consumes the token and delegates review creation to `create_review_for_booking(...)`.

Events:

- Product analytics events: `review_request_created`, `review_request_used`.
- Webhook events: `review_request.created`, `review_request.used`.

### `automation_logs`

CRM automation logs now support both lead and booking targets:

- `lead_id` (uuid, FK to leads, optional)
- `booking_id` (uuid, FK to bookings, optional)
- `automation_logs_target_check` requires at least one target.
- `(automation_id, booking_id)` supports idempotent review-request automation checks.

### `page_review_summaries`

- `page_id` (uuid, PK/FK to pages)
- `owner_id` (uuid, FK to auth.users)
- `organization_id` (uuid, FK to organizations, optional)
- `zone_id` (uuid, FK to zones, optional)
- `published_count` (integer)
- `average_rating` (numeric, optional)
- `rating_breakdown` (jsonb) - keys `1` through `5`
- `last_review_at`, `updated_at`

This table is maintained by database triggers from `reviews` and gives public pages, `/experts`, analytics, and AI agents a stable trust aggregate without scanning raw reviews. The expert directory reads these summaries for rating badges, verified filters, and trust-aware ranking.


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

- `id` (uuid, PK)
- `page_id` (uuid, FK)
- `event_type` (text) - `view`, `click`, `share`, `activation:*`, `editor:*`, `auth:*`
- `block_id` (uuid, optional)
- `metadata` (jsonb) - Geo, Device, Referral

### `product_events`

- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `page_id` (uuid, FK to pages, optional)
- `event_name` (text) - canonical creator lifecycle event, checked by `is_allowed_product_event_name`; includes trust events, billing recovery events, and promo attribution events
- `source` (text) - `client`, `edge`, `system`
- `metadata` (jsonb) - event-specific context
- `occurred_at` (timestamp)
- `created_at` (timestamp)

### `creator_activation_state`

- `user_id` (uuid, PK/FK to auth.users)
- `primary_page_id` (uuid, FK to pages, optional)
- milestone timestamps: `signup_completed_at`, `onboarding_started_at`, `onboarding_completed_at`, `page_generated_at`, `first_edit_at`, `page_published_at`, `conversion_block_added_at`, `telegram_connected_at`, `first_lead_received_at`, `first_lead_processed_at`, `first_booking_created_at`, `first_invoice_created_at`, `first_payment_completed_at`, `upgrade_clicked_at`, `upgrade_completed_at`, `dashboard_returned_at`
- `updated_at` (timestamp)

### `creator_health_scores`

- `user_id` (uuid, PK/FK to auth.users)
- `score` (integer, 0-100)
- point columns: `page_published_points`, `conversion_block_points`, `telegram_points`, `first_lead_points`, `lead_processed_points`, `dashboard_return_points`
- `reasons` (jsonb) - score explanation and missing milestones
- `calculated_at` (timestamp)
- `updated_at` (timestamp)

## Feature Flags

### `feature_flags`

- `id` (uuid, PK)
- `key` (text, unique) - canonical rollout key such as `booking_v2_enabled`
- `name` (text)
- `description` (text, optional)
- `is_enabled` (boolean) - master switch
- `default_enabled` (boolean) - fallback state when no rule matches
- `rollout_percentage` (integer, 0-100) - deterministic user rollout
- `metadata` (jsonb)
- `starts_at`, `ends_at` (timestamp, optional)
- `created_by` (uuid, FK to auth.users, optional)
- `created_at`, `updated_at` (timestamp)

### `feature_flag_rules`

- `id` (uuid, PK)
- `flag_id` (uuid, FK to feature_flags)
- `rule_type` (text) - `user_id`, `tier`, `niche`, `country`, `language`, `role`, `percentage`, `beta_list`
- `operator` (text) - `in`, `not_in`, `equals`, `not_equals`
- `values` (jsonb) - segment values
- `rollout_percentage` (integer, optional)
- `priority` (integer)
- `is_enabled` (boolean)
- `created_at`, `updated_at` (timestamp)

### `feature_flag_audit_log`

- `id` (uuid, PK)
- `flag_id` (uuid, FK to feature_flags, optional)
- `actor_id` (uuid, FK to auth.users, optional)
- `action` (text) - `created`, `updated`, `enabled`, `disabled`, `rule_created`, `rule_updated`, `rule_deleted`
- `previous_value` (jsonb, optional)
- `next_value` (jsonb, optional)
- `created_at` (timestamp)

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
*Generated based on migrations through July 2026 (Business OS, Developer Platform V2, Verified Reviews, and Billing Recovery foundations).*
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

## Developer Platform V2 / Webhooks V2

### `api_keys`

- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `name` (text)
- `key_prefix` / `key_hint` (text) - non-secret display prefix for `lk_live_` keys
- `key_hash` (text) - SHA-256 hash of the secret
- `scopes` (text[]) - allowed scopes: `leads:read`, `leads:write`, `bookings:read`, `bookings:write`, `pages:read`, `analytics:read`, `webhooks:manage`
- `rate_limit_per_minute` (integer)
- `is_active`, `revoked_at`, `expires_at`
- `last_used_at`, `created_at`
- `metadata` (jsonb)

RPCs:

- `generate_user_api_key(key_name, requested_scopes)` - returns plaintext once plus safe key details.
- `verify_user_api_key(p_api_key, p_required_scope)` - validates hash, activity, expiry, and optional scope.

### `webhook_endpoints`

- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `zone_id` (uuid, FK to zones, optional)
- `name` (text)
- `target_url` (text, HTTPS only)
- `event_types` (text[]) - canonical V2 events: `lead.created`, `lead.updated`, `booking.created`, `booking.cancelled`, `event.registration_created`, `invoice.created`, `invoice.paid`, `page.published`, `form.submitted`, `review_request.created`, `review_request.used`, `review.created`, `review.published`, `billing.payment_failed`, `billing.recovery_scheduled`, `billing.recovered`, `billing.recovery_exhausted`, `promo.applied`
- `is_active`, `status` - `active`, `disabled`, `rotating_secret`
- `failure_count`, `disabled_at`, `disabled_reason`
- `last_success_at`, `last_failure_at`
- `created_at`, `updated_at`

### `webhook_secrets`

- `id` (uuid, PK)
- `endpoint_id` (uuid, FK to webhook_endpoints)
- `secret` (text) - HMAC signing secret, service-managed
- `secret_hint` (text)
- `status` (text) - `current`, `previous`, `revoked`
- `created_by` (uuid, FK to auth.users, optional)
- `expires_at`, `created_at`

RPCs:

- `create_webhook_endpoint(p_name, p_target_url, p_event_types, p_zone_id)` - creates endpoint and returns generated signing secret once.
- `rotate_webhook_secret(p_endpoint_id)` - rotates current secret and returns generated signing secret once.

### `webhook_event_queue`

- `id` (uuid, PK)
- `event_type` (text)
- `user_id` (uuid, FK to auth.users)
- `zone_id` (uuid, FK to zones, optional)
- `source_table`, `source_id`
- `payload` (jsonb)
- `status` (text) - `pending`, `processing`, `delivered`, `failed`, `skipped`
- `attempts` (integer)
- `next_attempt_at` (timestamp)
- `idempotency_key` (text, unique)
- `last_error`
- `created_at`, `updated_at`

RPC:

- `enqueue_webhook_event(...)` - service-role event outbox insert with idempotency.

### `webhook_deliveries`

- `id` (uuid, PK)
- `endpoint_id` (uuid, FK to webhook_endpoints)
- `event_queue_id` (uuid, FK to webhook_event_queue)
- `attempt_number` (integer)
- `status` (text) - `pending`, `success`, `failed`, `skipped`
- `request_headers` (jsonb)
- `response_status`, `response_body_preview`
- `error_message`, `duration_ms`, `next_retry_at`
- `created_at`
