
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;

CREATE OR REPLACE FUNCTION public.start_pro_trial()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile record;
  v_new_end timestamptz := now() + interval '7 days';
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  SELECT is_premium, trial_started_at, trial_ends_at, premium_expires_at
    INTO v_profile
  FROM public.user_profiles
  WHERE id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_profile');
  END IF;

  IF v_profile.trial_started_at IS NOT NULL OR v_profile.trial_ends_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'trial_already_used');
  END IF;

  IF COALESCE(v_profile.is_premium, false) = true
     AND (v_profile.premium_expires_at IS NULL OR v_profile.premium_expires_at > now()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_premium');
  END IF;

  UPDATE public.user_profiles
     SET trial_started_at = now(),
         trial_ends_at = v_new_end,
         updated_at = now()
   WHERE id = v_uid;

  RETURN jsonb_build_object('ok', true, 'trial_ends_at', v_new_end);
END;
$$;

REVOKE ALL ON FUNCTION public.start_pro_trial() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.start_pro_trial() TO authenticated;
