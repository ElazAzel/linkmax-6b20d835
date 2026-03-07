# ADR 0026: Monetization Pivot to "Step-by-Growth" Transactional Model

## Status

Accepted

## Context

As of March 2026, the lnkmx platform (Business OS for Solopreneurs) is shifting its primary growth lever from a pure SaaS subscription model to a transactional-first model ("Starter" tier). This decision is based on the identifying that the core user base (solopreneurs and micro-businesses) often faces a high entry barrier with upfront monthly costs before achieving their first sale.

## Decision

We will implement 3 tiers of monetization:

1. **Identity (Free)**: 0$ / month. Basic link-in-bio features. Focus on viral growth through "Powered by" branding.
2. **Starter (Success)**: 0$ / month + **7% transaction fee**. Full access to CRM, Invoices, and Booking. This aligns the platform's success with the user's success.
3. **Pro (Business OS)**: ~6.5$ / month (3,045 ₸) + **1% transaction fee**. Advanced white-label features, multi-page, and deep analytics.

## Consequences

- **Positive**: Lowers CAC, increases viral coefficient, and reduces friction for the "First Sale" milestone.
- **Negative**: Requires deeper integration with payment gateways (RoboKassa, Kaspi QR) to automate fee collection.
- **Technical**: Edge Functions must be updated to handle dynamic fee calculation and revenue sharing.

## References

- [2_BUSINESS_FINANCIAL_MODEL.md](../product/2_BUSINESS_FINANCIAL_MODEL.md)
- [AUDIT_REPORT_2026_03_07.md](../audits/AUDIT_REPORT_2026_03_07.md)
