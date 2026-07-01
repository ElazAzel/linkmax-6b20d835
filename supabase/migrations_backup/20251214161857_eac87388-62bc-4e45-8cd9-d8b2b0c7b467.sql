-- Extend trial period from 2 to 7 days for new users
ALTER TABLE public.user_profiles 
ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '7 days');

-- Create referral system tables
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT referral_codes_user_unique UNIQUE (user_id)
);

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  reward_claimed boolean NOT NULL DEFAULT false,
  CONSTRAINT referrals_referred_unique UNIQUE (referred_id)
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
CREATE POLICY "Users can view own referral code"
ON public.referral_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral code"
ON public.referral_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for referrals
CREATE POLICY "Users can view referrals they made"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Anyone can create referral record"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referred_id);

-- Function to generate unique referral code
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
  -- Check if user already has a code
  SELECT code INTO v_code FROM public.referral_codes WHERE user_id = p_user_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  
  -- Generate unique 6-character code
  LOOP
    v_code := upper(substring(md5(random()::text) from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  -- Insert and return
  INSERT INTO public.referral_codes (user_id, code) VALUES (p_user_id, v_code);
  RETURN v_code;
END;
$$;

-- Function to apply referral and extend trial
CREATE OR REPLACE FUNCTION public.apply_referral(p_code text, p_referred_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_code record;
  v_referrer_id uuid;
  v_already_referred boolean;
BEGIN
  -- Check if user was already referred
  SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referred_id = p_referred_user_id) INTO v_already_referred;
  IF v_already_referred THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_referred');
  END IF;
  
  -- Find referral code
  SELECT * INTO v_referral_code FROM public.referral_codes WHERE code = upper(p_code) AND is_active = true;
  IF v_referral_code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;
  
  v_referrer_id := v_referral_code.user_id;
  
  -- Can't refer yourself
  IF v_referrer_id = p_referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'self_referral');
  END IF;
  
  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code_id)
  VALUES (v_referrer_id, p_referred_user_id, v_referral_code.id);
  
  -- Extend referrer's trial by 3 days
  UPDATE public.user_profiles
  SET trial_ends_at = GREATEST(COALESCE(trial_ends_at, now()), now()) + interval '3 days'
  WHERE id = v_referrer_id;
  
  -- Extend referred user's trial by 3 days
  UPDATE public.user_profiles
  SET trial_ends_at = GREATEST(COALESCE(trial_ends_at, now()), now()) + interval '3 days'
  WHERE id = p_referred_user_id;
  
  RETURN jsonb_build_object('success', true, 'bonus_days', 3);
END;
$$;

-- Add indexes for performance
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_user ON public.referral_codes(user_id);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_id);