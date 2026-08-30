-- Drop existing functions that return different types
DROP FUNCTION IF EXISTS public.complete_daily_quest(uuid, text, integer);
DROP FUNCTION IF EXISTS public.apply_referral(text, uuid);

-- ==============================================
-- LINKKON TOKEN ECONOMY SYSTEM
-- ==============================================

-- Table for user tokens (if not exists from previous partial migration)
CREATE TABLE IF NOT EXISTS public.user_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_tokens_user_id_unique UNIQUE (user_id)
);

-- Table for token transactions history
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'bonus')),
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exists first)
DROP POLICY IF EXISTS "Users can view own tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.token_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.token_transactions;

CREATE POLICY "Users can view own tokens" ON public.user_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tokens" ON public.user_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tokens" ON public.user_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON public.token_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.token_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to add tokens
CREATE OR REPLACE FUNCTION public.add_linkkon_tokens(p_user_id UUID, p_amount INTEGER, p_source TEXT, p_description TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_new_balance INTEGER;
BEGIN
  INSERT INTO public.user_tokens (user_id, balance, total_earned) VALUES (p_user_id, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_tokens SET balance = balance + p_amount, total_earned = total_earned + p_amount, updated_at = now() WHERE user_id = p_user_id RETURNING balance INTO v_new_balance;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_user_id, p_amount, 'earn', p_source, p_description);
  RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'earned', p_amount);
END; $$;

-- Function to spend tokens
CREATE OR REPLACE FUNCTION public.spend_linkkon_tokens(p_user_id UUID, p_amount INTEGER, p_source TEXT, p_description TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current_balance INTEGER; v_new_balance INTEGER;
BEGIN
  SELECT balance INTO v_current_balance FROM public.user_tokens WHERE user_id = p_user_id;
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'insufficient_balance', 'balance', COALESCE(v_current_balance, 0));
  END IF;
  UPDATE public.user_tokens SET balance = balance - p_amount, total_spent = total_spent + p_amount, updated_at = now() WHERE user_id = p_user_id RETURNING balance INTO v_new_balance;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_user_id, -p_amount, 'spend', p_source, p_description);
  RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'spent', p_amount);
END; $$;

-- Convert tokens to premium (100 Linkkon = 1 day)
CREATE OR REPLACE FUNCTION public.convert_tokens_to_premium(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current_balance INTEGER; v_current_trial TIMESTAMP WITH TIME ZONE; v_new_trial TIMESTAMP WITH TIME ZONE;
BEGIN
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

-- Complete daily quest - gives Linkkon tokens
CREATE OR REPLACE FUNCTION public.complete_daily_quest(p_user_id UUID, p_quest_key TEXT, p_bonus_hours INTEGER DEFAULT 0)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_today DATE := CURRENT_DATE; v_already_completed BOOLEAN; v_token_amount INTEGER;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.daily_quests_completed WHERE user_id = p_user_id AND quest_key = p_quest_key AND completed_date = v_today) INTO v_already_completed;
  IF v_already_completed THEN RETURN json_build_object('success', false, 'reason', 'already_completed'); END IF;
  v_token_amount := GREATEST(p_bonus_hours * 5, 5);
  INSERT INTO public.daily_quests_completed (user_id, quest_key, completed_date) VALUES (p_user_id, p_quest_key, v_today);
  PERFORM public.add_linkkon_tokens(p_user_id, v_token_amount, 'daily_quest', p_quest_key);
  RETURN json_build_object('success', true, 'tokens_earned', v_token_amount);
END; $$;

-- Apply referral: tokens + every 3 refs = 1 day premium
CREATE OR REPLACE FUNCTION public.apply_referral(p_code TEXT, p_referred_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_referrer_id UUID; v_referral_code_id UUID; v_already_referred BOOLEAN; v_referrer_total_referrals INTEGER;
BEGIN
  SELECT id, user_id INTO v_referral_code_id, v_referrer_id FROM public.referral_codes WHERE code = UPPER(p_code) AND is_active = true;
  IF v_referral_code_id IS NULL THEN RETURN json_build_object('success', false, 'error', 'invalid_code'); END IF;
  IF v_referrer_id = p_referred_user_id THEN RETURN json_build_object('success', false, 'error', 'self_referral'); END IF;
  SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referred_id = p_referred_user_id) INTO v_already_referred;
  IF v_already_referred THEN RETURN json_build_object('success', false, 'error', 'already_referred'); END IF;
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code_id) VALUES (v_referrer_id, p_referred_user_id, v_referral_code_id);
  PERFORM public.add_linkkon_tokens(p_referred_user_id, 50, 'referral', 'Бонус за регистрацию');
  PERFORM public.add_linkkon_tokens(v_referrer_id, 50, 'referral', 'Бонус за приглашение друга');
  SELECT COUNT(*) INTO v_referrer_total_referrals FROM public.referrals WHERE referrer_id = v_referrer_id;
  IF v_referrer_total_referrals > 0 AND v_referrer_total_referrals % 3 = 0 THEN
    UPDATE public.user_profiles SET trial_ends_at = CASE WHEN trial_ends_at IS NOT NULL AND trial_ends_at > now() THEN trial_ends_at + INTERVAL '1 day' ELSE now() + INTERVAL '1 day' END, updated_at = now() WHERE id = v_referrer_id;
  END IF;
  RETURN json_build_object('success', true, 'bonus_tokens', 50, 'referrer_tokens', 50);
END; $$;

-- Remove default trial
ALTER TABLE public.user_profiles ALTER COLUMN trial_ends_at SET DEFAULT NULL;

-- Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_tokens()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_tokens (user_id, balance, total_earned, total_spent) VALUES (NEW.id, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_user_profile_created_tokens ON public.user_profiles;
CREATE TRIGGER on_user_profile_created_tokens AFTER INSERT ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_tokens();