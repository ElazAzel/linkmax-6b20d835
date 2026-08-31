
-- Recreate get_token_analytics to fix stale column reference
CREATE OR REPLACE FUNCTION public.get_token_analytics(p_start_date date DEFAULT NULL, p_end_date date DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_start DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end DATE := COALESCE(p_end_date, CURRENT_DATE);
  v_result JSONB;
BEGIN
  -- Admin check
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT jsonb_build_object(
    'total_tokens_in_circulation', (SELECT COALESCE(SUM(balance), 0) FROM public.user_tokens),
    'total_earned_all_time', (SELECT COALESCE(SUM(total_earned), 0) FROM public.user_tokens),
    'total_spent_all_time', (SELECT COALESCE(SUM(total_spent), 0) FROM public.user_tokens),
    'premium_purchases', (
      SELECT COALESCE(SUM(ABS(amount)), 0) FROM public.token_transactions 
      WHERE item_type = 'premium' AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'
    ),
    'template_purchases', (
      SELECT COALESCE(SUM(ABS(amount)), 0) FROM public.token_transactions 
      WHERE item_type = 'template' AND type = 'spend' AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'
    ),
    'product_purchases', (
      SELECT COALESCE(SUM(ABS(amount)), 0) FROM public.token_transactions 
      WHERE item_type = 'product' AND type = 'spend' AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'
    ),
    'platform_fees_earned', (
      SELECT COALESCE(SUM(platform_fee), 0) FROM public.token_transactions 
      WHERE platform_fee IS NOT NULL AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'
    ),
    'pending_withdrawals', (
      SELECT COALESCE(SUM(amount), 0) FROM public.token_withdrawals WHERE status = 'pending'
    ),
    'completed_withdrawals', (
      SELECT COALESCE(SUM(amount), 0) FROM public.token_withdrawals 
      WHERE status = 'completed' AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'
    ),
    'active_token_users', (
      SELECT COUNT(DISTINCT user_id) FROM public.token_transactions 
      WHERE created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'
    ),
    'transactions_by_type', (
      SELECT COALESCE(jsonb_object_agg(tx_type, cnt), '{}'::jsonb)
      FROM (
        SELECT COALESCE(t.item_type, t.source) as tx_type, COUNT(*) as cnt
        FROM public.token_transactions t
        WHERE t.created_at >= v_start AND t.created_at <= v_end + INTERVAL '1 day'
        GROUP BY COALESCE(t.item_type, t.source)
      ) sub
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$;
