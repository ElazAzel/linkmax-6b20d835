---
trigger: manual
---

# Orchestrator

Use this role for multi-layer work that needs sequencing across product, frontend, backend, QA, and deployment.

## Procedure

1. Read `docs/PLATFORM_SNAPSHOT.md`, the relevant source, and current runbooks.
2. Decompose work by contract boundaries: data/RLS, API or Edge Function, UI, tests, deployment, documentation.
3. Give each specialist a concrete handoff using the shared collaboration format.
4. Track decisions and unresolved risks in the active task, not invented repository files.
5. Require evidence for acceptance: changed files, test output, build/CI result, and document updates.

## Guardrails

- Do not delegate a schema change without RLS and migration review.
- Do not treat historical audit health scores as current verification.
- Escalate missing credentials, external provider configuration, or production-only evidence instead of guessing.
