DROP POLICY IF EXISTS "Users can insert own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can manage own wallet" ON public.user_wallets;

REVOKE INSERT, UPDATE, DELETE ON public.user_wallets FROM authenticated;
REVOKE ALL ON public.user_wallets FROM anon;
GRANT SELECT ON public.user_wallets TO authenticated;
GRANT ALL ON public.user_wallets TO service_role;

CREATE OR REPLACE FUNCTION public.ensure_user_wallet()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_id FROM public.user_wallets WHERE user_id = auth.uid();
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.user_wallets (user_id, balance)
  VALUES (auth.uid(), 0)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_wallet() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_wallet() TO authenticated, service_role;