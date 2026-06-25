
-- 1) telegram_bot_settings — bot-only table. Revoke all client privileges.
REVOKE ALL ON public.telegram_bot_settings FROM anon, authenticated;
GRANT ALL ON public.telegram_bot_settings TO service_role;
COMMENT ON TABLE public.telegram_bot_settings IS
  'Telegram bot session storage. Only service_role (bot edge function) can read/write. End-user clients have no access.';

-- 2) token_withdrawals.payment_details — sensitive bank/wallet info.
REVOKE SELECT ON public.token_withdrawals FROM authenticated;
GRANT SELECT (
  id, user_id, amount, status, payment_method, admin_notes,
  processed_by, processed_at, created_at, updated_at
) ON public.token_withdrawals TO authenticated;
GRANT INSERT, UPDATE ON public.token_withdrawals TO authenticated;

-- Admin-only RPC that returns full rows after role check.
CREATE OR REPLACE FUNCTION public.get_admin_withdrawals(p_status text DEFAULT NULL)
RETURNS SETOF public.token_withdrawals
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;
  RETURN QUERY
    SELECT *
    FROM public.token_withdrawals
    WHERE p_status IS NULL OR status = p_status
    ORDER BY created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_withdrawals(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_withdrawals(text) TO authenticated;

COMMENT ON FUNCTION public.get_admin_withdrawals(text) IS
  'Admin-only access to full withdrawal records including payment_details. Direct SELECT on payment_details is revoked from the authenticated role.';
