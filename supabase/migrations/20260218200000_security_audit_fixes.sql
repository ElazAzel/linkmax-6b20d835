-- ==============================================
-- Security Audit Fixes — 2026-02-18
-- Addresses critical findings from deep audit
-- ==============================================

-- ==============================================
-- 1. FIX: get_token_analytics — Add admin-only check
-- BEFORE: Any authenticated user could see all platform token stats
-- ==============================================
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
  -- SECURITY: Only admins can view platform-wide token analytics
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

-- ==============================================
-- 2. FIX: claim_daily_token_reward — Add auth.uid() check
-- BEFORE: Any user could claim rewards for any other user
-- ==============================================
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
  -- SECURITY: Only the user themselves can claim their daily reward
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: UserId mismatch';
  END IF;

  -- Validate amount to prevent abuse (max 50 tokens per daily claim)
  IF p_amount > 50 OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  -- Validate action_type to prevent injection of arbitrary sources
  IF p_action_type NOT IN ('add_block', 'daily_visit', 'use_ai', 'share_page', 'complete_profile') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_action_type');
  END IF;

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

-- ==============================================
-- 3. FIX: process_marketplace_purchase — Add auth.uid() check
-- BEFORE: Any user could initiate purchases on behalf of others
-- ==============================================
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
  -- SECURITY: Only the buyer themselves can initiate a purchase
  IF auth.uid() != p_buyer_id THEN
    RAISE EXCEPTION 'Unauthorized: UserId mismatch — only the buyer can initiate a purchase';
  END IF;

  -- Prevent self-purchase
  IF p_buyer_id = p_seller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_buy_own_item');
  END IF;

  -- Validate price
  IF p_price <= 0 OR p_price > 100000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_price');
  END IF;

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

-- ==============================================
-- 4. FIX: Bookings — Add double-booking prevention and timezone
-- ==============================================

-- Add timezone column
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Almaty';

-- Add unique constraint to prevent double-bookings
-- First drop if exists to be idempotent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_double_booking'
  ) THEN
    -- Only active bookings count (exclude cancelled)
    -- We use a partial unique index instead of a constraint for the status filter
    CREATE UNIQUE INDEX bookings_no_double_booking 
    ON public.bookings (page_id, block_id, slot_date, slot_time) 
    WHERE status != 'cancelled';
  END IF;
END $$;

-- ==============================================
-- 5. FIX: Ensure security migration policies are present
-- (Idempotent — safe to re-run if already applied)
-- ==============================================

-- Drop the overly permissive booking policy if it still exists
DROP POLICY IF EXISTS "Anyone can view bookings for public pages" ON public.bookings;

-- Ensure proper booking policies exist
DROP POLICY IF EXISTS "Owners can view all their bookings" ON public.bookings;
CREATE POLICY "Owners can view all their bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = user_id);
