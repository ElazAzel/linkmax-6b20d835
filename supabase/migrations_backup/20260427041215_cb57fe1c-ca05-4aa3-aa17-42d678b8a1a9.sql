CREATE OR REPLACE FUNCTION public.get_public_trust_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_users integer;
  v_published_pages integer;
  v_total_leads integer;
  v_total_bookings integer;
  v_gallery jsonb;
BEGIN
  SELECT count(*) INTO v_total_users FROM public.user_profiles;
  SELECT count(*) INTO v_published_pages FROM public.pages WHERE is_published = true;
  SELECT count(*) INTO v_total_leads FROM public.leads;
  SELECT count(*) INTO v_total_bookings FROM public.bookings;

  SELECT COALESCE(jsonb_agg(row_to_json(g) ORDER BY g.gallery_featured_at DESC NULLS LAST), '[]'::jsonb)
  INTO v_gallery
  FROM (
    SELECT
      p.id,
      p.slug,
      COALESCE(p.title, p.slug) AS title,
      p.avatar_url,
      p.niche,
      p.city,
      p.gallery_likes,
      p.gallery_featured_at
    FROM public.pages p
    WHERE p.is_in_gallery = true
      AND p.is_published = true
    ORDER BY p.gallery_featured_at DESC NULLS LAST
    LIMIT 12
  ) g;

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'published_pages', v_published_pages,
    'total_leads', v_total_leads,
    'total_bookings', v_total_bookings,
    'gallery', v_gallery,
    'generated_at', now()
  );
END;
$$;

-- Allow anon and authenticated to call it
GRANT EXECUTE ON FUNCTION public.get_public_trust_metrics() TO anon, authenticated;