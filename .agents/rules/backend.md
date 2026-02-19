# Backend Rules (Supabase)

1.  **Database**:
    -   Use **snake_case** for table and column names.
    -   Always define **RLS Policies** for new tables.
    -   Use migrations for schema changes.
2.  **Edge Functions**:
    -   Use **Deno** runtime.
    -   Handle CORS properly (use standard `corsHeaders`).
    -   Validate all inputs strictly (Zod or manual checks).
    -   Use `supabase-js` for database interactions.
3.  **Environment Variables**:
    -   Use `Deno.env.get('VAR_NAME')`.
    -   Fail fast if critical variables are missing.
4.  **Security**:
    -   Never expose service role keys in client code.
    -   Sanitize user inputs to prevent XSS/Injection.
    -   Verify signatures for webhooks (e.g., RoboKassa).
