# Contributing Guide

Thanks for contributing! This guide keeps changes consistent and easy to review.

## Project Structure

- `src/pages/` — route-level screens.
- `src/components/` — reusable UI, blocks, and page sections.
- `src/hooks/` — UI orchestration and async state.
- `src/use-cases/` — application workflows.
- `src/services/` — business logic that spans multiple modules.
- `src/repositories/` — data access (Supabase-backed implementations).
- `src/platform/` — external integrations (e.g., Supabase client + types).
- `src/lib/` — shared utilities.
- `src/testing/` — test setup and fixtures.

## Naming & Organization

- Prefer clear, descriptive names (`UserProfile`, `useUserProfile`, `SavePageUseCase`).
- Keep React components in `PascalCase.tsx` and hooks in `useX.ts`.
- Avoid deeply nested relative imports—use the `@/` alias when possible.

## Adding a Feature

1. Add UI pieces in `components/` or `pages/`.
2. Put orchestration in a hook (`hooks/`).
3. Add workflow logic in `use-cases/` if the flow spans multiple steps.
4. Use services for shared business logic that spans repositories.
5. Create or extend repositories for new data access needs.

## Code Style

- Follow the existing ESLint + Prettier configuration.
- Keep functions focused; prefer small helpers over long inlined logic.
- Add comments only when the **why** is not obvious.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run analyze:deps
npm run analyze:cycles
npm run analyze:layers
npm run analyze:unused
npm run quality:gate
npm run i18n:check
npm run lint:i18n
npm run e2e
```
