-- Update upsert_user_page to support webhooks
DROP FUNCTION IF EXISTS public.upsert_user_page(uuid, text, text, text, text, jsonb, jsonb, jsonb, text, jsonb, jsonb, text, boolean, uuid);

CREATE OR REPLACE FUNCTION public.upsert_user_page(
  p_user_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_avatar_url text,
  p_avatar_style jsonb,
  p_theme_settings jsonb,
  p_seo_meta jsonb,
  p_editor_mode text DEFAULT 'linear',
  p_grid_config jsonb DEFAULT NULL,
  p_integrations jsonb DEFAULT NULL,
  p_favicon_url text DEFAULT NULL,
  p_hide_branding boolean DEFAULT false,
  p_organization_id uuid DEFAULT NULL,
  p_webhook_url text DEFAULT NULL,
  p_webhook_secret text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_page_id uuid;
BEGIN
  -- Security check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify organization access if applicable
  IF p_organization_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE org_id = p_organization_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ) THEN
      RAISE EXCEPTION 'Unauthorized: User is not an editor of this organization';
    END IF;
  END IF;

  -- Find existing page
  SELECT id INTO v_page_id FROM public.pages WHERE slug = p_slug;

  IF v_page_id IS NULL THEN
    INSERT INTO public.pages (
      user_id, slug, title, description, avatar_url, avatar_style, 
      theme_settings, seo_meta, is_published, editor_mode, grid_config,
      integrations, favicon_url, hide_branding, organization_id,
      webhook_url, webhook_secret
    )
    VALUES (
      p_user_id, p_slug, p_title, p_description, p_avatar_url, p_avatar_style,
      p_theme_settings, p_seo_meta, false, COALESCE(p_editor_mode, 'linear'), p_grid_config,
      p_integrations, p_favicon_url, p_hide_branding, p_organization_id,
      p_webhook_url, p_webhook_secret
    )
    RETURNING id INTO v_page_id;
  ELSE
    UPDATE public.pages
    SET
      slug = p_slug,
      title = p_title,
      description = p_description,
      avatar_url = p_avatar_url,
      avatar_style = p_avatar_style,
      theme_settings = p_theme_settings,
      seo_meta = p_seo_meta,
      editor_mode = COALESCE(p_editor_mode, 'linear'),
      grid_config = p_grid_config,
      integrations = p_integrations,
      favicon_url = p_favicon_url,
      hide_branding = p_hide_branding,
      organization_id = COALESCE(p_organization_id, organization_id),
      webhook_url = p_webhook_url,
      webhook_secret = p_webhook_secret,
      updated_at = now()
    WHERE id = v_page_id;
  END IF;

  RETURN v_page_id;
END;
$function$;
