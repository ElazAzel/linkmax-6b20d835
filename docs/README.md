# LinkMAX Documentation

**Current snapshot:** 2026-07-25
**Repository version:** 3.1.0
**Runtime baseline:** Node.js 22

This page is the documentation entry point. It separates operational instructions from historical records so a reader does not mistake an old audit or product proposal for the current implementation.

## Start Here

1. [Platform snapshot](PLATFORM_SNAPSHOT.md): current architecture, delivery state, and known operational gaps.
2. [Developer quickstart](getting-started/DEVELOPER-QUICKSTART.md): local setup and validation commands.
3. [Documentation governance](DOCUMENTATION_GOVERNANCE.md): ownership, freshness rules, and archival policy.
4. [AI agent rules](operations/ai-agent-rules.md): the compact human-readable workflow for local agents.

## Current Operating Documents

| Area | Primary document |
|---|---|
| Architecture | [Architecture guide](architecture/COMPREHENSIVE_PLATFORM_GUIDE.md) |
| Database and API | [Database schema guide](implementation/DATABASE_SCHEMA_GUIDE.md), [API](implementation/API.md) |
| Local development | [Local development runbook](deployment/runbooks/LOCAL_DEVELOPMENT.md) |
| CI/CD and secrets | [GitHub Actions setup](deployment/GITHUB_ACTIONS_SETUP.md) |
| Testing | [Testing strategy](testing/TESTING.md) |
| Page customization | [Page customization](features/PAGE_CUSTOMIZATION.md) |
| Smart links | [Smart links](features/SMART_LINKS.md) |
| Security | [Security baseline](security/SECURITY.md) |
| Product direction | [Strategic plan](product/STRATEGIC_PLAN_2026.md), [execution plan](roadmap/POST_AUDIT_EXECUTION_PLAN_2026-07.md) |
| OSS-informed delivery | [Reference implementation plan](roadmap/OSS_REFERENCE_IMPLEMENTATION_PLAN.md) |
| Agent configuration | [.agent/README.md](../.agent/README.md) |

## Historical Material

Files under [audits/](audits/) capture the state at their stated date. They are evidence and context, not a release gate or implementation source. Use the snapshot and operating documents above for current decisions.

Plans, proposals, pitch material, and market research under `product/`, `roadmap/`, `presentation/`, and repository-root planning files are decision inputs. Their status must be checked before implementation.

## Documentation Rules

- Update an operating document whenever its command, secret, deployment path, external contract, or user-visible behavior changes.
- Use explicit dates and verified facts. Do not claim that a control is implemented without a code, migration, configuration, or test reference.
- Keep secrets out of Markdown, examples, commits, screenshots, and generated reports.
- Add new enduring technical decisions as an ADR; keep task notes and point-in-time audits separate.
- Validate internal Markdown links before merging with the command in [DOCUMENTATION_GOVERNANCE.md](DOCUMENTATION_GOVERNANCE.md).
