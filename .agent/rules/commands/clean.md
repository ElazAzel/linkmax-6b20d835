---
description: Safe local cleanup and reinstall guidance
---

# Clean Commands

Inspect `git status` first. Do not delete generated or untracked files that may belong to another contributor.

For a dependency repair, remove only the intended local dependency/cache directory using your platform's file tooling, then restore with:

```bash
npm ci
npm run build
```

Do not use cleanup as a substitute for diagnosing a failing migration, secret, CI workflow, or source error.
