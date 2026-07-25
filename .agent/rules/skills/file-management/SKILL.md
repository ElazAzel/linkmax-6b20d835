---
name: file-management
description: Repository file hygiene, generated artifacts, and safe workspace maintenance.
---

# File Management

Use for generated assets, cleanup, file moves, or repository organization.

1. Check `git status` and identify user-owned changes before acting.
2. Prefer targeted moves/edits over destructive cleanup.
3. Keep generated output out of commits unless it is intentionally tracked (for example a sitemap or approved visual fixture).
4. Update imports, links, scripts, and documentation after a move.
5. Validate with `git diff --check` and the relevant build or link check.
