
REVOKE SELECT ON public.pages FROM authenticated;
GRANT SELECT (
  id, user_id, slug, title, description, avatar_url, avatar_style,
  theme_settings, seo_meta, is_published, view_count, created_at, updated_at,
  editor_mode, grid_config, is_in_gallery, gallery_featured_at, gallery_likes,
  niche, preview_url, quality_score, is_indexable, last_snapshot_at,
  is_paid, is_primary_paid, page_type, integrations, favicon_url,
  hide_branding, organization_id, custom_domain, city, country_code,
  profession, entity_type, service_slugs,
  site_id, page_path, is_home, last_indexnow_at
) ON public.pages TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_full_page(p_user_id uuid DEFAULT auth.uid())
RETURNS SETOF public.pages
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.pages
  WHERE user_id = p_user_id
    AND auth.uid() = p_user_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_full_page(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_full_page(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_my_full_page(uuid) IS
  'Returns the caller''s own page row including sensitive columns. Authenticated users no longer have direct SELECT on those columns.';
