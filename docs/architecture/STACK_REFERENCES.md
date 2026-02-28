# Technology Stack & References

> **Objective:** Centralized list of official documentation, guides, and best practices for the libraries used in lnkmx.
> **Last Updated:** February 28, 2026

## 1. Core Framework

| Tool | Version | Docs | Purpose |
|---|---|---|---|
| **Vite** | 6.x | [Official Docs](https://vitejs.dev/guide/) | Build tool & Dev Server (port 8080). |
| **React** | 18.3.x | [React Docs](https://react.dev/) | UI Library. |
| **TypeScript** | 5.8.x | [TS Handbook](https://www.typescriptlang.org/docs/) | Static Typing. |
| **React Router** | 6.30.x | [React Router](https://reactrouter.com/) | SPA routing, lazy-loaded routes. |

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
| **i18next** | [react.i18next.com](https://react.i18next.com/) | Localization (16 languages: RU, EN, KK primary; DE, UK, UZ, BE, ES, FR, IT, PT, ZH, TR, JA, KO, AR lazy). |
| **Vaul** | [vaul.emilkowal.ski](https://vaul.emilkowal.ski/) | Mobile drawer/bottom sheet component. |
| **Sonner** | [sonner.emilkowal.ski](https://sonner.emilkowal.ski/) | Toast notifications. |

## 6. Testing & Quality

| Tool | Docs | Key Use Cases |
|---|---|---|
| **Playwright** | [playwright.dev](https://playwright.dev/) | E2E Testing (baseURL: localhost:8080). |
| **Vitest** | [vitest.dev](https://vitest.dev/) | Unit Testing. |
| **Knip** | [knip.dev](https://knip.dev/) | Unused code & dependency analysis. |
| **dependency-cruiser** | [npm](https://www.npmjs.com/package/dependency-cruiser) | Cycle & layer validation. |

---

## 🏗️ Advanced Resources & Best Practices

### Supabase & RLS
- **[Awesome Supabase](https://github.com/supabase-community/awesome-supabase)**: Curated list of libraries, tools, and examples.
- **Security Guide**:
  - Always enable RLS on new tables.
  - Use `auth.uid()` in policies.
  - Index columns used in RLS policies for 10x performance.
  - *Never* expose `service_role` keys on the client.

### TanStack Query (React Query)
- **[TkDodo's Blog](https://tkdodo.eu/blog/practical-react-query)**: The "unofficial bible" of React Query patterns.
- **Best Practices**:
  - **Dependencies**: Include all variables in the Query Key: `['todos', { status, page }]`.
  - **Staleness**: Defaults in app: `staleTime: 5 * 60 * 1000`, `gcTime: 10 * 60 * 1000`, `retry: 2`, `refetchOnWindowFocus: false`.
  - **Optimistic Updates**: Use for immediate UI feedback on mutations (like "Like" buttons or drag-and-drop).

### Tailwind CSS Architecture
- **[Tailwind Best Practices](https://tailwindcss.com/docs/reusing-styles)**: Official guide on avoiding "class soup".
- **Design System**: Use `tailwind.config.ts` for colors/spacing tokens rather than hardcoding hex values.
- **Sorting**: We use `prettier-plugin-tailwindcss` to enforce consistent class ordering.

### shadcn/ui Patterns
- **Architecture**:
  - Treat `components/ui` as specific source code you own, not a node_module.
  - Use `class-variance-authority` (CVA) for complex component variants (e.g., Button sizes/colors).
- **Extending**: Compose primitives (e.g., `Dialog`) into larger business components (e.g., `EditProfileDialog`) rather than modifying the primitive itself.

### Performance (Framer Motion)
- **[Layout Animations](https://www.framer.com/motion/layout-animations/)**: Use `layout` prop for smooth FLIP animations during reordering.
- **Optimization**:
  - Prefer animating `transform` and `opacity` (GPU accelerated).
  - Avoid animating `width/height` (triggers layout thrashing) unless necessary.
  - Use `WillChange` component or prop if animation is stuttering.

### Forms (React Hook Form + Zod)
- **Schema Validation**: Define schema *outside* the component to prevent re-creation on render.
- **Complex Validation**: Use `zod.superRefine()` for cross-field validation (e.g., checking if `confirmPassword` matches `password`).
- **Async Validation**: Check unique usernames/emails against Supabase asynchronously within the resolver or `onBlur`.

### Accessibility (dnd-kit)
- **Keyboard Support**: `dnd-kit` has great defaults, but ensure your sortables are focusable.
- **Screen Readers**: It uses Live Regions to announce movements. Test this flow if modifying core sensor logic.
