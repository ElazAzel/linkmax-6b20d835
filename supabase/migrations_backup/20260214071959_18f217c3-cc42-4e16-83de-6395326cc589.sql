
-- Fix: Token economy functions - add auth.uid() checks to prevent unauthorized manipulation

-- add_linkkon_tokens: allow admin OR self
CREATE OR REPLACE FUNCTION public.add_linkkon_tokens(p_user_id uuid, p_amount integer, p_source text, p_description text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_new_balance INTEGER;
BEGIN
  IF p_user_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;

  INSERT INTO public.user_tokens (user_id, balance, total_earned) VALUES (p_user_id, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_tokens SET balance = balance + p_amount, total_earned = total_earned + p_amount, updated_at = now() WHERE user_id = p_user_id RETURNING balance INTO v_new_balance;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_user_id, p_amount, 'earn', p_source, p_description);
  RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'earned', p_amount);
END;
$$;

-- spend_linkkon_tokens: only self
CREATE OR REPLACE FUNCTION public.spend_linkkon_tokens(p_user_id uuid, p_amount integer, p_source text, p_description text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_current_balance INTEGER; v_new_balance INTEGER;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;

  SELECT balance INTO v_current_balance FROM public.user_tokens WHERE user_id = p_user_id;
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'insufficient_balance', 'balance', COALESCE(v_current_balance, 0));
  END IF;
  UPDATE public.user_tokens SET balance = balance - p_amount, total_spent = total_spent + p_amount, updated_at = now() WHERE user_id = p_user_id RETURNING balance INTO v_new_balance;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_user_id, -p_amount, 'spend', p_source, p_description);
  RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'spent', p_amount);
END;
$$;

-- claim_daily_token_reward: only self
CREATE OR REPLACE FUNCTION public.claim_daily_token_reward(p_user_id uuid, p_action_type text, p_amount integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_claimed BOOLEAN;
  v_new_balance NUMERIC;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
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

-- complete_daily_quest: only self
CREATE OR REPLACE FUNCTION public.complete_daily_quest(p_user_id uuid, p_quest_key text, p_bonus_hours integer DEFAULT 1)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_today DATE := CURRENT_DATE; v_already_completed BOOLEAN; v_token_amount INTEGER;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.daily_quests_completed WHERE user_id = p_user_id AND quest_key = p_quest_key AND completed_date = v_today) INTO v_already_completed;
  IF v_already_completed THEN RETURN json_build_object('success', false, 'reason', 'already_completed'); END IF;
  v_token_amount := GREATEST(p_bonus_hours * 5, 5);
  INSERT INTO public.daily_quests_completed (user_id, quest_key, completed_date) VALUES (p_user_id, p_quest_key, v_today);
  PERFORM public.add_linkkon_tokens(p_user_id, v_token_amount, 'daily_quest', p_quest_key);
  RETURN json_build_object('success', true, 'tokens_earned', v_token_amount);
END;
$$;

-- process_marketplace_purchase: caller must be buyer
CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(p_buyer_id uuid, p_seller_id uuid, p_price integer, p_item_type text, p_item_id text, p_description text DEFAULT NULL)
RETURNS json
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
  IF p_buyer_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  v_platform_fee := ROUND(p_price * 0.04, 2);
  v_total_cost := p_price + v_platform_fee;
  v_net_amount := p_price;
  
  SELECT balance INTO v_buyer_balance FROM user_tokens WHERE user_id = p_buyer_id;
  
  IF v_buyer_balance IS NULL OR v_buyer_balance < v_total_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance');
  END IF;
  
  UPDATE user_tokens SET balance = balance - v_total_cost, total_spent = total_spent + v_total_cost WHERE user_id = p_buyer_id;
  
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
      p_seller_id, v_net_amount, 'earn', p_item_type, p_description,
      p_seller_id, p_buyer_id, p_item_type, p_item_id,
      p_price, v_platform_fee, v_net_amount
    );
  END IF;
  
  RETURN jsonb_build_object('success', true, 'total_cost', v_total_cost, 'platform_fee', v_platform_fee);
END;
$$;
