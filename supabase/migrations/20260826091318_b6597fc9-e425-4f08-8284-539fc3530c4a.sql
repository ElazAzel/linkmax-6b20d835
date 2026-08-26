-- 1. aggregate_usage: ownership check
CREATE OR REPLACE FUNCTION public.aggregate_usage(
  _subscription_id uuid, _metric_code text,
  _period_start timestamptz, _period_end timestamptz
) RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_allowed boolean; v_total numeric;
BEGIN
  IF current_user = 'service_role' THEN
    v_allowed := true;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.offer_subscriptions s
      WHERE s.id = _subscription_id AND auth.uid() IS NOT NULL
        AND (s.seller_user_id = auth.uid() OR s.customer_user_id = auth.uid())
    ) INTO v_allowed;
  END IF;
  IF NOT v_allowed THEN RAISE EXCEPTION 'not_authorized'; END IF;
  SELECT COALESCE(SUM(quantity), 0) INTO v_total
  FROM public.usage_events
  WHERE subscription_id = _subscription_id AND metric_code = _metric_code
    AND occurred_at >= _period_start AND occurred_at < _period_end;
  RETURN v_total;
END; $$;

REVOKE ALL ON FUNCTION public.aggregate_usage(uuid, text, timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aggregate_usage(uuid, text, timestamptz, timestamptz) TO authenticated, service_role;

-- 2. complete_daily_quest: server-side reward definitions
CREATE TABLE IF NOT EXISTS public.daily_quest_definitions (
  quest_key text PRIMARY KEY,
  tokens integer NOT NULL CHECK (tokens > 0 AND tokens <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_quest_definitions TO authenticated, anon;
GRANT ALL ON public.daily_quest_definitions TO service_role;
ALTER TABLE public.daily_quest_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Quest definitions are readable by everyone" ON public.daily_quest_definitions;
CREATE POLICY "Quest definitions are readable by everyone"
ON public.daily_quest_definitions FOR SELECT USING (true);

INSERT INTO public.daily_quest_definitions (quest_key, tokens) VALUES
  ('daily_visit', 5), ('add_block', 10), ('edit_profile', 5),
  ('share_page', 10), ('use_ai', 15)
ON CONFLICT (quest_key) DO UPDATE SET tokens = EXCLUDED.tokens;

CREATE OR REPLACE FUNCTION public.complete_daily_quest(
  p_user_id uuid, p_quest_key text,
  p_tokens integer DEFAULT NULL, p_bonus_hours integer DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_already_completed BOOLEAN;
  v_token_amount INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;
  SELECT tokens INTO v_token_amount FROM public.daily_quest_definitions WHERE quest_key = p_quest_key;
  IF v_token_amount IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'unknown_quest');
  END IF;
  SELECT EXISTS(
    SELECT 1 FROM public.daily_quests_completed
    WHERE user_id = p_user_id AND quest_key = p_quest_key AND completed_date = v_today
  ) INTO v_already_completed;
  IF v_already_completed THEN
    RETURN json_build_object('success', false, 'reason', 'already_completed');
  END IF;
  INSERT INTO public.daily_quests_completed (user_id, quest_key, completed_date)
  VALUES (p_user_id, p_quest_key, v_today);
  PERFORM public.add_linkkon_tokens(p_user_id, v_token_amount, 'daily_quest', p_quest_key);
  RETURN json_build_object('success', true, 'tokens_earned', v_token_amount);
END; $$;

-- 3. upsert_telegram_account: only owner or trusted server callers
CREATE OR REPLACE FUNCTION public.upsert_telegram_account(
  p_user_id uuid, p_telegram_user_id bigint, p_username text DEFAULT NULL,
  p_first_name text DEFAULT NULL, p_last_name text DEFAULT NULL,
  p_language_code text DEFAULT 'ru', p_photo_url text DEFAULT NULL,
  p_allows_write_to_pm boolean DEFAULT true, p_is_premium boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user <> 'service_role' AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  INSERT INTO public.telegram_accounts (
    id, telegram_user_id, username, first_name, last_name,
    language_code, photo_url, allows_write_to_pm, is_premium, last_auth_date, updated_at
  ) VALUES (
    p_user_id, p_telegram_user_id, p_username, p_first_name, p_last_name,
    p_language_code, p_photo_url, p_allows_write_to_pm, p_is_premium, now(), now()
  )
  ON CONFLICT (telegram_user_id) DO UPDATE SET
    username = COALESCE(EXCLUDED.username, telegram_accounts.username),
    first_name = COALESCE(EXCLUDED.first_name, telegram_accounts.first_name),
    last_name = COALESCE(EXCLUDED.last_name, telegram_accounts.last_name),
    language_code = COALESCE(EXCLUDED.language_code, telegram_accounts.language_code),
    photo_url = COALESCE(EXCLUDED.photo_url, telegram_accounts.photo_url),
    allows_write_to_pm = EXCLUDED.allows_write_to_pm,
    is_premium = EXCLUDED.is_premium,
    last_auth_date = now(), updated_at = now()
  WHERE telegram_accounts.id = EXCLUDED.id;
END; $$;

REVOKE ALL ON FUNCTION public.upsert_telegram_account(uuid, bigint, text, text, text, text, text, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_telegram_account(uuid, bigint, text, text, text, text, text, boolean, boolean) TO authenticated, service_role;