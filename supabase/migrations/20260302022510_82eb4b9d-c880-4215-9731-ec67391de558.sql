-- Fix upsert_user_page authorization bypass: add ownership check before UPDATE

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
  p_organization_id uuid DEFAULT NULL
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

  -- Ensure p_user_id matches the authenticated user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: p_user_id does not match authenticated user';
  END IF;

  -- Verify user has access to the organization if provided
  IF p_organization_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.zone_members 
      WHERE zone_id = p_organization_id AND user_id = auth.uid() AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Unauthorized: User is not a member of this organization';
    END IF;
  END IF;

  -- Find existing page owned by this user (prioritize user_id match to prevent slug hijacking)
  SELECT id INTO v_page_id FROM public.pages 
  WHERE user_id = p_user_id AND organization_id IS NOT DISTINCT FROM p_organization_id
  LIMIT 1;

  -- If no page found by ownership, check if slug belongs to this user
  IF v_page_id IS NULL THEN
    SELECT id INTO v_page_id FROM public.pages 
    WHERE slug = p_slug AND user_id = p_user_id
    LIMIT 1;
  END IF;

  IF v_page_id IS NULL THEN
    -- Ensure slug is not taken by another user
    IF EXISTS (SELECT 1 FROM public.pages WHERE slug = p_slug AND user_id != p_user_id) THEN
      RAISE EXCEPTION 'Slug already taken by another user';
    END IF;

    -- Create new page
    INSERT INTO public.pages (
      user_id, slug, title, description, avatar_url, avatar_style, 
      theme_settings, seo_meta, is_published, editor_mode, grid_config,
      integrations, favicon_url, hide_branding, organization_id
    )
    VALUES (
      p_user_id, p_slug, p_title, p_description, p_avatar_url, p_avatar_style, 
      p_theme_settings, p_seo_meta, false, COALESCE(p_editor_mode, 'linear'), p_grid_config,
      p_integrations, p_favicon_url, p_hide_branding, p_organization_id
    )
    RETURNING id INTO v_page_id;
  ELSE
    -- Update existing page (already verified ownership above)
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
      updated_at = now()
    WHERE id = v_page_id;
  END IF;

  RETURN v_page_id;
END;
$function$;