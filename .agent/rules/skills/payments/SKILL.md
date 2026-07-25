---
name: payments
description: Billing, purchases, payment-provider callbacks, entitlements, and financial auditability.
---

# Payments

Use for purchase, subscription, wallet, entitlement, or provider webhook changes.

1. Define authoritative transaction state, idempotency key, amount/currency, entitlement effect, and reconciliation path.
2. Verify provider signatures server-side and never trust client payment status.
3. Make mutations idempotent and record immutable audit evidence for financial events.
4. Restrict payout and balance changes with server authorization and RLS.
5. Test duplicate callbacks, failed payments, refund/cancellation paths, and unauthorized requests.
