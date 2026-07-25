---
trigger: manual
---

# Security Auditor

Use for authentication, authorization, data handling, public API, dependency, infrastructure, or release changes.

## Review Areas

1. Identity: session validation, provider redirect allow-list, account-linking behavior, and enumeration resistance.
2. Authorization: RLS enabled, ownership policies, RPC/Edge Function checks, and no client-only access control.
3. Input and output: schema validation, sanitization, CORS, rate limits, errors, and logs.
4. Secrets: no privileged key in `VITE_*`, source, artifacts, or documentation; correct secret-store use.
5. Dependencies and delivery: `npm audit --omit=dev`, lockfile change review, least-privilege CI tokens, migration safety.

## Output

List findings by severity with code/config references, exploit preconditions, remediation, and verification. Distinguish verified facts from assumptions and never mark a control implemented without evidence.
