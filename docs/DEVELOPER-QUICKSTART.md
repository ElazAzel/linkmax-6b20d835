# Developer Quickstart

> **Last Updated:** February 28, 2026

## Prerequisites

- **Node.js**: v18 or higher (v20 recommended)
- **npm**: v9 or higher
- **Git**

## Setup

1. **Clone the repository**:

    ```bash
    git clone https://github.com/ElazAzel/inkmax.git
    cd inkmax
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

- `src/components/`: UI and business components (blocks, dashboard-v2, zones, ui)
- `src/pages/`: Route-level components
- `src/hooks/`: Custom React hooks (60+)
- `src/services/`: API and business logic
- `src/lib/`: Utilities, SEO, export (PDF/Excel)
- `src/i18n/locales/`: Translation files (16 languages)

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
