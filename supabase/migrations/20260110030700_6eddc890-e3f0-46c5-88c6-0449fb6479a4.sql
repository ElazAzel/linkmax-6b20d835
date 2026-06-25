-- Update token economy tables for marketplace transactions

-- Add new columns to token_transactions for marketplace
ALTER TABLE public.token_transactions 
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS item_type TEXT, -- 'template', 'product', 'block_access', 'premium'
ADD COLUMN IF NOT EXISTS item_id TEXT,
ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS net_amount NUMERIC(10,2);

-- Create token withdrawal requests table
CREATE TABLE IF NOT EXISTS public.token_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed
  payment_method TEXT, -- kaspi, bank_transfer
  payment_details JSONB,
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create daily token limits table to track once-per-day rewards
CREATE TABLE IF NOT EXISTS public.daily_token_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'add_block', 'daily_visit', 'use_ai'
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  claimed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, action_type, action_date)
);

-- Enable RLS on new tables
ALTER TABLE public.token_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_token_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for token_withdrawals
CREATE POLICY "Users can view their own withdrawals" 
ON public.token_withdrawals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests" 
ON public.token_withdrawals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals"
ON public.token_withdrawals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update withdrawals"
ON public.token_withdrawals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS policies for daily_token_limits
CREATE POLICY "Users can view their own limits" 
ON public.daily_token_limits FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own limits" 
ON public.daily_token_limits FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Function to process marketplace purchase with platform fee
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
  -- Calculate platform fee (4%)
  v_platform_fee := ROUND(p_price * 0.04, 2);
  v_total_cost := p_price + v_platform_fee;
  v_net_amount := p_price;
  
  -- Check buyer balance
  SELECT balance INTO v_buyer_balance
  FROM user_tokens
  WHERE user_id = p_buyer_id;
  
  IF v_buyer_balance IS NULL OR v_buyer_balance < v_total_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance');
  END IF;
  
  -- Deduct from buyer
  UPDATE user_tokens
  SET balance = balance - v_total_cost,
      total_spent = total_spent + v_total_cost
  WHERE user_id = p_buyer_id;
  
  -- Add to seller (if not platform purchase like premium)
  IF p_seller_id IS NOT NULL THEN
    INSERT INTO user_tokens (user_id, balance, total_earned, total_spent)
    VALUES (p_seller_id, v_net_amount, v_net_amount, 0)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = user_tokens.balance + v_net_amount,
        total_earned = user_tokens.total_earned + v_net_amount;
  END IF;
  
  -- Record buyer transaction
  INSERT INTO token_transactions (
    user_id, amount, type, source, description,
    seller_id, buyer_id, item_type, item_id,
    original_price, platform_fee, net_amount
  ) VALUES (
    p_buyer_id, -v_total_cost, 'spend', p_item_type, p_description,
    p_seller_id, p_buyer_id, p_item_type, p_item_id,
    p_price, v_platform_fee, v_net_amount
  );
  
  -- Record seller transaction (if applicable)
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

-- Function to check and claim daily token reward
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
  -- Check if already claimed today
  SELECT EXISTS(
    SELECT 1 FROM daily_token_limits
    WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND action_date = CURRENT_DATE
  ) INTO v_already_claimed;
  
  IF v_already_claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_claimed_today');
  END IF;
  
  -- Record the claim
  INSERT INTO daily_token_limits (user_id, action_type, action_date)
  VALUES (p_user_id, p_action_type, CURRENT_DATE);
  
  -- Add tokens
  INSERT INTO user_tokens (user_id, balance, total_earned, total_spent)
  VALUES (p_user_id, p_amount, p_amount, 0)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_tokens.balance + p_amount,
      total_earned = user_tokens.total_earned + p_amount;
  
  SELECT balance INTO v_new_balance FROM user_tokens WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO token_transactions (user_id, amount, type, source)
  VALUES (p_user_id, p_amount, 'earn', p_action_type);
  
  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- Function for admin to get token analytics
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