# General Project Rules

1.  **TypeScript Strict Mode**: Always use strict typing. Avoid `any` unless absolutely necessary.
2.  **File Naming**:
    -   React Components: `PascalCase.tsx` (e.g., `MyComponent.tsx`)
    -   Hooks: `camelCase.ts` (e.g., `useMyHook.ts`)
    -   Utilities: `kebab-case.ts` (e.g., `date-utils.ts`)
3.  **Path Aliases**: Always use `@/` for imports from `src/`.
4.  **Formatting**: Use Prettier (via ESLint) for formatting.
5.  **Environment Variables**:
    -   Frontend: `VITE_` prefix.
    -   Backend (Edge Functions): `Deno.env.get()`.
6.  **Error Handling**:
    -   Frontend: Use `toast.error()` for user feedback. Report to Sentry in production.
    -   Backend: Return proper HTTP status codes. Log errors.
