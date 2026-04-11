<project_context>
# Antigravity Configuration for LinkMAX (lnkmx.my)

This project uses Antigravity to automate development workflows and ensure code quality.

## Project Structure

- **Frontend**: React (Vite), TypeScript, Tailwind, Shadcn UI (`src/`)
- **Backend**: Supabase (Postgres, Edge Functions, Auth, Storage) (`supabase/`)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint
</project_context>

<communication_rules>
## Communication Rules
- **Language**: Always respond in **Russian**.
- **Protocol**: Always ask clarifying questions and provide suggestions/alternatives BEFORE starting any work.
</communication_rules>

<agents>
## Agents

- **Frontend Specialist**: Focus on UI/UX, components, state management.
- **Backend Specialist**: Focus on database, RLS, Edge Functions, API.
- **QA Specialist**: Focus on testing, bug reproduction.
</agents>

<commands>
## Commands

- `dev` / `npm run dev`: Start local development environment (Vite, see `vite.config.ts` port).
- `lint` / `npm run lint`: Check code style and quality.
- `build` / `npm run build`: Build for production.
- `test` / `npm run test`: Unit tests (Vitest); E2E: `npm run e2e` (Playwright).
- **Database (Supabase CLI, not an npm script):** see `.agent/rules/commands/database.md` — e.g. `npx supabase db diff`, `db reset`, `db push`.
</commands>

<rules>
## Rules

See `.agent/rules/` for detailed coding standards, including `general.md`, `cursor.md`, and `windsurf.md`.
</rules>

<skills>
## Skills

See `.agent/rules/skills/` for specific workflow skills:
- **React**: Component creation and modern React patterns (`.agent/rules/skills/react/SKILL.md`).
- **Supabase**: Edge Function and Database workflows (`.agent/rules/skills/supabase/SKILL.md`).
</skills>
