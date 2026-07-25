---
description: Safe Supabase schema and migration workflow
---

# Database Commands

```bash
npx supabase start
npx supabase migration new <feature_name>
npx supabase db reset
npx supabase status
```

Use `supabase db reset` only against the local development stack. Review migrations and RLS policies before applying them to a remote project.

The `deploy-supabase.yml` workflow applies migrations on `main`. Manual remote `supabase db push` requires an explicitly linked/targeted project and must never be used as an unreviewed production shortcut.
