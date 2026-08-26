---
name: payments
description: Billing, subscriptions, Robokassa, Kaspi QR, Paddle, Stripe, and financial auditability in LinkMAX.
---

# Payments & Fintech

Use for billing subscriptions, provider integrations (Robokassa, Kaspi QR, Paddle, Stripe), digital goods checkout, wallet balances, and financial audit logs.

## When to Use
- Integrating or updating payment gateways (Robokassa, Kaspi Pay, Paddle, Stripe).
- Handling PRO / Agency subscription plans and token purchases.
- Processing digital product checkouts and instant digital delivery.
- Managing author payouts, fee splits, and withdrawal requests.

## Core Workflows

### 1. Payment Session Creation
1. Client calls `src/services/payment-service.ts` or `src/services/zones/robokassa.ts`.
2. Supabase Edge Function `create-payment-session` generates cryptographic order signature and secure checkout URL.
3. Client redirects to gateway or opens embedded checkout modal.

### 2. Webhook & Signature Verification
1. Payment gateway sends callback to `supabase/functions/payments-webhook` or `robokassa-webhook`.
2. Edge Function calculates MD5 / HMAC SHA256 signature using server-only secret.
3. If valid, executes idempotent transaction in PostgreSQL:
   - Updates order status to `paid`.
   - Provisions subscription / credits tokens / unlocks digital download.
   - Creates immutable ledger entry in `financial_transactions` table.
4. Returns `OK` to gateway.

### 3. Payouts & Balance Management
1. User requests withdrawal via `src/services/fintech.ts` (`requestPayout`).
2. Validates amount > 0, checks sufficient available balance, and records pending status.
3. Admin approves payout in `/dashboard/finance` or `/admin`.

## Key Files & Services
- **Services**: `src/services/payment-service.ts`, `src/services/fintech.ts`, `src/services/kaspi-service.ts`, `src/services/zones/robokassa.ts`
- **Edge Functions**: `supabase/functions/create-payment-session`, `supabase/functions/payments-webhook`, `supabase/functions/robokassa-webhook`, `supabase/functions/process-transaction-fee`
- **Screens**: `src/components/billing/`, `src/components/zones/ZoneInvoicesScreen.tsx`

## Commands & Verification
```bash
npm run test -- src/services/__tests__/fintech.test.ts src/services/__tests__/payment-service.test.ts src/services/zones/__tests__/robokassa.test.ts
```

## Best Practices & Guardrails
- **Zero Trust on Client**: Never update account balance or entitlement state directly from browser callbacks.
- **Idempotency**: Webhook handlers must check if `order_id` / `transaction_id` was already processed.
- **Precision**: Normalize monetary amounts to 2 decimal places to avoid IEEE-754 floating-point drift.
