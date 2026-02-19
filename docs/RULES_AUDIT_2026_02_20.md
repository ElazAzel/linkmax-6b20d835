# Rules & Principles Audit Report (2026-02-20)

## Objective
To conduct an audit of the current project state against the principles and rules defined in `.agents`, `.github/workflows`, and `docs`.

## Assessment of Principles & Rules Satisfaction

### 1. CI/CD Workflows (`.github/workflows`)
- **Rule:** The CI pipeline (`ci.yml`) mandates strict checks: linting (`npm run lint`), i18n rules (`npm run lint:i18n`), TypeScript compilation (`npm run typecheck`), dependency quality gates (`npm run quality:gate`), and unit tests (`npm test -- --run`).
- **Reality Check:** 
  - 🟢 **Success:** Lint, i18n, TypeCheck, and quality gates are appropriately defined in `package.json` and map correctly to the CI config.
  - 🔴 **Violation:** The CI workflow expects to run unit tests via `npm test -- --run`. However, the `"test"` script is completely missing from `package.json` (though `vitest` is in `devDependencies`). This causes the CI job to fail or falsely report on the test step.

### 2. Frontend Rules (`.agents/rules/frontend.md` & `CONTRIBUTING.md`)
- **Rule:** Strict Component structure (`src/components`, `src/pages`, `src/hooks`).
  - 🟢 **Success:** The project strictly follows this structure with distinct, populated directories.
- **Rule:** Strict TypeScript; no `any` unless absolutely necessary.
  - 🟢 **Success:** Enforced deeply via `tsconfig.strict.json` and strict compiler options.
- **Rule (Design):** Divider & Social Blocks MUST NOT have borders/frames.
  - 🟢 **Success:** Verified `SocialsBlock.tsx` and `SeparatorBlock.tsx`. `SocialsBlock` properly uses class `glass-card` without borders, and `SeparatorBlock` manages distinct divider behavior cleanly without rule violation.

### 3. Backend & Edge Functions Rules (`.agents/rules/backend.md`)
- **Rule:** Edge functions must use standard `corsHeaders` and validate inputs safely.
  - 🟢 **Success:** Verified edge functions across `supabase/functions/` (e.g., `telegram-bot-webhook`, `translate-content`, `validate-telegram`, etc.). They all actively import and utilize a centralized `corsHeaders` effectively.

### 4. Architectural Discrepancy (`PLATFORM_SNAPSHOT.md` vs Codebase Reality)
- **Rule:** Documentation must reflect the single source of truth for architecture.
- **Reality Check:**
  - 🔴 **Violation:** `PLATFORM_SNAPSHOT.md` asserts the platform runs on **Next.js 14 (App Router)**. However, `package.json` runs a Vite build (`vite preview`, `vite build`) using `"name": "vite_react_shadcn_ts"`, and misses Next.js entirely from its dependencies. The codebase holds hybrid artifacts (`src/app/layout.tsx` alongside `index.html` at the root and `vite.config.ts`), creating a significant documentation vs infrastructure mismatch.

## Conclusion & Next Steps

The platform largely respects the intended styling, backend structure, and coding conventions defined by the AI agents framework and established rules. 

However, two critical mismatches hold the project back from total compliance:
1. **[FIXED]** Reconcile the `Next.js` vs `Vite` architectural reality. The remaining `src/app/` directories and Next.js configurations were removed, and `PLATFORM_SNAPSHOT.md` was updated strictly to Vite architecture. 
2. **[FIXED]** Add `"test": "vitest"` into `package.json` so the GitHub Action completes successfully.
