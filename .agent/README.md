# LinkMAX Agent Configuration

This directory contains repository-local operating rules for AI-assisted work. It is intentionally separate from editor-global skills and does not grant access to credentials or production systems.

## Read Order

1. [Shared role contract](rules/123role.md)
2. [Collaboration rules](rules/rules/collaboration.md)
3. The role file in [rules/agents/](rules/agents/)
4. The relevant task skill in [rules/skills/](rules/skills/)
5. Current implementation documents in [docs/](../docs/README.md)

## Structure

| Path | Purpose |
|---|---|
| `rules/123role.md` | Shared safety, implementation, and verification contract. |
| `rules/rules/` | Coding, collaboration, backend, frontend, and tool conventions. |
| `rules/commands/` | Current local command references. |
| `rules/agents/` | Focused roles for planning, implementation, QA, security, and review. |
| `rules/skills/` | Reusable procedures for project domains. |

## Operating Rules

- Inspect the relevant code and current docs before editing.
- Work with existing user changes; do not revert or delete unrelated work.
- Do not invent files, commands, workflows, tools, or environments that are absent from this repository.
- Make the narrowest safe change, add proportionate verification, and report the exact commands run.
- Treat `docs/audits/` as historical context. Use `docs/PLATFORM_SNAPSHOT.md` and the current runbooks for the present state.
- Never print, commit, or move secrets into browser-visible variables.

Repository-local skills are maintained under the policy in [docs/DOCUMENTATION_GOVERNANCE.md](../docs/DOCUMENTATION_GOVERNANCE.md).
