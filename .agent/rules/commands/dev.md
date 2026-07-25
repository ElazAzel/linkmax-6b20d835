---
description: Start the LinkMAX local web and optional Supabase environment
---

# Development Commands

```bash
nvm use
npm ci
npm run dev
```

Vite runs at `http://localhost:8080`.

For local Supabase work, with Docker and Supabase CLI installed:

```bash
npx supabase start
npx supabase status
npx supabase functions serve <function-name> --env-file supabase/.env.local
```

See `docs/deployment/runbooks/LOCAL_DEVELOPMENT.md` for local database and mobile details.
