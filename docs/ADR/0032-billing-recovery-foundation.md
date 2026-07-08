# ADR 0032: Billing Recovery Foundation

Date: 2026-07-04

## Status

Accepted

## Context

Phase 26 targets billing resilience: failed Pro payments should not silently become churn, and campaign or partner promo codes need a clean path into the existing checkout. LinkMAX already has several monetization primitives:

| Area | Existing system | Gap |
|---|---|---|
| Pro entitlement | `user_profiles.is_premium`, `premium_tier`, `premium_expires_at` | No recovery state after failed renewal |
| Paddle subscriptions | `subscriptions`, `payments-webhook`, `has_active_subscription` | Created/updated/canceled only; no failed-payment handling |
| Robokassa checkout | `robokassa`, `robokassa-webhook`, `orders`, `billing_history` | Legacy fixed-period Pro and zone payments |
| Wallet/Ledger | `user_wallets`, `wallet_transactions`, `process-transaction-fee` | Revenue split engine, not subscription billing |
| Notifications | `notification_queue`, `process-notifications` | No billing recovery messages |
| Analytics/Webhooks | `product_events`, Webhooks V2 outbox | No billing failure or recovery event names |

The recovery layer must extend existing subscription and notification infrastructure. It must not create a second wallet, payment engine, user model, or checkout service.

## Decision

1. Keep Paddle `subscriptions` as the canonical Pro subscription state for recurring billing.
2. Extend `subscriptions` with recovery columns: status, attempt count, recovery timestamps, and last failure details.
3. Extend `billing_history` with `subscription_id`, `provider`, `provider_event_id`, and `metadata` so Paddle webhook facts become idempotent billing journal rows.
4. Reuse `notification_queue` for owner email and Telegram recovery notices.
5. Reuse `product_events` and Webhooks V2 for `billing_payment_failed`, `billing_recovery_scheduled`, `billing_recovered`, and `billing_recovery_exhausted`.
6. Pass safe promo codes into Paddle Checkout with `discountCode` and `customData.promoCode`; Paddle remains the discount authority.

## UX Flow

1. Owner upgrades through an existing Pro CTA.
2. If the URL contains `promo` or `coupon`, the Paywall checkout normalizes and passes that code to Paddle.
3. Paddle confirms or rejects the payment method.
4. On `transaction.payment_failed`, `transaction.past_due`, or `subscription.past_due`, LinkMAX records the provider event once, updates recovery state, queues owner notifications, and emits product/webhook events.
5. If Paddle later sends `transaction.completed`, `transaction.paid`, `subscription.activated`, or an active `subscription.updated`, LinkMAX records the success and clears active recovery state.

## Database Design

- No new billing table is introduced for Phase 26 iteration 1.
- `subscriptions` gains recovery columns and a partial index on due recovery work.
- `billing_history` gains subscription/provider linkage and a unique provider-event index.
- Existing RLS remains intact. No public read access is added.
- Existing Supabase grants for `subscriptions` and `billing_history` remain the API exposure boundary.

## Backend

- `payments-webhook` handles Paddle failure and recovery-success events.
- Failure events increment the recovery attempt count up to three touchpoints.
- Notification delivery remains asynchronous through `notification_queue`.
- Webhook delivery remains asynchronous through `enqueue_webhook_event`.

## Frontend

- `usePaddleCheckout` accepts an optional `discountCode`.
- `PaywallModal` reads `promo` or `coupon` URL parameters and passes them to checkout.
- No visual pricing redesign ships in this iteration.

## Security

- Provider events are idempotent through `billing_history(provider, provider_event_id)`.
- Recovery writes happen only through service-role Paddle webhook handling.
- Promo codes are normalized to uppercase `A-Z`, digits, `_`, and `-`, length 3-32.
- Email and Telegram delivery reuse existing owner notification preferences.

## Performance

- Recovery lookup uses existing subscription identifiers and new partial recovery index.
- Notification and outgoing webhook work stay off the payment webhook response path except for queue inserts.
- Billing journal idempotency prevents duplicate attempts from Paddle webhook retries.

## Scalability

| Scale | Behavior |
|---|---|
| 100 users | Direct table updates and queue inserts are sufficient |
| 1,000 users | Partial index supports recovery queue scans |
| 10,000 users | Provider event idempotency prevents duplicate churn touchpoints |
| 100,000 users | Notification processing can scale by queue batch size and schedule cadence |
| 1,000,000 users | Recovery runner and notification workers can shard by `recovery_next_action_at` windows |

## Backward Compatibility

Existing Robokassa flows, wallet ledger, Starter commissions, Pro entitlement checks, and billing history reads remain compatible. The new columns are additive and old records remain readable.

## Iteration Plan

| Iteration | Scope | Definition of Done |
|---|---|---|
| 1 | Recovery schema, Paddle failure handling, notification outbox, promo checkout handoff, tests, docs | Typecheck, lint, focused tests, build |
| 2 | Recovery runner for due touchpoints and owner dashboard status | Scheduled worker and UI state verified |
| 3 | Admin campaign management for Paddle discount IDs/codes | Campaign audit trail and partner attribution verified |
