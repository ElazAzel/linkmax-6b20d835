
-- Restore grants on public.pages (regression from prior security refactor left it inaccessible)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;

-- Anonymous visitors need to render published public profile pages, but must not read secrets.
-- Grant column-level SELECT excluding webhook_url, webhook_secret, integrations.
GRANT SELECT (
  id, user_id, slug, title, description, avatar_url, avatar_style,
  theme_settings, seo_meta, is_published, view_count, created_at, updated_at,
  editor_mode, grid_config, is_in_gallery, gallery_featured_at, gallery_likes,
  niche, preview_url, quality_score, is_indexable, last_snapshot_at,
  is_paid, is_primary_paid, page_type, favicon_url, hide_branding,
  organization_id, custom_domain, city, country_code, profession, entity_type,
  contact_email, contact_phone, contact_whatsapp, service_slugs,
  last_indexnow_at, index_exclusion_reasons, quality_breakdown,
  site_id, page_path, is_home
) ON public.pages TO anon;

-- Also restore grants on the public_pages view used by public-facing screens
GRANT SELECT ON public.public_pages TO anon, authenticated;
