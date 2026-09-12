
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

-- 4) Realtime: deny-by-default fallback for non-zone topics.
-- Drop any permissive non-zone fallback and replace with strict allowlist (currently only zone:* topics).
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'realtime.messages'::regclass
      AND polcmd = 'r'  -- SELECT
  LOOP
    -- Only drop policies created by us previously; safe-guarded names
    IF pol.polname IN ('zone_realtime_select', 'allow_zone_or_other_topics', 'realtime_select_fallback') THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON realtime.messages', pol.polname);
    END IF;
  END LOOP;
END$$;

-- Create a strict SELECT policy: only zone:<zone_id> topics where caller is a zone member.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'realtime.messages'::regclass
      AND polname = 'zone_realtime_strict_select'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY zone_realtime_strict_select
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING (
        realtime.topic() LIKE 'zone:%'
        AND public.is_zone_member(
          auth.uid(),
          NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid
        )
      )
    $POLICY$;
  END IF;
END$$;
