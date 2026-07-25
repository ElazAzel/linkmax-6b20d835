# LinkMAX

LinkMAX is a multi-language link-in-bio and micro-business platform. It provides public pages, a visual block editor, commerce, bookings, CRM, analytics, and a mobile shell built with Capacitor.

This repository is the source of truth for the web application, Supabase schema and Edge Functions, Cloudflare SSR worker, automated checks, and operational documentation.

## Stack

- React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- Supabase: Auth, PostgreSQL, Storage, Row Level Security, Edge Functions
- TanStack Query, Zustand, i18next
- Playwright and Vitest
- Capacitor for Android and iOS
- Cloudflare Worker for bot SSR and sitemap handling

## Requirements

- Node.js 22 (see `.nvmrc`)
- npm 10 or later
- Optional for local backend work: Supabase CLI and Docker

## Local start

```bash
nvm use
npm ci
cp .env.example .env
npm run dev
```

The Vite application runs at `http://localhost:8080`.

The browser-safe Supabase variables are:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

Never add service-role keys, deployment tokens, payment secrets, or OAuth client secrets to `VITE_*` variables.

## Verification

Run the checks appropriate to the change:

```bash
npm run lint
npm run typecheck:strict
npm run test:ci
npm run e2e:ci
npm run build
```

`npm run quality:check` is the complete local quality gate. It includes linting, i18n validation, strict TypeScript, dependency checks, and baseline guards.

## Documentation

Start with [docs/README.md](docs/README.md). It distinguishes current operating documents from historical reports and links to architecture, development, deployment, testing, security, and roadmap material.

For AI-assisted work, read [.agent/README.md](.agent/README.md) before changing code. The active agent rules and project skills live under `.agent/rules/`.

## Delivery

GitHub Actions runs CI for pull requests and `main`. Deploy workflows are defined in `.github/workflows/`:

- `ci.yml`: quality checks, tests, editor-sheet E2E gate, and build
- `deploy.yml`: production/staging build and Cloudflare Worker deployment
- `deploy-cloudflare-worker.yml`: Worker-only deployment
- `deploy-supabase.yml`: Supabase migrations and Edge Functions

Required deployment secrets and recovery steps are documented in [docs/deployment/GITHUB_ACTIONS_SETUP.md](docs/deployment/GITHUB_ACTIONS_SETUP.md).

## Contributing

Keep changes scoped, add tests for behavioral changes, and update the applicable current documentation in the same pull request. Do not edit archived audit reports to represent the current system; create or update an active document instead.

## License

Copyright (c) 2026 LinkMAX. All rights reserved.
