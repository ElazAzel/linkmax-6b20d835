# Developer Quickstart

> **Last Updated:** July 1, 2026 (Phase 46 Docs Sync)


## Prerequisites

- **Node.js**: v20 or higher (v22 recommended)
- **npm**: v10 or higher
- **Git**


## Setup

1. **Clone the repository**:

    ```bash
    git clone https://github.com/ElazAzel/linkmax-6b20d835.git linkmax
    cd linkmax
    ```

2. **Install dependencies**:

    ```bash
    npm install
    # If this fails, see Troubleshooting below
    ```

3. **Configure environment** (optional for first run):
   - Copy `.env.example` to `.env` (in project root)
   - Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (and optionally `VITE_APP_DOMAIN`)

4. **Start development server**:

    ```bash
    npm run dev
    ```
   App runs at **http://localhost:8080**

## Key commands

- `npm run build` — production build
- `npm run test` — unit tests (Vitest)
- `npm run e2e` — E2E tests (Playwright; ensure dev server is on port 8080 or start via Playwright)
- `npm run typecheck` / `npm run typecheck:strict` — TypeScript check
- `npm run lint` — ESLint
- `npm run mobile:sync` — sync web build to Capacitor (iOS/Android)

## Project Structure

- `src/components/`: UI components (blocks, dashboard-v2, zones, shared)
- `src/pages/`: Route-level components
- `src/hooks/`: Custom React hooks (70+)
- `src/services/`: Service-Pattern logic (apiKeys.ts, pages.ts, user.ts, etc.)
- `src/lib/`: Utilities, SEO, exports
- `src/i18n/locales/`: Translation files (16 languages)
- `scripts/`: i18n management and build utilities


## Troubleshooting

### "Cannot find module 'react', 'lucide-react', etc."

**Cause:** dependencies are not installed.
**Fix:**

1. Open your terminal in the project root.
2. Run `npm install`.
3. If `npm` command is not found, download and install Node.js from [nodejs.org](https://nodejs.org/).

### "npm command not found"

**Cause:** Node.js is not installed or not in your system PATH.
**Fix:**

1. Install Node.js LTS version.
2. Restart your terminal/IDE.
3. Verify with `node -v` and `npm -v`.

### IDE Errors despite successful install

**Fix:**

1. Open Command Palette (Ctrl+Shift+P).
2. Type "TypeScript: Restart TS Server".

## Next steps

- **[Comprehensive Platform Guide](../architecture/COMPREHENSIVE_PLATFORM_GUIDE.md)** — полное описание платформы, модулей и блоков.
- **[Documentation index](../README.md)** — единая навигация по разделам `docs/` (индекс и роли).
- **[Platform snapshot](../PLATFORM_SNAPSHOT.md)** — актуальный снимок платформы (SSOT).
- **[Contributing](../../CONTRIBUTING.md)** — как участвовать в разработке (ветки, коммиты, PR).
