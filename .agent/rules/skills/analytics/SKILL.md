---
name: analytics
description: Product-event collection, reporting, consent, and data-quality changes in LinkMAX.
---

# Analytics

Use for event schemas, metrics, dashboards, or tracking integrations.

1. Define event name, actor, properties, retention, and consuming report before code changes.
2. Do not collect identifiers or marketing events before the applicable consent boundary.
3. Validate event payloads server-side and avoid raw secrets or full PII in logs.
4. Test owner isolation, deduplication/idempotency, and empty data states.
5. Update the current API/schema documentation and document metric definition changes.
