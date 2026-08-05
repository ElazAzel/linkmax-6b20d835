CREATE OR REPLACE FUNCTION public.aggregate_usage(
  _subscription_id uuid,
  _metric_code text,
  _period_start timestamptz,
  _period_end timestamptz
) RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.offer_subscriptions os
    WHERE os.id = _subscription_id
      AND (os.seller_user_id = auth.uid() OR os.customer_user_id = auth.uid())
  ) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO v_total
  FROM public.usage_events
  WHERE subscription_id = _subscription_id
    AND metric_code = _metric_code
    AND occurred_at >= _period_start
    AND occurred_at < _period_end;

  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.aggregate_usage(uuid, text, timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aggregate_usage(uuid, text, timestamptz, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.aggregate_usage(uuid, text, timestamptz, timestamptz) TO authenticated, service_role;