# 6. Operational Handbook

> **Status:** Active
> **Last Updated:** February 28, 2026
> **Scope:** Internal Procedures, Compliance, Support

---

## 1. Team Structure & Roles
*(Lean Team Structure for Seed Stage)*

*   **Product/Eng Lead**: Owns Roadmap, Architecture, Release Quality.
*   **Growth/Marketing**: Owns CAC, Content, Partnerships.
*   **Operations/Support**: Owns Customer Success, Legal, Finance.

---

## 2. Customer Support Protocols
**Tooling**: Combined Inbox (Email + Telegram Bot).
**SLA**: < 4 hours response time (Business Hours).

### Common Scenarios
*   **Refunds**: "No questions asked" policy within 14 days. Process via Stripe/Robokassa dashboard.
*   **Bug Reports**:
    1.  Reproduce issue.
    2.  Log in GitHub Issues with `bug` label.
    3.  Notify user of "Received" -> "In Progress" -> "Fixed".
*   **Feature Requests**: Log in "Product Ideas" notions DB. Do not promise timelines.

---

## 3. Content Moderation & Safety
**Policy**: We host user-generated content (UGC), so we must be vigilant.

### Prohibited Content (Zero Tolerance)
*   Scams / Phishing / Fake giveaways.
*   Adult/NSFW content (unless legally compliant and gated - *TBD*).
*   Hate speech / Terrorism.

### Moderation Workflow
1.  **Automated**: Google Vision API scans uploaded images for NSFW. NLP scans text for keywords.
2.  **Report-Based**: "Report this page" link on every public footer.
3.  **Action**:
    *   First strike: Warning + Content Removal.
    *   Severe violation: Immediate Account Ban + IP Block.

---

## 4. Legal & Compliance
**Jurisdiction**: Republic of Kazakhstan (AIFC law capable).

### Data Privacy
*   **GDPR/CCPA**: Users own their data.
*   **Data Export**: Use the `Export Data` button in User Settings (generates JSON dump).
*   **Data Deletion**: `Delete Account` is permanent and wipes Supabase records via Cascade Delete.

### Terms of Service (Highlights)
*   Users are responsible for content.
*   We reserve the right to ban for TOS violations.
*   Uptime SLA is "Best Effort" (Standard for free/pro tiers).

---

## 5. Incident Response (DevOps)
**Severity Levels**:
*   **SEV-1 (Critical)**: Site Down, Data Loss, Security Breach.
    *   *Action*: Wake up Engineer. Update Status Page. Pivot all resources to fix.
*   **SEV-2 (Major)**: Core feature broken (e.g., Bookings not saving).
    *   *Action*: Fix within 24h.
*   **SEV-3 (Minor)**: Visual glitch, typo.
    *   *Action*: Fix in next sprint.

**Status Page**: Hosted externally (e.g., Atlassian Statuspage).
