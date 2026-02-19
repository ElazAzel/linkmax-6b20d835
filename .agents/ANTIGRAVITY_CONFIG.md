# Antigravity Configuration for lnkmx.my

This project uses Antigravity to automate development workflows and ensure code quality.

## Project Structure

- **Frontend**: React (Vite), TypeScript, Tailwind, Shadcn UI (`src/`)
- **Backend**: Supabase (Postgres, Edge Functions, Auth, Storage) (`supabase/`)
- **Testing**: Vitest (Unit), Playwright (E22)
- **Linting**: ESLint

## Agents

- **Frontend Specialist**: Focus on UI/UX, components, state management.
- **Backend Specialist**: Focus on database, RLS, Edge Functions, API.
- **QA Specialist**: Focus on testing, bug reproduction.

## Commands

- `dev`: Start local development environment.
- `lint`: Check code style and quality.
- `build`: Build for production.
- `test`: Run all proper tests.
- `db:migrate`: Manage database schema changes.

## Rules

See `.agents/rules/` for detailed coding standards, including `general.md`, `cursor.md`, and `windsurf.md`.

## Skills

See `.agents/skills/` for specific workflow skills:
- **React**: Component creation and modern React patterns (`.agents/skills/react/SKILL.md`).
- **Supabase**: Edge Function and Database workflows (`.agents/skills/supabase/SKILL.md`).
