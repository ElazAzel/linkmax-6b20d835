
-- 1) Pages: re-assert column-level grants. anon + authenticated can SELECT only safe columns.
-- Sensitive columns (contact_*, webhook_*, quality_breakdown, index_exclusion_reasons) remain
-- accessible only via SECURITY DEFINER RPC get_my_full_page() for the owner.

DO $$
DECLARE
  col record;
  safe_cols text;
BEGIN
  -- Build list of safe columns: everything EXCEPT the sensitive ones.
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO safe_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'pages'
    AND column_name NOT IN (
      'contact_email','contact_phone','contact_whatsapp',
      'webhook_url','webhook_secret',
      'quality_breakdown','index_exclusion_reasons'
    );

  -- Revoke any existing broad grants first (idempotent)
  EXECUTE 'REVOKE SELECT ON public.pages FROM anon, authenticated';

  -- Grant SELECT only on safe columns
  EXECUTE format('GRANT SELECT (%s) ON public.pages TO anon, authenticated', safe_cols);
END$$;

-- Owners still need INSERT/UPDATE/DELETE on their own rows (RLS enforces ownership).
GRANT INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;

-- 2) token_withdrawals: explicit column-level REVOKE of payment_details from authenticated/anon.
REVOKE SELECT (payment_details) ON public.token_withdrawals FROM anon, authenticated;
-- Owners read via app code that omits payment_details; admins read via get_admin_withdrawals() RPC.

-- 3) user_profiles: explicit column-level REVOKE for push_subscription, telegram_chat_id.
REVOKE SELECT (push_subscription, telegram_chat_id) ON public.user_profiles FROM anon, authenticated;
REVOKE UPDATE (push_subscription, telegram_chat_id) ON public.user_profiles FROM anon, authenticated;
-- These fields are server-managed (edge functions via service_role) only.

-- Realtime policies are managed by Supabase and are not changed by this
-- project migration role.
