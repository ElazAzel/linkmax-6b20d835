# Documentation Governance

**Owner:** maintainers of the changed subsystem
**Last reviewed:** 2026-07-25

## Document Classes

| Class | Location | Rule |
|---|---|---|
| Current operating document | `README.md`, `docs/`, `.agent/` | Must match code and deployment configuration. |
| Architecture decision | `docs/ADR/` | Immutable after acceptance; supersede with a new ADR. |
| Roadmap or proposal | `docs/roadmap/`, `docs/product/`, root planning files | State assumptions, owner, and review date. |
| Historical record | `docs/audits/` | Do not rewrite it as current state. Add a newer report or link to a current document. |
| Generated artifact | `stats.html`, `public/sitemap.xml`, coverage or test output | Do not use as normative documentation. |

## Required Updates

Update the matching document in the same pull request when a change affects:

- setup, Node/npm version, environment variable, script, or local port;
- database schema, RLS, Edge Function, or public API;
- CI/CD workflow, deployment secret, release process, or runbook;
- authentication, authorization, data handling, or security control;
- externally visible product behavior that is described in current docs.

## Source Priority

When documentation and implementation disagree, use this order:

1. Executable configuration and migrations (`package.json`, workflow YAML, `supabase/migrations/`, runtime code).
2. Tests and CI configuration.
3. `docs/PLATFORM_SNAPSHOT.md` and operating documents.
4. ADRs.
5. Roadmaps, audits, and presentations.

## Review Checklist

```bash
# Check every local Markdown link; requires Node.js 22.
npm run docs:check

# Report Markdown files older than 60 days. This is an audit signal, not a failure criterion.
npm run docs:audit:freshness
```

The link validator checks current operating documents. It excludes historical audits, draft files, and vendored UI skills; it accepts relative links only and ignores external URLs, anchors, images, and intentional links to generated files. It exits non-zero for missing local targets.

## Agent and Skill Maintenance

- `.agent/rules/123role.md` is the shared operating contract.
- `.agent/rules/agents/` holds focused role prompts; these must not require tools or files that do not exist in this repository.
- `.agent/rules/skills/*/SKILL.md` holds reusable task procedures. Every skill must state when to use it, the current commands, guardrails, and verification.
- Keep role prompts concise. Put durable system knowledge in `docs/`, not in a prompt that will go stale.
