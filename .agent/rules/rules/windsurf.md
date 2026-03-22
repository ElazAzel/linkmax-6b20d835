# Windsurf IDE Rules

1. **Agent Context**: When using Windsurf's agentic AI, ensure it respects the project's architecture (Frontend -> Supabase Client -> Database).
2. **Code Consistency**: Validate that Windsurf-generated components use existing Shadcn UI components instead of inventing new ones from scratch.
3. **TypeScript Strictness**: Instruct Windsurf to strictly type its outputs and not rely on `any` or `ts-ignore` assertions during quick iterations.
4. **Database Migrations**: Windsurf should not attempt to execute raw SQL directly unless it's creating a formal Supabase migration file.
