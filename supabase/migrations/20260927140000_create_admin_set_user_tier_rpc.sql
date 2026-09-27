-- P0-1: Create admin_set_user_tier RPC
-- Called by src/components/admin/UserTierManager.tsx to let admins
-- change a user's premium tier, expiry date, and admin flag.
-- SECURITY DEFINER: runs as the function owner (postgres) to bypass RLS.
-- Caller must be an admin (profiles.is_admin = true).

CREATE OR REPLACE FUNCTION public.admin_set_user_tier(
  p_target_user_id uuid,
  p_tier text,
  p_expires_at timestamptz DEFAULT NULL,
  p_make_admin boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin boolean;
  v_valid_tiers text[] := ARRAY['free', 'starter', 'pro', 'business'];
BEGIN
  -- 1. Verify caller is admin
  SELECT COALESCE(p.is_admin, false)
    INTO v_caller_is_admin
    FROM public.profiles p
   WHERE p.id = auth.uid();

  IF NOT COALESCE(v_caller_is_admin, false) THEN
    RAISE EXCEPTION 'Forbidden: caller is not an admin'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 2. Validate tier value
  IF NOT (p_tier = ANY(v_valid_tiers)) THEN
    RAISE EXCEPTION 'Invalid tier: %. Allowed: free, starter, pro, business', p_tier
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  -- 3. Validate target user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target_user_id) THEN
    RAISE EXCEPTION 'Target user not found: %', p_target_user_id
      USING ERRCODE = '02000'; -- no_data
  END IF;

  -- 4. Update profile
  UPDATE public.profiles
  SET
    premium_tier      = p_tier,
    is_premium        = (p_tier IN ('starter', 'pro', 'business')),
    premium_expires_at = CASE
                           WHEN p_tier = 'free' THEN NULL
                           ELSE COALESCE(p_expires_at, premium_expires_at)
                         END,
    is_admin          = COALESCE(p_make_admin, is_admin),
    updated_at        = now()
  WHERE id = p_target_user_id;
END;
$$;

-- Grant execute to authenticated users only (admin check is inside the function body)
GRANT EXECUTE ON FUNCTION public.admin_set_user_tier(uuid, text, timestamptz, boolean) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_tier(uuid, text, timestamptz, boolean) FROM anon;

COMMENT ON FUNCTION public.admin_set_user_tier IS
  'Admin-only RPC to set a user''s premium tier, expiry, and admin flag. Validates caller is_admin.';
