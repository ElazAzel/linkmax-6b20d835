# Runbook: Local Development Setup

> **Goal:** Get a developer from zero to running `inkmax` locally.

## Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)
- Git
- Supabase CLI (optional, for edge function testing)

## Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd inkmax
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
     ```bash
     cp .env.example .env
     ```
   - Fill in the required values:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon key

   > **Note**: `next.config.mjs` maps `VITE_*` vars to `NEXT_PUBLIC_*` automatically.

## Running the App

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   - The app should be running at `http://localhost:3000`.

## Edge Functions (Local)

```bash
# Start Supabase local dev server
supabase start

# Serve individual edge function
supabase functions serve <function-name> --env-file supabase/functions/.env
```

## Common Tasks

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npm run lint
```

### Running Tests
```bash
npm run test
```

### Build
```bash
npm run build
```

## Troubleshooting

- **Dependency Issues**: Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
- **Supabase Issues**: Ensure your `.env` variables match your Supabase project.
- **Port Conflicts**: Vite defaults to `5173`. If you need a different port, use `npm run dev -- --port 3001`.
- **Edge Functions**: Deno lint errors in IDE are expected — edge functions run on Deno runtime, not Node.

---

*Last updated: 2026-02-18*
