CREATE OR REPLACE FUNCTION public.claim_daily_token_reward(p_user_id uuid, p_action_type text, p_amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_amount numeric; v_new_balance numeric;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;
  -- Only server-verifiable actions earn tokens; amount is server-defined.
  v_amount := CASE p_action_type WHEN 'add_block' THEN 1.8 ELSE NULL END;
  IF v_amount IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'invalid_action'); END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.blocks b JOIN public.pages p ON p.id = b.page_id
    WHERE p.user_id = p_user_id AND b.created_at >= CURRENT_DATE) THEN
    RETURN jsonb_build_object('success', false, 'error', 'action_not_performed');
  END IF;
  IF EXISTS (SELECT 1 FROM public.daily_token_limits WHERE user_id = p_user_id AND action_type = p_action_type AND action_date = CURRENT_DATE) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_claimed_today');
  END IF;
  INSERT INTO public.daily_token_limits (user_id, action_type, action_date) VALUES (p_user_id, p_action_type, CURRENT_DATE);
  v_new_balance := public._credit_tokens(p_user_id, v_amount, p_action_type, NULL);
  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END; $$;
REVOKE ALL ON FUNCTION public.claim_daily_token_reward(uuid, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_token_reward(uuid, text, numeric) TO authenticated;