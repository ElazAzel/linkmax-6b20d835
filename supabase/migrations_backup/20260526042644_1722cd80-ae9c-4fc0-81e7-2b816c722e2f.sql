CREATE OR REPLACE FUNCTION public.get_site_pages_stats(_site_id uuid, _days int DEFAULT 30)
RETURNS TABLE (page_id uuid, views bigint, clicks bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS page_id,
    COUNT(*) FILTER (WHERE a.event_type = 'page_view') AS views,
    COUNT(*) FILTER (WHERE a.event_type = 'block_click') AS clicks
  FROM pages p
  LEFT JOIN analytics a
    ON a.page_id = p.id
   AND a.created_at >= now() - make_interval(days => _days)
  WHERE p.site_id = _site_id
    AND EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = _site_id AND s.user_id = auth.uid()
    )
  GROUP BY p.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_site_pages_stats(uuid, int) TO authenticated;