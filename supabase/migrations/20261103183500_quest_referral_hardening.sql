REVOKE EXECUTE ON FUNCTION public.complete_daily_quest(uuid,text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_daily_quest(uuid,text,integer,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_code text; v_exists boolean;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;
  SELECT code INTO v_code FROM public.referral_codes WHERE user_id = p_user_id;
  IF v_code IS NOT NULL THEN RETURN v_code; END IF;
  LOOP
    v_code := upper(substring(md5(random()::text) from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  INSERT INTO public.referral_codes (user_id, code) VALUES (p_user_id, v_code);
  RETURN v_code;
END; $$;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_referral_code(uuid) TO authenticated;
