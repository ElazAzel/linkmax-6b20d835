# Cursor IDE Rules

1. **AI Context**: Always provide sufficient context (relevant files, types, and database schemas) when asking Cursor AI to generate code.
2. **Code Generation**: Review AI-generated code carefully for:
   - Adherence to Shadcn UI + Tailwind CSS patterns.
   - Correct Supabase client usage (RLS bypass vs authenticated client).
   - Proper generic typing in TypeScript.
3. **Composer Mode**: When using Composer for multi-file edits, ensure it doesn't accidentally overwrite existing robust error handling with overly simplistic `try/catch` and `console.error`.
4. **Inline Edits**: Use inline edits (Cmd+K) for small refactors, but always verify the surrounding context wasn't broken by the edit.
