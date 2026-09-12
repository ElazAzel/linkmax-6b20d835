
-- Drop all overloads of upsert_user_page and recreate with complete signature
DROP FUNCTION IF EXISTS public.upsert_user_page(uuid, text, text, text, text, jsonb, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.upsert_user_page(uuid, text, text, text, text, jsonb, jsonb, jsonb, text, jsonb);
DROP FUNCTION IF EXISTS public.upsert_user_page(uuid, text, text, text, text, jsonb, jsonb, jsonb, text, jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.upsert_user_page(
  p_user_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_avatar_url text,
  p_avatar_style jsonb,
  p_theme_settings jsonb,
  p_seo_meta jsonb,
  p_editor_mode text DEFAULT 'grid'::text,
  p_grid_config jsonb DEFAULT NULL::jsonb,
  p_integrations jsonb DEFAULT NULL::jsonb,
  p_favicon_url text DEFAULT NULL::text,
  p_hide_branding boolean DEFAULT false,
  p_organization_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_page_id uuid;
BEGIN
  SELECT id INTO v_page_id FROM public.pages WHERE user_id = p_user_id;

  IF v_page_id IS NULL THEN
    INSERT INTO public.pages (
      user_id, slug, title, description, avatar_url, avatar_style,
      theme_settings, seo_meta, is_published, editor_mode, grid_config,
      integrations, favicon_url, hide_branding, organization_id
    ) VALUES (
      p_user_id, p_slug, p_title, p_description, p_avatar_url, p_avatar_style,
      p_theme_settings, p_seo_meta, false, COALESCE(p_editor_mode, 'grid'),
      p_grid_config, p_integrations, p_favicon_url, p_hide_branding, p_organization_id
    ) RETURNING id INTO v_page_id;
  ELSE
    UPDATE public.pages SET
      slug = p_slug,
      title = p_title,
      description = p_description,
      avatar_url = p_avatar_url,
      avatar_style = p_avatar_style,
      theme_settings = p_theme_settings,
      seo_meta = p_seo_meta,
      editor_mode = COALESCE(p_editor_mode, 'grid'),
      grid_config = p_grid_config,
      integrations = p_integrations,
      favicon_url = p_favicon_url,
      hide_branding = p_hide_branding,
      organization_id = p_organization_id,
      updated_at = now()
    WHERE id = v_page_id;
  END IF;

  RETURN v_page_id;
END;
$function$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
