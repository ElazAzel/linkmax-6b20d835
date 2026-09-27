DROP FUNCTION IF EXISTS public.admin_set_user_tier(uuid, text, timestamptz);

CREATE OR REPLACE FUNCTION public.admin_set_user_tier(
  p_target_user_id uuid,
  p_tier text,
  p_expires_at timestamptz DEFAULT NULL,
  p_make_admin boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid_tiers text[] := ARRAY['free', 'starter', 'pro', 'business'];
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL OR NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_tier IS NULL OR NOT (p_tier = ANY(v_valid_tiers)) THEN
    RAISE EXCEPTION 'invalid_tier' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_target_user_id) THEN
    RAISE EXCEPTION 'user_not_found' USING ERRCODE = '02000';
  END IF;

  UPDATE public.user_profiles
  SET premium_tier = p_tier,
      is_premium = (p_tier IN ('starter', 'pro', 'business')),
      premium_expires_at = CASE WHEN p_tier = 'free' THEN NULL ELSE p_expires_at END,
      updated_at = now()
  WHERE id = p_target_user_id;

  IF p_make_admin IS TRUE THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF p_make_admin IS FALSE AND p_target_user_id <> v_caller THEN
    DELETE FROM public.user_roles
    WHERE user_id = p_target_user_id
      AND role = 'admin';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_tier(uuid, text, timestamptz, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_user_tier(uuid, text, timestamptz, boolean) TO authenticated, service_role;