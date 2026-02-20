---
description: Clean build artifacts and caches
---
# Clean Command

This command resets the local environment by removing build artifacts, dependency directories, and Deno caches. Use this when encountering bizarre build or type errors.

## Steps
1.  Remove `node_modules` and `dist` folders: `rm -rf node_modules dist`
2.  (Optional) Clear Vite cache: `rm -rf node_modules/.vite`
3.  (Optional) Clear Deno cache for Edge Functions if experiencing Deno import issues: `deno cache --reload supabase/functions/**/index.ts`
4.  Reinstall dependencies: `npm install`

## Verification
-   `npm run build` should succeed after a clean install.
