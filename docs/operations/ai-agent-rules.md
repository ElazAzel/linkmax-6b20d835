# AI Agent Operating Guide

**Last reviewed:** 2026-07-25

The executable agent configuration is under `.agent/rules/`. This document is a compact orientation for maintainers and contributors.

## Required Workflow

1. Read the relevant source, tests, current operating document, and existing local changes.
2. State scope and acceptance criteria for multi-file or high-risk work.
3. Use the matching role and skill; do not invent tools, files, workflows, or provider access.
4. Implement the smallest safe change using existing patterns.
5. Run proportionate validation and report exact results and blockers.
6. Update current documentation when a command, contract, security control, workflow, or user-visible behavior changes.

## Role Selection

| Need | Role |
|---|---|
| Cross-layer sequencing | `orchestrator.md` |
| Implementation | `implementer.md`, `frontend_specialist.md`, `backend_specialist.md` |
| Design/architecture review | `arch-review.md`, `review.md`, `refactor.md` |
| Tests and acceptance | `qa_specialist.md`, `test_runner.md`, `verifier.md` |
| Security-sensitive work | `security_auditor.md` |
| Documentation update | `documenter.md` |

## Non-Negotiable Guardrails

- Do not discard unrelated user changes or rewrite applied migrations.
- Do not disclose, copy, or browser-expose privileged secrets.
- Server-side authorization and RLS are required for protected data and mutations.
- Historical audits provide context only; current facts belong in the platform snapshot and operating docs.
- A blocked external credential or provider setting must be reported, not guessed around.

See [.agent/README.md](../../.agent/README.md) and [Documentation Governance](../DOCUMENTATION_GOVERNANCE.md) for the complete local policy.
