CREATE OR REPLACE FUNCTION public.get_growth_metrics(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_now timestamptz := now();
  v_start timestamptz := v_now - (p_days || ' days')::interval;
  v_prev_start timestamptz := v_now - (p_days * 2 || ' days')::interval;
  v_prev_end timestamptz := v_start;
  
  v_total_users integer;
  v_new_users integer;
  v_prev_new_users integer;
  v_paid_users integer;
  v_total_pages integer;
  v_published_pages integer;
  v_total_leads integer;
  v_period_leads integer;
  v_prev_period_leads integer;
  v_total_bookings integer;
  v_period_bookings integer;
  v_gmv numeric;
  v_prev_gmv numeric;
  v_paid_orders integer;
  v_arpu numeric;
  v_conversion_rate numeric;
  v_dau integer;
  v_mau integer;
  v_trend_series jsonb;
BEGIN
  -- Admin only
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  -- Users
  SELECT count(*) INTO v_total_users FROM public.user_profiles;
  SELECT count(*) INTO v_new_users FROM public.user_profiles WHERE created_at >= v_start;
  SELECT count(*) INTO v_prev_new_users FROM public.user_profiles WHERE created_at >= v_prev_start AND created_at < v_prev_end;
  SELECT count(*) INTO v_paid_users FROM public.user_profiles WHERE COALESCE(premium_tier,'free') <> 'free';

  -- Pages
  SELECT count(*) INTO v_total_pages FROM public.pages;
  SELECT count(*) INTO v_published_pages FROM public.pages WHERE is_published = true;

  -- Leads
  SELECT count(*) INTO v_total_leads FROM public.leads;
  SELECT count(*) INTO v_period_leads FROM public.leads WHERE created_at >= v_start;
  SELECT count(*) INTO v_prev_period_leads FROM public.leads WHERE created_at >= v_prev_start AND created_at < v_prev_end;

  -- Bookings
  SELECT count(*) INTO v_total_bookings FROM public.bookings;
  SELECT count(*) INTO v_period_bookings FROM public.bookings WHERE created_at >= v_start;

  -- GMV from orders (status paid/success/completed)
  SELECT COALESCE(sum(amount),0), count(*) INTO v_gmv, v_paid_orders
  FROM public.orders
  WHERE status IN ('paid','success','completed','succeeded')
    AND created_at >= v_start;

  SELECT COALESCE(sum(amount),0) INTO v_prev_gmv
  FROM public.orders
  WHERE status IN ('paid','success','completed','succeeded')
    AND created_at >= v_prev_start AND created_at < v_prev_end;

  -- ARPU = GMV / paid_orders
  v_arpu := CASE WHEN v_paid_orders > 0 THEN v_gmv / v_paid_orders ELSE 0 END;
  
  -- Conversion: paid users / total users
  v_conversion_rate := CASE WHEN v_total_users > 0 THEN (v_paid_users::numeric / v_total_users::numeric) * 100 ELSE 0 END;

  -- MAU/DAU proxy via leads + bookings activity
  SELECT count(DISTINCT user_id) INTO v_mau
  FROM (
    SELECT user_id FROM public.leads WHERE created_at >= v_now - interval '30 days' AND user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.pages WHERE updated_at >= v_now - interval '30 days' AND user_id IS NOT NULL
  ) t;

  SELECT count(DISTINCT user_id) INTO v_dau
  FROM (
    SELECT user_id FROM public.leads WHERE created_at >= v_now - interval '1 day' AND user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.pages WHERE updated_at >= v_now - interval '1 day' AND user_id IS NOT NULL
  ) t;

  -- Daily trend series (last p_days)
  SELECT COALESCE(jsonb_agg(row_to_json(s) ORDER BY s.day), '[]'::jsonb) INTO v_trend_series
  FROM (
    SELECT
      d::date AS day,
      (SELECT count(*) FROM public.user_profiles up WHERE up.created_at::date = d::date) AS new_users,
      (SELECT count(*) FROM public.leads l WHERE l.created_at::date = d::date) AS leads,
      (SELECT COALESCE(sum(amount),0) FROM public.orders o WHERE o.created_at::date = d::date AND o.status IN ('paid','success','completed','succeeded')) AS gmv
    FROM generate_series(v_start::date, v_now::date, '1 day'::interval) AS d
  ) s;

  RETURN jsonb_build_object(
    'period_days', p_days,
    'generated_at', v_now,
    'users', jsonb_build_object(
      'total', v_total_users,
      'new_period', v_new_users,
      'new_prev_period', v_prev_new_users,
      'paid', v_paid_users,
      'mau', v_mau,
      'dau', v_dau,
      'conversion_rate', round(v_conversion_rate, 2)
    ),
    'pages', jsonb_build_object(
      'total', v_total_pages,
      'published', v_published_pages
    ),
    'leads', jsonb_build_object(
      'total', v_total_leads,
      'period', v_period_leads,
      'prev_period', v_prev_period_leads
    ),
    'bookings', jsonb_build_object(
      'total', v_total_bookings,
      'period', v_period_bookings
    ),
    'revenue', jsonb_build_object(
      'gmv_period', v_gmv,
      'gmv_prev_period', v_prev_gmv,
      'paid_orders', v_paid_orders,
      'arpu', round(v_arpu, 2)
    ),
    'trend', v_trend_series
  );
END;
$$;