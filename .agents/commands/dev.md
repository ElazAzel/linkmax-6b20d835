---
description: Start local development environments
---
# Dev Command

This command starts the local development servers for the frontend and backend.

## Frontend (Vite)
1.  Run `npm run dev`.
2.  Server usually starts on `http://localhost:8080` (as per vite.config.ts).

## Backend (Supabase)
To run Supabase services locally (Postgres, Auth, Storage, Edge Functions):
1.  Start Supabase: `npx supabase start`
2.  To serve Edge Functions locally and watch for changes:
    - `npx supabase functions serve`
    - Or for a specific function with a `.env` file: `npx supabase functions serve <function-name> --env-file supabase/.env.local`

## Verification
- Frontend: Open `http://localhost:8080` in browser.
- Backend: Check Supabase studio at `http://localhost:54323` (or port specified in CLI output).
