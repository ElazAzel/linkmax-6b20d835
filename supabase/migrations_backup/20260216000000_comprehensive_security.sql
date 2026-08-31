-- Comprehensive Security Hardening Migration

-- ==============================================
-- 1. TOKEN ECONOMY HARDENING
-- ==============================================

-- Harden add_linkkon_tokens
CREATE OR REPLACE FUNCTION public.add_linkkon_tokens(p_user_id UUID, p_amount INTEGER, p_source TEXT, p_description TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_new_balance INTEGER;
BEGIN
  -- Security check: Ensure authenticated user is the target user OR user is admin
  -- We allow matching ID (e.g. claiming a daily quest) or admin (e.g. support)
  IF auth.uid() != p_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
     RAISE EXCEPTION 'Unauthorized: UserId mismatch or not admin';
  END IF;

  INSERT INTO public.user_tokens (user_id, balance, total_earned) VALUES (p_user_id, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_tokens SET balance = balance + p_amount, total_earned = total_earned + p_amount, updated_at = now() WHERE user_id = p_user_id RETURNING balance INTO v_new_balance;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_user_id, p_amount, 'earn', p_source, p_description);
  RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'earned', p_amount);
END; $$;

-- Harden spend_linkkon_tokens
CREATE OR REPLACE FUNCTION public.spend_linkkon_tokens(p_user_id UUID, p_amount INTEGER, p_source TEXT, p_description TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current_balance INTEGER; v_new_balance INTEGER;
BEGIN
  -- Security check
  IF auth.uid() != p_user_id THEN
     RAISE EXCEPTION 'Unauthorized: UserId mismatch';
  END IF;

  SELECT balance INTO v_current_balance FROM public.user_tokens WHERE user_id = p_user_id;
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'insufficient_balance', 'balance', COALESCE(v_current_balance, 0));
  END IF;
  UPDATE public.user_tokens SET balance = balance - p_amount, total_spent = total_spent + p_amount, updated_at = now() WHERE user_id = p_user_id RETURNING balance INTO v_new_balance;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_user_id, -p_amount, 'spend', p_source, p_description);
  RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'spent', p_amount);
END; $$;

-- Harden convert_tokens_to_premium
CREATE OR REPLACE FUNCTION public.convert_tokens_to_premium(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current_balance INTEGER; v_current_trial TIMESTAMP WITH TIME ZONE; v_new_trial TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Security check
  IF auth.uid() != p_user_id THEN
     RAISE EXCEPTION 'Unauthorized: UserId mismatch';
  END IF;

  SELECT balance INTO v_current_balance FROM public.user_tokens WHERE user_id = p_user_id;
  IF v_current_balance IS NULL OR v_current_balance < 100 THEN
    RETURN json_build_object('success', false, 'error', 'insufficient_tokens', 'required', 100, 'balance', COALESCE(v_current_balance, 0));
  END IF;
  SELECT trial_ends_at INTO v_current_trial FROM public.user_profiles WHERE id = p_user_id;
  IF v_current_trial IS NOT NULL AND v_current_trial > now() THEN v_new_trial := v_current_trial + INTERVAL '1 day'; ELSE v_new_trial := now() + INTERVAL '1 day'; END IF;
  UPDATE public.user_tokens SET balance = balance - 100, total_spent = total_spent + 100, updated_at = now() WHERE user_id = p_user_id;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_user_id, -100, 'spend', 'premium_conversion', '1 день Premium');
  UPDATE public.user_profiles SET trial_ends_at = v_new_trial, updated_at = now() WHERE id = p_user_id;
  RETURN json_build_object('success', true, 'premium_until', v_new_trial);
END; $$;

-- Harden apply_referral
CREATE OR REPLACE FUNCTION public.apply_referral(p_code TEXT, p_referred_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_referrer_id UUID; v_referral_code_id UUID; v_already_referred BOOLEAN; v_referrer_total_referrals INTEGER;
BEGIN
  -- Security check
  IF auth.uid() != p_referred_user_id THEN
     RAISE EXCEPTION 'Unauthorized: UserId mismatch';
  END IF;

  SELECT id, user_id INTO v_referral_code_id, v_referrer_id FROM public.referral_codes WHERE code = UPPER(p_code) AND is_active = true;
  IF v_referral_code_id IS NULL THEN RETURN json_build_object('success', false, 'error', 'invalid_code'); END IF;
  IF v_referrer_id = p_referred_user_id THEN RETURN json_build_object('success', false, 'error', 'self_referral'); END IF;
  SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referred_id = p_referred_user_id) INTO v_already_referred;
  IF v_already_referred THEN RETURN json_build_object('success', false, 'error', 'already_referred'); END IF;
  
  -- Logic looks safe now as we validated auth.uid() matches p_referred_user_id
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code_id) VALUES (v_referrer_id, p_referred_user_id, v_referral_code_id);
  
  -- We can call the internal implementations of add_linkkon_tokens or just call them directly.
  -- Since we added security checks to add_linkkon_tokens, it might fail for the referrer benefit step because auth.uid() (referred) != referrer_id
  -- We need to bypass the check for the SYSTEM/INTERNAL calls or create an internal version.
  -- However, since this whole function is SECURITY DEFINER, we can just do the updates directly here to avoid the check limitation,
  -- OR we can modify add_linkkon_tokens to allow 'system' calls (harder).
  -- EASIEST: Just execute the logic directly here for both users.
  
  -- Credit Referred User (Self)
  INSERT INTO public.user_tokens (user_id, balance, total_earned) VALUES (p_referred_user_id, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_tokens SET balance = balance + 50, total_earned = total_earned + 50, updated_at = now() WHERE user_id = p_referred_user_id;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_referred_user_id, 50, 'earn', 'referral', 'Бонус за регистрацию');

  -- Credit Referrer (Other User) - SECURITY DEFINER allows this
  INSERT INTO public.user_tokens (user_id, balance, total_earned) VALUES (v_referrer_id, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_tokens SET balance = balance + 50, total_earned = total_earned + 50, updated_at = now() WHERE user_id = v_referrer_id;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (v_referrer_id, 50, 'earn', 'referral', 'Бонус за приглашение друга');

  SELECT COUNT(*) INTO v_referrer_total_referrals FROM public.referrals WHERE referrer_id = v_referrer_id;
  IF v_referrer_total_referrals > 0 AND v_referrer_total_referrals % 3 = 0 THEN
    UPDATE public.user_profiles SET trial_ends_at = CASE WHEN trial_ends_at IS NOT NULL AND trial_ends_at > now() THEN trial_ends_at + INTERVAL '1 day' ELSE now() + INTERVAL '1 day' END, updated_at = now() WHERE id = v_referrer_id;
  END IF;
  RETURN json_build_object('success', true, 'bonus_tokens', 50, 'referrer_tokens', 50);
END; $$;


-- ==============================================
-- 2. BOOKINGS TABLE SECURITY
-- ==============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view bookings for public pages" ON public.bookings;

-- Ensure "Owners can view all their bookings" exists
DROP POLICY IF EXISTS "Owners can view all their bookings" ON public.bookings;
CREATE POLICY "Owners can view all their bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = owner_id);

-- Ensure "Users can view their own bookings" exists
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = user_id);

-- If there are any other SELECT policies for public.bookings that allow public access, drop them.
-- (We assume no others based on previous file review, but explicit drops are safer)


-- ==============================================
-- 3. USER PROFILES SECURITY
-- ==============================================

-- Ensure no policies allow public SELECT on user_profiles
-- Drop potentially dangerous policies if they exist
DROP POLICY IF EXISTS "Public profiles view" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.user_profiles;

-- Strict policy: Only owner can view their own full profile row
DROP POLICY IF EXISTS "Users can view own full profile" ON public.user_profiles;
CREATE POLICY "Users can view own full profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

-- Admins can view all (from previous security update, but ensuring it)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

