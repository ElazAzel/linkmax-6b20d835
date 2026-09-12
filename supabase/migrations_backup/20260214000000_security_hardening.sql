-- Secure upsert_user_page function
-- Ensure it checks that p_user_id matches auth.uid()

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
  -- Security check: Ensure authenticated user is acting on their own behalf
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: User ID mismatch';
  END IF;

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

-- Fix RLS policies for languages table
-- Drop incorrect policies
DROP POLICY IF EXISTS "Admins can manage languages" ON public.languages;

-- Create correct policy using has_role check
CREATE POLICY "Admins can manage languages"
  ON public.languages
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix RLS policies for language_upload_history table
-- Drop incorrect policies
DROP POLICY IF EXISTS "Admins can view upload history" ON public.language_upload_history;
DROP POLICY IF EXISTS "Admins can create upload history" ON public.language_upload_history;

-- Create correct policies using has_role check
CREATE POLICY "Admins can view upload history"
  ON public.language_upload_history
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create upload history"
  ON public.language_upload_history
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
