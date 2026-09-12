CREATE OR REPLACE FUNCTION public.get_admin_dashboard_aggregates(p_days integer DEFAULT 14, p_cumulative_days integer DEFAULT 30, p_block_limit integer DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_start timestamptz := now() - (p_days || ' days')::interval;
  v_daily jsonb;
  v_user_status jsonb;
  v_events jsonb;
  v_cumulative jsonb;
  v_social jsonb;
  v_blocks jsonb;
  v_total_users bigint;
  v_premium bigint;
  v_trial bigint;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  -- Daily growth: one row per day with all counts pre-aggregated
  WITH days AS (
    SELECT generate_series(date_trunc('day', v_start), date_trunc('day', now()), interval '1 day')::date AS d
  ),
  u AS (SELECT created_at::date AS d, count(*) c FROM public.user_profiles WHERE created_at >= v_start GROUP BY 1),
  p AS (SELECT created_at::date AS d, count(*) c FROM public.pages WHERE created_at >= v_start GROUP BY 1),
  a AS (
    SELECT created_at::date AS d, event_type, count(*) c
    FROM public.analytics WHERE created_at >= v_start
    GROUP BY 1,2
  ),
  b AS (SELECT created_at::date AS d, count(*) c FROM public.blocks WHERE created_at >= v_start GROUP BY 1),
  f AS (SELECT created_at::date AS d, count(*) c FROM public.friendships WHERE created_at >= v_start GROUP BY 1),
  co AS (SELECT created_at::date AS d, count(*) c FROM public.collaborations WHERE created_at >= v_start GROUP BY 1)
  SELECT jsonb_agg(jsonb_build_object(
    'date', to_char(days.d, 'DD.MM'),
    'users', COALESCE(u.c,0),
    'pages', COALESCE(p.c,0),
    'views', COALESCE((SELECT c FROM a WHERE a.d = days.d AND a.event_type='view'),0),
    'clicks', COALESCE((SELECT c FROM a WHERE a.d = days.d AND a.event_type='click'),0),
    'shares', COALESCE((SELECT c FROM a WHERE a.d = days.d AND a.event_type='share'),0),
    'blocks', COALESCE(b.c,0),
    'friendships', COALESCE(f.c,0),
    'collabs', COALESCE(co.c,0)
  ) ORDER BY days.d) INTO v_daily
  FROM days
  LEFT JOIN u ON u.d = days.d
  LEFT JOIN p ON p.d = days.d
  LEFT JOIN b ON b.d = days.d
  LEFT JOIN f ON f.d = days.d
  LEFT JOIN co ON co.d = days.d;

  -- User status distribution
  SELECT
    count(*) FILTER (WHERE is_premium = true),
    count(*) FILTER (WHERE is_premium = false AND trial_ends_at > now()),
    count(*)
  INTO v_premium, v_trial, v_total_users
  FROM public.user_profiles;

  v_user_status := jsonb_build_array(
    jsonb_build_object('name','Premium','value',v_premium,'color','#eab308'),
    jsonb_build_object('name','Trial','value',v_trial,'color','#3b82f6'),
    jsonb_build_object('name','Free','value',GREATEST(0, v_total_users - v_premium - v_trial),'color','#6b7280')
  );

  -- Event distribution (all-time)
  WITH ec AS (
    SELECT event_type, count(*) c FROM public.analytics
    WHERE event_type IN ('view','click','share') GROUP BY 1
  )
  SELECT jsonb_build_array(
    jsonb_build_object('name','Views','count',COALESCE((SELECT c FROM ec WHERE event_type='view'),0),'color','#06b6d4'),
    jsonb_build_object('name','Clicks','count',COALESCE((SELECT c FROM ec WHERE event_type='click'),0),'color','#f97316'),
    jsonb_build_object('name','Shares','count',COALESCE((SELECT c FROM ec WHERE event_type='share'),0),'color','#ec4899')
  ) INTO v_events;

  -- Cumulative users: running total per signup day, last N days
  WITH by_day AS (
    SELECT created_at::date AS d, count(*) c FROM public.user_profiles
    WHERE created_at IS NOT NULL GROUP BY 1
  ),
  running AS (
    SELECT d, sum(c) OVER (ORDER BY d) AS total FROM by_day
  ),
  tail AS (SELECT * FROM running ORDER BY d DESC LIMIT p_cumulative_days)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('date', to_char(d,'DD.MM'),'total', total) ORDER BY d), '[]'::jsonb)
  INTO v_cumulative FROM tail;

  -- Social stats
  SELECT jsonb_build_array(
    jsonb_build_object('name','Friends',
      'total',(SELECT count(*) FROM public.friendships),
      'accepted',(SELECT count(*) FROM public.friendships WHERE status='accepted')),
    jsonb_build_object('name','Collabs',
      'total',(SELECT count(*) FROM public.collaborations),
      'accepted',(SELECT count(*) FROM public.collaborations WHERE status='accepted')),
    jsonb_build_object('name','Teams',
      'total',(SELECT count(*) FROM public.teams),
      'accepted',(SELECT count(*) FROM public.teams))
  ) INTO v_social;

  -- Block type stats (top N)
  WITH bt AS (
    SELECT type, count(*) c FROM public.blocks GROUP BY type ORDER BY c DESC LIMIT p_block_limit
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'name', initcap(type),
    'count', c
  ) ORDER BY c DESC), '[]'::jsonb) INTO v_blocks FROM bt;

  RETURN jsonb_build_object(
    'dailyGrowth', COALESCE(v_daily,'[]'::jsonb),
    'userDistribution', v_user_status,
    'eventDistribution', v_events,
    'cumulativeUsers', v_cumulative,
    'socialStats', v_social,
    'blockTypeStats', v_blocks
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_aggregates(integer, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_aggregates(integer, integer, integer) TO authenticated;