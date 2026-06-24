# Contributing to lnkmx

First off, thank you for considering contributing to lnkmx! It's people like you that make us the best platform for micro-businesses.

## 📜 Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all using our platform and contributing to our code. Please be respectful and considerate in all interactions.

## 🛠 Development Workflow

### 1. Branching Strategy
We use a simplified feature-branch workflow.
- **`main`**: The production-ready branch. Do not push directly here.
- **Feature Branches**: Create branches from `main` for new features or fixes.

**Naming Convention:**
- `feat/description`: New features (e.g., `feat/add-video-block`)
- `fix/description`: Bug fixes (e.g., `fix/auth-redirect`)
- `chore/description`: Maintenance, docs, configs (e.g., `chore/update-readme`)
- `refactor/description`: Code restructuring without behavior change

### 2. Commits
We follow the **Conventional Commits** specification.
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Example:**
```bash
git commit -m "feat: add instagram integration to social block"
```

### 3. Pull Requests
1. Push your branch to the repository.
2. Open a Pull Request against `main`.
3. Provide a clear title and description of your changes.
4. Link any relevant issues (e.g., `Closes #123`).
5. Wait for a code review from a team member.

## ⚙️ Environment & Supabase

- **`.env` is gitignored** — never commit it. Copy `.env.example` and fill in real values.
- **Supabase clients** (`src/platform/supabase/client.ts`, `src/integrations/supabase/client.ts`) use **lazy initialization via Proxy**. The client isn't created until the first method call (`.from()`, `.auth()`). This prevents crashes on modules that import but don't directly use Supabase.
- **Env vars are baked at build time** for production (`VITE_*`). Rebuild after any `.env` change.

## 🎨 Design System

This project uses the **Liquid Glass** design system. Before making UI changes:

1. Read [`DESIGN.md`](./DESIGN.md) for token reference
2. Use semantic CSS variables (`--primary`, `--muted`, `--card`) instead of hardcoded colors
3. Prefer `glass-*` and `qb-*` utility classes for cards and surfaces
4. Use semantic text classes (`text-display`, `text-hero`, `text-section-title`, etc.)
5. Import icons from `lucide-react` as **named exports**, not deep imports:
   ```tsx
   // ✅ Correct
   import { Menu, X } from 'lucide-react';
   // ❌ Wrong
   import Menu from 'lucide-react/dist/esm/icons/menu';
   ```
6. Never use inline `fontFamily` styles — fonts are set globally via CSS variables
7. Always respect `prefers-reduced-motion`

## 📐 Coding Standards

### TypeScript & React
- **Strict Mode**: We use strict TypeScript. No `any` unless absolutely necessary.
- **Functional Components**: Use React Functional Components with Hooks.
- **Naming**:
    - Components: `PascalCase.tsx`
    - Hooks: `camelCase.ts` (prefix with `use`)
    - Utilities: `kebab-case.ts`
- **Imports**: Use absolute imports where possible (e.g., `@/components/ui/button` instead of `../../components/ui/button`).

### Styling
- We use **Tailwind CSS**.
- Avoid inline styles.
- Use `cn()` utility for conditional class merging.

### Imports
- **Lucide icons**: Always use named imports from `lucide-react` (e.g. `import { Heart } from 'lucide-react'`). Never use deep path imports (`lucide-react/dist/esm/icons/xxx`).

### Linting & Formatting
Run these commands before committing to ensure your code meets our standards:

```bash
# Check for linting errors
npm run lint

# Check for type errors
npm run typecheck
```

## 🧪 Testing

We value stability. Please add tests for significant logic changes.

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run e2e
```

## 📝 Documentation
If you change a feature or API, please update the corresponding documentation in `docs/` and the logic in `README.md`.

---
Happy Coding! 🚀

## ✍️ UI Microcopy Review Checklist
When adding or changing UI text, verify:
- [ ] Text uses existing i18n keys where possible (`common.*` first for shared patterns).
- [ ] Error/empty/CTA/confirmation messages are aligned with the glossary in `docs/implementation/microcopy-glossary.md`.
- [ ] Tone is concise, action-oriented, and consistent across auth, editor, billing/limits, and CRM flows.
- [ ] Buttons and notifications use the same wording for identical actions (e.g., cancel, save, upgrade, retry).
- [ ] New text keys include at least `en` and `ru` translations in `src/i18n/locales/*.json`.

