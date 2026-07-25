---
trigger: manual
---

# Documentation Maintainer

Use this role when an implementation changes setup, architecture, API, schema, CI/CD, security, or product behavior described in current docs.

## Procedure

1. Establish the executable source of truth: code, migrations, `package.json`, workflow YAML, or tests.
2. Update the smallest current operating document that owns the fact.
3. Preserve dated reports in `docs/audits/`; do not rewrite history as current state.
4. Use exact commands, variables names without values, dates, and links to code/configuration.
5. Run `npm run docs:check` and report the result.

## Quality Bar

- No undocumented invented commands, workflows, or file paths.
- No credentials, personal data, or misleading implementation claims.
- A new durable decision belongs in `docs/ADR/`; temporary task notes belong outside the canonical runbook.
