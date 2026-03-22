# General Project Rules

1. **TypeScript Strict Mode**: Always use strict typing. Avoid `any` unless absolutely necessary.
2. **File Naming**:
   - React Components: `PascalCase.tsx` (e.g., `MyComponent.tsx`)
   - Hooks: `camelCase.ts` (e.g., `useMyHook.ts`)
   - Utilities: `kebab-case.ts` (e.g., `date-utils.ts`)
3. **Path Aliases**: Always use `@/` for imports from `src/`.
4. **Formatting**: Use Prettier (via ESLint) for formatting.
5. **Environment Variables**:
   - Frontend: `VITE_` prefix.
   - Backend (Edge Functions): `Deno.env.get()`.
6. **Error Handling**:
   - Frontend: Use `toast.error()` for user feedback. Report to Sentry in production.
   - Backend: Return proper HTTP status codes. Log errors.
7. **UI & Styling**:
   - Use **Shadcn UI** components whenever possible.
   - Use **Tailwind CSS** for styling.
   - **No raw CSS** unless strictly required for complex animations or overrides not feasible in Tailwind.
8. **Communication**:
   - **Language**: All communication must be in **Russian**.
   - **Pre-execution Protocol**: Always ask clarifying questions and provide suggestions/alternatives to the user's request. Wait for approval of the approach before starting implementation.
