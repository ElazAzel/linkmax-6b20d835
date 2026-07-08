
-- 1) pages: скрыть user_id у анонимов через column-level GRANT
REVOKE SELECT ON public.pages FROM anon;
GRANT SELECT (
  id, slug, title, description, avatar_url, avatar_style, theme_settings, seo_meta,
  is_published, view_count, created_at, updated_at, editor_mode, grid_config,
  is_in_gallery, gallery_featured_at, gallery_likes, niche, preview_url,
  quality_score, is_indexable, last_snapshot_at, is_paid, is_primary_paid,
  page_type, integrations, favicon_url, hide_branding, organization_id,
  custom_domain, city, country_code, profession, entity_type,
  contact_email, contact_phone, contact_whatsapp, service_slugs,
  last_indexnow_at, index_exclusion_reasons, quality_breakdown,
  site_id, page_path, is_home
) ON public.pages TO anon;

-- 2) zone_automations: убрать config/name из доступа для authenticated
REVOKE SELECT ON public.zone_automations FROM authenticated;
GRANT SELECT (
  id, zone_id, trigger_type, action_type, is_active, created_at, updated_at
) ON public.zone_automations TO authenticated;
