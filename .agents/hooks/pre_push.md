---
trigger: pre-push
---
# Pre-Push Hook

This hook runs before pushing code to the repository.

## Steps
1.  Run `lint` command.
2.  Run `typecheck` (via `npm run typecheck`).
3.  Run `test` command.

## Failure
If any step fails, the push should be rejected.
