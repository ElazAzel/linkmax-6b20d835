
-- Restrict sensitive columns on `pages` from anonymous users.
-- contact_email / contact_phone / contact_whatsapp are owner-identity PII
-- and are not rendered on the public page. Hide them from `anon`.
REVOKE SELECT ON public.pages FROM anon;
GRANT SELECT (
  id, user_id, slug, title, description, avatar_url, avatar_style,
  theme_settings, seo_meta, is_published, view_count, created_at, updated_at,
  editor_mode, grid_config, is_in_gallery, gallery_featured_at, gallery_likes,
  niche, preview_url, quality_score, is_indexable, last_snapshot_at,
  is_paid, is_primary_paid, page_type, integrations, favicon_url,
  hide_branding, organization_id, custom_domain, city, country_code,
  profession, entity_type, service_slugs,
  site_id, page_path, is_home
) ON public.pages TO anon;

-- Tighten zone_automations: only admins can read configs (may carry credentials).
DROP POLICY IF EXISTS "Zone members view automations" ON public.zone_automations;
