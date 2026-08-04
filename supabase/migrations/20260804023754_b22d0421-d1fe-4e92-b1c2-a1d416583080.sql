-- 1. Enforce premium eligibility for blocks.is_premium regardless of entry path (incl. SECURITY DEFINER save_page_blocks)
CREATE OR REPLACE FUNCTION public.enforce_block_premium_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_eligible boolean := false;
BEGIN
  IF NEW.is_premium IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- service role / no session: leave untouched
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = v_uid
      AND (up.is_premium = true
           OR (up.trial_ends_at IS NOT NULL AND up.trial_ends_at > now()))
  ) INTO v_eligible;

  IF NOT v_eligible THEN
    NEW.is_premium := false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_block_premium_eligibility ON public.blocks;
CREATE TRIGGER trg_enforce_block_premium_eligibility
BEFORE INSERT OR UPDATE OF is_premium ON public.blocks
FOR EACH ROW EXECUTE FUNCTION public.enforce_block_premium_eligibility();

-- 2. set_primary_paid_page: caller must be the target user (or admin)
CREATE OR REPLACE FUNCTION public.set_primary_paid_page(p_user_id uuid, p_page_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_tier text;
BEGIN
  IF auth.uid() IS NULL
     OR (auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;

  SELECT COALESCE(premium_tier, 'free') INTO user_tier
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF user_tier = 'free' THEN
    RETURN jsonb_build_object('success', false, 'error', 'pro_required');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.pages WHERE id = p_page_id AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'page_not_found');
  END IF;

  UPDATE public.pages SET is_primary_paid = false
  WHERE user_id = p_user_id AND is_primary_paid = true;

  UPDATE public.pages SET is_primary_paid = true, is_paid = true
  WHERE id = p_page_id AND user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'page_id', p_page_id);
END;
$$;

-- 3. premium_gifts: recipient may only claim an unclaimed gift
DROP POLICY IF EXISTS "Recipients can update to claim" ON public.premium_gifts;
CREATE POLICY "Recipients can claim unclaimed gifts"
ON public.premium_gifts
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id AND is_claimed = false)
WITH CHECK (auth.uid() = recipient_id AND is_claimed = true);

-- 4. referrals: referrer must own the referral code
DROP POLICY IF EXISTS "Anyone can create referral record" ON public.referrals;
CREATE POLICY "Users can create their own referral record"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = referred_id
  AND referrer_id IS DISTINCT FROM referred_id
  AND EXISTS (
    SELECT 1 FROM public.referral_codes rc
    WHERE rc.id = referral_code_id
      AND rc.user_id = referrer_id
  )
);

-- 5. token_withdrawals: inserts must be pending; only admins change status
DROP POLICY IF EXISTS "Users can create withdrawal requests" ON public.token_withdrawals;
CREATE POLICY "Users can create pending withdrawal requests"
ON public.token_withdrawals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND COALESCE(status, 'pending') = 'pending');
