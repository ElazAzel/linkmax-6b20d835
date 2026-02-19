# Technology Stack & References

> **Objective:** Centralized list of official documentation, guides, and best practices for the libraries used in lnkmx.

## 1. Core Framework

| Tool | Version | Docs | Purpose |
|---|---|---|---|
| **Vite** | 6.x | [Official Docs](https://vitejs.dev/guide/) | Build tool & Dev Server. |
| **React** | 18.x | [React Docs](https://react.dev/) | UI Library. |
| **TypeScript** | 5.x | [TS Handbook](https://www.typescriptlang.org/docs/) | Static Typing. |

## 2. UI & Styling

| Tool | Docs | Key Use Cases |
|---|---|---|
| **Tailwind CSS** | [tailwindcss.com](https://tailwindcss.com/docs) | Utility-first styling. Focus on `flex`, `grid`, and responsive prefixes (`md:`, `lg:`). |
| **shadcn/ui** | [ui.shadcn.com](https://ui.shadcn.com/docs) | Re-usable component blocks based on Radix UI. Accessible by default. |
| **Radix UI** | [radix-ui.com](https://www.radix-ui.com/primitives/docs/overview) | Headless primitives for complex components (Dialogs, Popovers) if shadcn needs extension. |
| **Framer Motion** | [framer.com/motion](https://www.framer.com/motion/) | Advanced animations (drag reorder, layout changes). Use conservatively for performance. |
| **Lucide React** | [lucide.dev](https://lucide.dev/icons/) | SVG Icon library. |

## 3. Backend & Data

| Tool | Docs | Key Use Cases |
|---|---|---|
| **Supabase** | [supabase.com/docs](https://supabase.com/docs) | Database, Auth, Storage, Edge Functions. |
| **PostgreSQL** | [postgresql.org/docs](https://www.postgresql.org/docs/) | Underlying DB. Use for complex SQL or indexing reference. |
| **React Query** | [tanstack.com/query](https://tanstack.com/query/latest) | Server state management. Handles caching, polling, and synchronization. |

## 4. Forms & Validation

| Tool | Docs | Key Use Cases |
|---|---|---|
| **React Hook Form** | [react-hook-form.com](https://react-hook-form.com/docs) | Form state management. Performant (uncontrolled components). |
| **Zod** | [zod.dev](https://zod.dev/) | Schema validation. Used for API responses and Form validation. |

## 5. Features & Utilities

| Tool | Docs | Key Use Cases |
|---|---|---|
| **dnd-kit** | [dndkit.com](https://dndkit.com/) | Accessible drag-and-drop for the Block Editor. |
| **Recharts** | [recharts.org](https://recharts.org/en-US) | Analytics charts (Line, Bar, Area). |
| **i18next** | [react.i18next.com](https://react.i18next.com/) | Localization (RU/EN/KK). |
| **Vaul** | [vaul.emilkowal.ski](https://vaul.emilkowal.ski/) | Mobile drawer/bottom sheet component. |
| **Sonner** | [sonner.emilkowal.ski](https://sonner.emilkowal.ski/) | Toast notifications. |

## 6. Testing

| Tool | Docs | Key Use Cases |
|---|---|---|
| **Playwright** | [playwright.dev](https://playwright.dev/) | E2E Testing. |
| **Vitest** | [vitest.dev](https://vitest.dev/) | Unit Testing. |

## Best Practices

### Supabase + React Query
- Always use `useQuery` for fetching data.
- Key format: `['entity', id, { filter }]`.
- Use Supabase Realtime for *critical* live updates, but rely on `invalidateQueries` for general CRUD Sync.

### shadcn/ui
- **Do not edit** `components/ui` files directly unless customizing the *design system*.
- Copy/paste components via CLI: `npx shadcn-ui@latest add [component]`.
