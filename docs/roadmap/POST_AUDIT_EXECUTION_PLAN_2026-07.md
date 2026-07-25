# Execution Plan: Reliability, Security, and Product Delivery

**Created:** 2026-07-25
**Horizon:** 12 weeks
**Decision source:** current repository audit, workflow configuration, dependency audit, and documentation review.

## Outcomes

1. Every pull request has reproducible, green required checks.
2. Deployments fail only for actionable configuration or code errors and have a documented recovery path.
3. Authentication, account scope, RLS, and payment-adjacent mutations have explicit trusted-side tests.
4. Product work can proceed on a smaller, measured backlog rather than an unbounded quality baseline.

## Phase 0: Restore Delivery Confidence (Week 1)

| Work | Owner | Exit criterion |
|---|---|---|
| Reconcile i18n literal baseline with intentional UI changes | Frontend + QA | `npm run quality:check` is green without suppressing new literals. |
| Configure required GitHub environments and deployment secrets | DevOps | Supabase and Cloudflare workflow dispatches authenticate successfully. |
| Protect `main` with quality, unit, build, and E2E requirements | Maintainer | Direct merge cannot bypass required status checks. |
| Add a post-deploy smoke checklist | DevOps | Homepage, `/auth`, one public page, and affected function/worker are checked. |

## Phase 1: Security and OWASP Workstream (Weeks 1-4)

| OWASP area | Work | Exit criterion |
|---|---|---|
| Broken access control | Map high-risk tables/RPCs/functions; add owner/non-owner RLS tests. | No critical mutation relies on client-only authorization. |
| Cryptographic failures | Inventory secret stores, remove any unsafe client exposure, add rotation owner/runbook. | No privileged secret appears in source, `VITE_*`, artifacts, or docs. |
| Injection | Audit public Edge Function/RPC payloads and dynamic query construction. | Inputs have schema validation and database access is parameterized. |
| Insecure design | Write abuse cases for auth linking, payment callbacks, booking, and public forms. | Each flow has trusted-side authorization and idempotency decisions. |
| Security misconfiguration | Review CSP/CORS, OAuth redirect allow-list, GitHub/Cloudflare/Supabase permissions. | Configuration is least-privilege and documented. |
| Vulnerable components | Triage production `npm audit --omit=dev` findings by reachability. | Patches merged or breaking upgrades scheduled with owner/test plan. |
| Authentication failures | Test email/OAuth/provider linking, redirects, session expiration, and account switching. | No arbitrary redirect, user enumeration leak, or client-only identity merge. |
| Software/data integrity | Enforce lockfile CI, migration review, and dependency update review. | Reproducible `npm ci`; append-only migration discipline. |
| Logging/monitoring | Redact PII/secrets; define deploy and auth alert signals. | Incidents can be diagnosed without collecting sensitive payloads. |
| SSRF and external requests | Audit webhooks, URL fetches, and media/proxy endpoints. | Destination validation and timeouts exist where external URLs are accepted. |

## Phase 2: Test Architecture (Weeks 2-5)

1. Split Playwright into `smoke`, authenticated staging, and visual suites.
2. Replace personal/demo account dependencies with disposable staging fixtures and bounded credentials.
3. Run smoke on pull requests; run authenticated/visual suites nightly and before release.
4. Add focused coverage for auth, editor block insertion, public page rendering, account switching, booking conflict, and payment/webhook idempotency.
5. Publish test ownership and current flaky-test status in the testing document.

**Exit criterion:** a pull-request failure produces a reproducible command and useful artifact; sensitive suites do not rely on a personal account.

## Phase 3: Quality and Performance Debt (Weeks 3-8)

1. Reduce lint, i18n, and unused-code baselines in small scoped pull requests. Baselines may only decrease unless an approved exception includes cause and expiry.
2. Remove unused exports/modules based on Knip evidence and build/test verification.
3. Split heavy route-specific dependencies such as spreadsheet/PDF/export modules and measure bundle impact.
4. Establish Web Vitals and bundle budget measurements for public pages and dashboard entry.
5. Test Capacitor sync after Vite, routing, CSP, or environment changes.

**Exit criterion:** debt trends down each release and user-facing performance changes have measurements, not only qualitative claims.

## Phase 4: Product Delivery Discipline (Weeks 5-12)

For every planned Business Zone, commerce, automation, or AI feature:

1. Create a short spec: user, problem, permission model, data contract, abuse cases, metric, rollout, and rollback.
2. Implement behind a feature flag or constrained cohort when risk is material.
3. Ship schema/RLS, trusted API, UI, telemetry, and tests as one vertical slice.
4. Review results after a defined interval and either expand, revise, or retire the feature.

Priority order: account/auth reliability, page editor and public publishing, CRM/lead workflow, booking/events, commerce/payments, automation/AI enhancements.

## Governance

- Weekly: delivery health, CI failures, dependency/security queue, flaky tests.
- Biweekly: quality baseline trend, product experiment outcomes, documentation freshness.
- Per release: OWASP change review for affected areas, secret/access review, smoke evidence, and changelog.
- Owners must update `docs/PLATFORM_SNAPSHOT.md` when a phase changes system-wide delivery state.
