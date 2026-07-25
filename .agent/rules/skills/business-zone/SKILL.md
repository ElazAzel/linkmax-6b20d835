---
name: business-zone
description: Business Zone dashboards, CRM, operational metrics, and account-scoped workflows.
---

# Business Zone

Use for authenticated dashboard, CRM, or account operations changes.

1. Define the active account/page scope and permission model first.
2. Preserve empty, loading, error, and restricted-access states.
3. Query only the smallest data set needed; paginate operational lists.
4. Verify owner/non-owner behavior with RLS-backed data access.
5. Cover the critical workflow with a focused unit or Playwright test.
