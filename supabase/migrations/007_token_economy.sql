BEGIN;

-- ==============================================
-- 007: TOKEN ECONOMY
-- ==============================================

-- 1. Token tables
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

CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'bonus')),
  source TEXT NOT NULL,
  description TEXT,
  seller_id UUID REFERENCES auth.users(id),
  buyer_id UUID REFERENCES auth.users(id),
  item_type TEXT,
  item_id TEXT,
  original_price NUMERIC(10,2),
  platform_fee NUMERIC(10,2),
  net_amount NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.token_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_details JSONB,
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_token_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  claimed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, action_type, action_date)
);

-- 2. Enable RLS
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_token_limits ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- user_tokens
DROP POLICY IF EXISTS "Users can view own tokens" ON public.user_tokens;
CREATE POLICY "Users can view own tokens" ON public.user_tokens FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tokens" ON public.user_tokens;
CREATE POLICY "Users can insert own tokens" ON public.user_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tokens" ON public.user_tokens;
CREATE POLICY "Users can update own tokens" ON public.user_tokens FOR UPDATE USING (auth.uid() = user_id);

-- token_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.token_transactions;
CREATE POLICY "Users can view own transactions" ON public.token_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.token_transactions;
CREATE POLICY "Users can insert own transactions" ON public.token_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- token_withdrawals
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON public.token_withdrawals;
CREATE POLICY "Users can view their own withdrawals"
ON public.token_withdrawals FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create withdrawal requests" ON public.token_withdrawals;
CREATE POLICY "Users can create withdrawal requests"
ON public.token_withdrawals FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.token_withdrawals;
CREATE POLICY "Admins can view all withdrawals"
ON public.token_withdrawals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update withdrawals" ON public.token_withdrawals;
CREATE POLICY "Admins can update withdrawals"
ON public.token_withdrawals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- daily_token_limits
DROP POLICY IF EXISTS "Users can view their own limits" ON public.daily_token_limits;
CREATE POLICY "Users can view their own limits"
ON public.daily_token_limits FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own limits" ON public.daily_token_limits;
CREATE POLICY "Users can insert their own limits"
ON public.daily_token_limits FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Trigger: auto-create user_tokens on profile creation
DROP TRIGGER IF EXISTS on_user_profile_created_tokens ON public.user_profiles;

CREATE OR REPLACE FUNCTION public.handle_new_user_tokens()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_tokens (user_id, balance, total_earned, total_spent) VALUES (NEW.id, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_user_profile_created_tokens AFTER INSERT ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_tokens();

-- 5. Functions

-- add_linkkon_tokens (hardened with auth check)
CREATE OR REPLACE FUNCTION public.add_linkkon_tokens(p_user_id UUID, p_amount INTEGER, p_source TEXT, p_description TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_new_balance INTEGER;
BEGIN
  IF auth.uid() != p_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
     RAISE EXCEPTION 'Unauthorized: UserId mismatch or not admin';
  END IF;

  INSERT INTO public.user_tokens (user_id, balance, total_earned) VALUES (p_user_id, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_tokens SET balance = balance + p_amount, total_earned = total_earned + p_amount, updated_at = now() WHERE user_id = p_user_id RETURNING balance INTO v_new_balance;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_user_id, p_amount, 'earn', p_source, p_description);
  RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'earned', p_amount);
END; $$;

-- spend_linkkon_tokens (hardened)
CREATE OR REPLACE FUNCTION public.spend_linkkon_tokens(p_user_id UUID, p_amount INTEGER, p_source TEXT, p_description TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current_balance INTEGER; v_new_balance INTEGER;
BEGIN
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

-- convert_tokens_to_premium (hardened)
CREATE OR REPLACE FUNCTION public.convert_tokens_to_premium(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current_balance INTEGER; v_current_trial TIMESTAMP WITH TIME ZONE; v_new_trial TIMESTAMP WITH TIME ZONE;
BEGIN
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

-- claim_daily_token_reward (hardened with validation)
CREATE OR REPLACE FUNCTION public.claim_daily_token_reward(
  p_user_id UUID,
  p_action_type TEXT,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_claimed BOOLEAN;
  v_new_balance NUMERIC;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: UserId mismatch';
  END IF;

  IF p_amount > 50 OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  IF p_action_type NOT IN ('add_block', 'daily_visit', 'use_ai', 'share_page', 'complete_profile') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_action_type');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM daily_token_limits
    WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND action_date = CURRENT_DATE
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_claimed_today');
  END IF;

  INSERT INTO daily_token_limits (user_id, action_type, action_date)
  VALUES (p_user_id, p_action_type, CURRENT_DATE);

  INSERT INTO user_tokens (user_id, balance, total_earned, total_spent)
  VALUES (p_user_id, p_amount, p_amount, 0)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_tokens.balance + p_amount,
      total_earned = user_tokens.total_earned + p_amount;

  SELECT balance INTO v_new_balance FROM user_tokens WHERE user_id = p_user_id;

  INSERT INTO token_transactions (user_id, amount, type, source)
  VALUES (p_user_id, p_amount, 'earn', p_action_type);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- process_marketplace_purchase (hardened with self-purchase and price validation)
CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(
  p_buyer_id UUID,
  p_seller_id UUID,
  p_item_type TEXT,
  p_item_id TEXT,
  p_price NUMERIC,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_platform_fee NUMERIC;
  v_net_amount NUMERIC;
  v_buyer_balance NUMERIC;
  v_total_cost NUMERIC;
BEGIN
  IF auth.uid() != p_buyer_id THEN
    RAISE EXCEPTION 'Unauthorized: UserId mismatch — only the buyer can initiate a purchase';
  END IF;

  IF p_buyer_id = p_seller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_buy_own_item');
  END IF;

  IF p_price <= 0 OR p_price > 100000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_price');
  END IF;

  v_platform_fee := ROUND(p_price * 0.04, 2);
  v_total_cost := p_price + v_platform_fee;
  v_net_amount := p_price;

  SELECT balance INTO v_buyer_balance
  FROM user_tokens
  WHERE user_id = p_buyer_id;

  IF v_buyer_balance IS NULL OR v_buyer_balance < v_total_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance');
  END IF;

  UPDATE user_tokens
  SET balance = balance - v_total_cost,
      total_spent = total_spent + v_total_cost
  WHERE user_id = p_buyer_id;

  IF p_seller_id IS NOT NULL THEN
    INSERT INTO user_tokens (user_id, balance, total_earned, total_spent)
    VALUES (p_seller_id, v_net_amount, v_net_amount, 0)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = user_tokens.balance + v_net_amount,
        total_earned = user_tokens.total_earned + v_net_amount;
  END IF;

  INSERT INTO token_transactions (
    user_id, amount, type, source, description,
    seller_id, buyer_id, item_type, item_id,
    original_price, platform_fee, net_amount
  ) VALUES (
    p_buyer_id, -v_total_cost, 'spend', p_item_type, p_description,
    p_seller_id, p_buyer_id, p_item_type, p_item_id,
    p_price, v_platform_fee, v_net_amount
  );

  IF p_seller_id IS NOT NULL THEN
    INSERT INTO token_transactions (
      user_id, amount, type, source, description,
      seller_id, buyer_id, item_type, item_id,
      original_price, platform_fee, net_amount
    ) VALUES (
      p_seller_id, v_net_amount, 'earn', 'sale_' || p_item_type, p_description,
      p_seller_id, p_buyer_id, p_item_type, p_item_id,
      p_price, v_platform_fee, v_net_amount
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'total_cost', v_total_cost,
    'platform_fee', v_platform_fee,
    'net_amount', v_net_amount
  );
END;
$$;

-- get_token_analytics (admin-only)
CREATE OR REPLACE FUNCTION public.get_token_analytics(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end DATE := COALESCE(p_end_date, CURRENT_DATE);
  v_result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  SELECT jsonb_build_object(
    'total_tokens_in_circulation', (SELECT COALESCE(SUM(balance), 0) FROM user_tokens),
    'total_earned_all_time', (SELECT COALESCE(SUM(total_earned), 0) FROM user_tokens),
    'total_spent_all_time', (SELECT COALESCE(SUM(total_spent), 0) FROM user_tokens),
    'premium_purchases', (
      SELECT COALESCE(SUM(ABS(amount)), 0) FROM token_transactions
      WHERE item_type = 'premium' AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'
    ),
    'template_purchases', (
      SELECT COALESCE(SUM(ABS(amount)), 0) FROM token_transactions
      WHERE item_type = 'template' AND type = 'spend' AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'
    ),
    'product_purchases', (
      SELECT COALESCE(SUM(ABS(amount)), 0) FROM token_transactions
      WHERE item_type = 'product' AND type = 'spend' AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'
    ),
    'platform_fees_earned', (
      SELECT COALESCE(SUM(platform_fee), 0) FROM token_transactions
      WHERE platform_fee IS NOT NULL AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'
    ),
    'pending_withdrawals', (
      SELECT COALESCE(SUM(amount), 0) FROM token_withdrawals WHERE status = 'pending'
    ),
    'completed_withdrawals', (
      SELECT COALESCE(SUM(amount), 0) FROM token_withdrawals
      WHERE status = 'completed' AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'
    ),
    'active_token_users', (
      SELECT COUNT(DISTINCT user_id) FROM token_transactions
      WHERE created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'
    ),
    'transactions_by_type', (
      SELECT jsonb_object_agg(COALESCE(item_type, source), cnt)
      FROM (
        SELECT COALESCE(item_type, source) as item_type, COUNT(*) as cnt
        FROM token_transactions
        WHERE created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'
        GROUP BY COALESCE(item_type, source)
      ) sub
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

COMMIT;
