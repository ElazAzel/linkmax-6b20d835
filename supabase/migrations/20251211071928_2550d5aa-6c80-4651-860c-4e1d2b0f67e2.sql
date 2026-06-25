-- Add editor_mode and grid_config columns to pages table
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS editor_mode text NOT NULL DEFAULT 'linear';
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS grid_config jsonb;

-- Update the upsert_user_page function to handle new columns
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
  p_grid_config jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_page_id uuid;
BEGIN
  -- Try to find existing page
  SELECT id INTO v_page_id FROM public.pages WHERE user_id = p_user_id;
  
  IF v_page_id IS NULL THEN
    -- Create new page
    INSERT INTO public.pages (user_id, slug, title, description, avatar_url, avatar_style, theme_settings, seo_meta, is_published, editor_mode, grid_config)
    VALUES (p_user_id, p_slug, p_title, p_description, p_avatar_url, p_avatar_style, p_theme_settings, p_seo_meta, false, COALESCE(p_editor_mode, 'linear'), p_grid_config)
    RETURNING id INTO v_page_id;
  ELSE
    -- Update existing page
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
      updated_at = now()
    WHERE id = v_page_id;
  END IF;
  
  RETURN v_page_id;
END;
$function$;