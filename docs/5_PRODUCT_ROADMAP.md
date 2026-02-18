# 5. Product Roadmap (2026)

> **Status:** Active
> **Last Updated:** February 18, 2026
> **Execution Horizon:** 12 Months

---

## 1. Roadmap Overview

| Quarter | Theme | Key Deliverables |
| :--- | :--- | :--- |
| **Q1 2026** | **Foundation & Parity** (Completed) | Platform Launch, Core Blocks, Stripe/Auth Basics, PWA. |
| **Q2 2026** | **Growth & Mobile** | Native Mobile App (iOS/Android), Push Notifications, Booking V2. |
| **Q3 2026** | **Ecosystem & API** | Public API, Zapier Integration, White-Label Mode for Agencies. |
| **Q4 2026** | **Fintech & Scale** | Native Wallet, Paid Newsletters, Team Collaboration. |

---

## 2. Detailed Milestones

### Q2 2026: Mobile Dominance
**Goal**: Shift users from mobile-web to native app for higher retention.
*   **Native App Wrapper**: Wrap PWA in Capacitor/React Native for Store presence.
*   **Push Notifications**: "New Lead", "New Booking", "Weekly Stat Summary".
*   **Booking V2**:
    *   Google Calendar / Outlook 2-way sync.
    *   Buffer times, multiple staff members.
    *   Deposit payments (prevent no-shows).

### Q3 2026: The "Open Platform"
**Goal**: Integrate with the wider local ecosystem.
*   **Zapier/Make Integration**: Allow leads to flow to external CRMs (HubSpot, AmoCRM) if needed.
*   **White-Label Agency Mode**: Allow agencies to resell lnkmx under their own brand/domain.
*   **Custom Domains**: Automated SSL provisioning for user-owned domains (`user.com` instead of `lnkmx.my/user`).

### Q4 2026: Fintech Layer
**Goal**: Monetize transactions, not just subscriptions.
*   **Link Wallet**: built-in wallet for receiving payments from clients.
*   **Digital Products**: Secure file delivery (eBooks, Presets) with expiration links.
*   **Paid Subscriptions**: Users can charge *their* followers for access to exclusive content (Patreon-lite).

---

## 3. Prioritization Framework (RICE)
We use the **RICE** score to prioritize features:
*   **R**each: How many users will this affect?
*   **I**mpact: How much will it increase conversion/retention?
*   **C**onfidence: How sure are we?
*   **E**ffort: Engineering weeks.

*Current Top Priority*: **Booking V2** (High Reach, High Impact for Beauty vertical).

---

## 4. Feature Specifications (Upcoming)

### Feature: Custom Domains
*   **User Story**: "As a Pro user, I want to attach `mypage.com` so I look more professional."
*   **Tech Spec**: Cloudflare for SaaS integration (SSL termination).
*   **Success Metric**: 10% of Pro users attach a custom domain.

### Feature: Team Collaboration
*   **User Story**: "As a steady business, I want my assistant to manage bookings without giving them my password."
*   **Tech Spec**: Invite system via email, Role-based access control (RBAC) in Supabase.
*   **Success Metric**: 5% of accounts invite a second member.
