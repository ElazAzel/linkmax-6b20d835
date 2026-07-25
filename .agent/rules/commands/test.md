---
description: Current LinkMAX test and quality commands
---

# Test Commands

```bash
npm run test
npm run test:ci
npm run e2e
npm run e2e:ci
npm run lint
npm run typecheck:strict
npm run quality:check
```

For a focused browser flow:

```bash
npx playwright test e2e/<spec>.ts --project=chromium
```

Playwright starts the local Vite server automatically. Install browser binaries on a new machine with `npx playwright install`.
