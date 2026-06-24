BEGIN;

-- ==============================================
-- 006: REFERRALS AND STREAKS
-- ==============================================

-- 1. Streak columns on user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date date,
ADD COLUMN IF NOT EXISTS streak_bonus_days integer DEFAULT 0;

-- 2. Referral tables
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT referral_codes_user_unique UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  reward_claimed boolean NOT NULL DEFAULT false,
  CONSTRAINT referrals_referred_unique UNIQUE (referred_id)
);

-- 3. Daily quests completed table
CREATE TABLE IF NOT EXISTS public.daily_quests_completed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_key TEXT NOT NULL,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_key, completed_date)
);

-- 4. RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quests_completed ENABLE ROW LEVEL SECURITY;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON public.daily_quests_completed(user_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_streak ON public.user_profiles(current_streak DESC) WHERE current_streak > 0;

-- 6. RLS Policies

-- referral_codes
DROP POLICY IF EXISTS "Users can view own referral code" ON public.referral_codes;
CREATE POLICY "Users can view own referral code"
ON public.referral_codes FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own referral code" ON public.referral_codes;
CREATE POLICY "Users can create own referral code"
ON public.referral_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- referrals
DROP POLICY IF EXISTS "Users can view referrals they made" ON public.referrals;
CREATE POLICY "Users can view referrals they made"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Anyone can create referral record" ON public.referrals;
CREATE POLICY "Anyone can create referral record"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referred_id);

-- daily_quests_completed
DROP POLICY IF EXISTS "Users can view own quests" ON public.daily_quests_completed;
CREATE POLICY "Users can view own quests"
ON public.daily_quests_completed
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quests" ON public.daily_quests_completed;
CREATE POLICY "Users can insert own quests"
ON public.daily_quests_completed
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own quests" ON public.daily_quests_completed;
CREATE POLICY "Users can update own quests"
ON public.daily_quests_completed
FOR UPDATE
USING (auth.uid() = user_id);

-- 7. Functions

-- generate_referral_code
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  SELECT code INTO v_code FROM public.referral_codes WHERE user_id = p_user_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  LOOP
    v_code := upper(substring(md5(random()::text) from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  INSERT INTO public.referral_codes (user_id, code) VALUES (p_user_id, v_code);
  RETURN v_code;
END;
$$;

-- update_user_streak
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_active date;
  v_current_streak integer;
  v_longest_streak integer;
  v_today date := current_date;
  v_bonus_days integer := 0;
  v_streak_milestone boolean := false;
BEGIN
  SELECT last_active_date, current_streak, longest_streak
  INTO v_last_active, v_current_streak, v_longest_streak
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_last_active = v_today THEN
    RETURN jsonb_build_object(
      'updated', false,
      'current_streak', COALESCE(v_current_streak, 0),
      'longest_streak', COALESCE(v_longest_streak, 0),
      'bonus_days', 0,
      'milestone', false
    );
  END IF;

  IF v_last_active = v_today - 1 THEN
    v_current_streak := COALESCE(v_current_streak, 0) + 1;
  ELSIF v_last_active IS NULL OR v_last_active < v_today - 1 THEN
    v_current_streak := 1;
  END IF;

  IF v_current_streak > COALESCE(v_longest_streak, 0) THEN
    v_longest_streak := v_current_streak;
  END IF;

  IF v_current_streak = 7 THEN
    v_bonus_days := 1;
    v_streak_milestone := true;
  ELSIF v_current_streak = 14 THEN
    v_bonus_days := 2;
    v_streak_milestone := true;
  ELSIF v_current_streak = 30 THEN
    v_bonus_days := 3;
    v_streak_milestone := true;
  ELSIF v_current_streak = 60 THEN
    v_bonus_days := 5;
    v_streak_milestone := true;
  ELSIF v_current_streak = 100 THEN
    v_bonus_days := 7;
    v_streak_milestone := true;
  END IF;

  UPDATE public.user_profiles
  SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_active_date = v_today,
    streak_bonus_days = COALESCE(streak_bonus_days, 0) + v_bonus_days,
    trial_ends_at = CASE
      WHEN v_bonus_days > 0 THEN GREATEST(COALESCE(trial_ends_at, now()), now()) + (v_bonus_days || ' days')::interval
      ELSE trial_ends_at
    END
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'updated', true,
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'bonus_days', v_bonus_days,
    'milestone', v_streak_milestone
  );
END;
$$;

-- get_top_referrers
CREATE OR REPLACE FUNCTION public.get_top_referrers(p_limit integer DEFAULT 10)
RETURNS TABLE(
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  referrals_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id as user_id,
    up.username,
    up.display_name,
    up.avatar_url,
    COUNT(r.id) as referrals_count
  FROM public.user_profiles up
  INNER JOIN public.referral_codes rc ON rc.user_id = up.id
  INNER JOIN public.referrals r ON r.referral_code_id = rc.id
  GROUP BY up.id, up.username, up.display_name, up.avatar_url
  HAVING COUNT(r.id) > 0
  ORDER BY referrals_count DESC
  LIMIT p_limit;
END;
$$;

-- apply_referral (latest version with auth checks + token rewards)
CREATE OR REPLACE FUNCTION public.apply_referral(p_code TEXT, p_referred_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_referrer_id UUID; v_referral_code_id UUID; v_already_referred BOOLEAN; v_referrer_total_referrals INTEGER;
BEGIN
  IF auth.uid() != p_referred_user_id THEN
     RAISE EXCEPTION 'Unauthorized: UserId mismatch';
  END IF;

  SELECT id, user_id INTO v_referral_code_id, v_referrer_id FROM public.referral_codes WHERE code = UPPER(p_code) AND is_active = true;
  IF v_referral_code_id IS NULL THEN RETURN json_build_object('success', false, 'error', 'invalid_code'); END IF;
  IF v_referrer_id = p_referred_user_id THEN RETURN json_build_object('success', false, 'error', 'self_referral'); END IF;
  SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referred_id = p_referred_user_id) INTO v_already_referred;
  IF v_already_referred THEN RETURN json_build_object('success', false, 'error', 'already_referred'); END IF;

  INSERT INTO public.referrals (referrer_id, referred_id, referral_code_id) VALUES (v_referrer_id, p_referred_user_id, v_referral_code_id);

  INSERT INTO public.user_tokens (user_id, balance, total_earned) VALUES (p_referred_user_id, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_tokens SET balance = balance + 50, total_earned = total_earned + 50, updated_at = now() WHERE user_id = p_referred_user_id;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_referred_user_id, 50, 'earn', 'referral', 'Бонус за регистрацию');

  INSERT INTO public.user_tokens (user_id, balance, total_earned) VALUES (v_referrer_id, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_tokens SET balance = balance + 50, total_earned = total_earned + 50, updated_at = now() WHERE user_id = v_referrer_id;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (v_referrer_id, 50, 'earn', 'referral', 'Бонус за приглашение друга');

  SELECT COUNT(*) INTO v_referrer_total_referrals FROM public.referrals WHERE referrer_id = v_referrer_id;
  IF v_referrer_total_referrals > 0 AND v_referrer_total_referrals % 3 = 0 THEN
    UPDATE public.user_profiles SET trial_ends_at = CASE WHEN trial_ends_at IS NOT NULL AND trial_ends_at > now() THEN trial_ends_at + INTERVAL '1 day' ELSE now() + INTERVAL '1 day' END, updated_at = now() WHERE id = v_referrer_id;
  END IF;
  RETURN json_build_object('success', true, 'bonus_tokens', 50, 'referrer_tokens', 50);
END;
$$;

-- complete_daily_quest (latest version with p_tokens support)
CREATE OR REPLACE FUNCTION public.complete_daily_quest(
    p_user_id uuid,
    p_quest_key text,
    p_tokens integer DEFAULT NULL,
    p_bonus_hours integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_already_completed BOOLEAN;
    v_token_amount INTEGER;
BEGIN
    IF p_user_id != auth.uid() THEN
        RETURN json_build_object('success', false, 'error', 'unauthorized');
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.daily_quests_completed
        WHERE user_id = p_user_id
        AND quest_key = p_quest_key
        AND completed_date = v_today
    ) INTO v_already_completed;

    IF v_already_completed THEN
        RETURN json_build_object('success', false, 'reason', 'already_completed');
    END IF;

    IF p_tokens IS NOT NULL THEN
        v_token_amount := p_tokens;
    ELSIF p_bonus_hours IS NOT NULL THEN
        v_token_amount := GREATEST(p_bonus_hours * 5, 5);
    ELSE
        v_token_amount := 5;
    END IF;

    INSERT INTO public.daily_quests_completed (user_id, quest_key, completed_date)
    VALUES (p_user_id, p_quest_key, v_today);

    PERFORM public.add_linkkon_tokens(p_user_id, v_token_amount, 'daily_quest', p_quest_key);

    RETURN json_build_object('success', true, 'tokens_earned', v_token_amount);
END;
$$;

COMMIT;
