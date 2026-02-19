# React Skill

## Description
Expertise in modern React development using Vite, TypeScript, Tailwind CSS, and Shadcn UI.

## Capabilities
-   Create accessible, responsive UI components.
-   Manage complex state with Hooks and React Query.
-   Optimize performance (Code splitting, memoization).
-   Implement secure routing and auth flows.
-   Write unit and E2E tests.

## Key Files
-   `src/components/*`
-   `src/hooks/*`
-   `src/pages/*`
-   `vite.config.ts`

## Common Commands
-   `npm run dev`: Start dev server.
-   `npm run build`: Production build.
-   `npm run test`: Run unit tests.

## Workflows

### Creating a New Component
1.  Check if a similar Shadcn UI component already exists (`src/components/ui`) or can be added via `npx shadcn-ui@latest add <component>`.
2.  If not, create it in `src/components/` (or a feature-specific subfolder).
3.  Name the file `PascalCase.tsx`.
4.  Use `export const ComponentName = () => { ... }` (named exports preferred).
5.  Use Tailwind CSS for styling. Do not use raw CSS or inline styles unnecessarily.
