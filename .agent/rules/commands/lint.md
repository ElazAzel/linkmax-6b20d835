---
description: Lint, strict types, i18n, and quality verification
---

# Quality Commands

```bash
npm run lint
npm run typecheck:strict
npm run i18n:check
npm run lint:i18n
npm run quality:check
```

Run `npm run quality:check` before merging broad source changes. Do not increase a quality baseline to hide a newly introduced issue; document and review any exceptional baseline change.
