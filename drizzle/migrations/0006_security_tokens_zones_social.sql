-- Token rewards: server-defined amounts, caller must be signed in
DROP FUNCTION IF EXISTS public.claim_daily_token_reward(uuid, text, integer);
DROP FUNCTION IF EXISTS public.complete_daily_quest(uuid, text, integer);

CREATE OR REPLACE FUNCTION public._credit_tokens(p_user_id uuid, p_amount numeric, p_source text, p_description text DEFAULT NULL)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_new_balance numeric;
BEGIN
  INSERT INTO public.user_tokens (user_id, balance, total_earned) VALUES (p_user_id, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_tokens SET balance = balance + p_amount, total_earned = total_earned + p_amount, updated_at = now()
   WHERE user_id = p_user_id RETURNING balance INTO v_new_balance;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_user_id, p_amount, 'earn', p_source, p_description);
  RETURN v_new_balance;
END; $$;
REVOKE ALL ON FUNCTION public._credit_tokens(uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_daily_token_reward(p_user_id uuid, p_action_type text, p_amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_amount numeric; v_new_balance numeric;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;
  -- Amount is defined by the server; p_amount is ignored.
  v_amount := CASE p_action_type WHEN 'daily_visit' THEN 0.9 WHEN 'add_block' THEN 1.8 WHEN 'use_ai' THEN 0.5 ELSE NULL END;
  IF v_amount IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'invalid_action'); END IF;
  -- add_block must correspond to a real block added today on the caller's page
  IF p_action_type = 'add_block' AND NOT EXISTS (
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

-- Direct token grants: admins only
CREATE OR REPLACE FUNCTION public.add_linkkon_tokens(p_user_id uuid, p_amount integer, p_source text, p_description text DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_new_balance numeric;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000 THEN
    RETURN json_build_object('success', false, 'error', 'invalid_amount');
  END IF;
  v_new_balance := public._credit_tokens(p_user_id, p_amount, p_source, p_description);
  RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'earned', p_amount);
END; $$;
REVOKE ALL ON FUNCTION public.add_linkkon_tokens(uuid, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_linkkon_tokens(uuid, integer, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_daily_quest(p_user_id uuid, p_quest_key text, p_tokens integer DEFAULT NULL, p_bonus_hours integer DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_token_amount integer;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;
  SELECT tokens INTO v_token_amount FROM public.daily_quest_definitions WHERE quest_key = p_quest_key;
  IF v_token_amount IS NULL THEN RETURN json_build_object('success', false, 'error', 'unknown_quest'); END IF;
  IF EXISTS (SELECT 1 FROM public.daily_quests_completed WHERE user_id = p_user_id AND quest_key = p_quest_key AND completed_date = CURRENT_DATE) THEN
    RETURN json_build_object('success', false, 'reason', 'already_completed');
  END IF;
  INSERT INTO public.daily_quests_completed (user_id, quest_key, completed_date) VALUES (p_user_id, p_quest_key, CURRENT_DATE);
  PERFORM public._credit_tokens(p_user_id, v_token_amount, 'daily_quest', p_quest_key);
  RETURN json_build_object('success', true, 'tokens_earned', v_token_amount);
END; $$;
REVOKE ALL ON FUNCTION public.complete_daily_quest(uuid, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_daily_quest(uuid, text, integer, integer) TO authenticated;

-- Zone creation: plan is set by the server (base plan), not the caller
CREATE OR REPLACE FUNCTION public.create_zone(p_name text, p_slug text, p_plan_code text DEFAULT 'business_5_m', p_plan_cycle text DEFAULT 'monthly')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_zone_id uuid;
  v_user_id uuid := auth.uid();
  v_plan text := 'business_5_m';
  v_cycle text := 'monthly';
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000'; END IF;
  INSERT INTO public.zones (name, slug, owner_user_id, plan_code, plan_cycle, current_period_end)
  VALUES (p_name, p_slug, v_user_id, v_plan, v_cycle, now() + interval '30 days') RETURNING id INTO v_zone_id;
  INSERT INTO public.zone_members (zone_id, user_id, role, status) VALUES (v_zone_id, v_user_id, 'owner', 'active');
  INSERT INTO public.zone_deal_stages (zone_id, name, color, order_index, is_default) VALUES
    (v_zone_id, 'Новый', '#6366f1', 0, true),
    (v_zone_id, 'В работе', '#f59e0b', 1, false),
    (v_zone_id, 'Предложение', '#3b82f6', 2, false),
    (v_zone_id, 'Согласование', '#8b5cf6', 3, false),
    (v_zone_id, 'Оплачен', '#10b981', 4, false),
    (v_zone_id, 'Закрыт', '#6b7280', 5, false);
  INSERT INTO public.zone_subscriptions (zone_id, plan_code, plan_cycle, status, current_period_end)
  VALUES (v_zone_id, v_plan, v_cycle, 'active', now() + interval '30 days');
  INSERT INTO public.zone_audit_log (zone_id, actor_user_id, action, entity_type, entity_id)
  VALUES (v_zone_id, v_user_id, 'zone_created', 'zone', v_zone_id);
  RETURN v_zone_id;
END; $$;
REVOKE ALL ON FUNCTION public.create_zone(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_zone(text, text, text, text) TO authenticated;

-- Only the recipient can accept/reject a friend or collaboration request
DROP POLICY IF EXISTS "Users can update friendships they're part of" ON public.friendships;
CREATE POLICY "Recipient can respond to friend requests" ON public.friendships
  FOR UPDATE TO authenticated USING (auth.uid() = friend_id) WITH CHECK (auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can update collaborations they're part of" ON public.collaborations;
CREATE POLICY "Target can respond to collaboration requests" ON public.collaborations
  FOR UPDATE TO authenticated USING (auth.uid() = target_id) WITH CHECK (auth.uid() = target_id);

-- One-time secret for newsletter owner notifications
ALTER TABLE public.newsletter_subscriptions ADD COLUMN IF NOT EXISTS notify_nonce text;