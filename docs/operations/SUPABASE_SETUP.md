# Supabase Manual Setup Instructions

## Auth Redirect Whitelist

To fix the remaining P1 issue where OAuth redirects are not properly handled by Supabase, the following URLs must be added to the whitelist in the Supabase Dashboard:

1. Go to **Authentication** -> **URL Configuration**.
2. Add the following to **Redirect URLs**:
   - `http://localhost:5173/auth/callback`
   - `https://*.lovable.app/auth/callback`
   - `https://inkmax.app/auth/callback` (Production)

## Edge Functions Secrets

Ensure the following secrets are set for the Monetization module:

```bash
supabase secrets set ROBOKASSA_LOGIN=xxx
supabase secrets set ROBOKASSA_PASSWORD_1=xxx
supabase secrets set ROBOKASSA_PASSWORD_2=xxx
```
