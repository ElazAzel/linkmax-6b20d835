-- ==========================================
-- FINAL FIX SCRIPT FOR INKMAX CURRENT ERRORS
-- ==========================================
-- Fixes:
-- 1. "Could not find function upsert_user_page" (signature mismatch)
-- 2. "404 Not Found" for Templates (Missing/misconfigured table)
-- 3. "401 Unauthorized" for Analytics (RLS policy check)

-- PART 1: Update Pages Table and Upsert Function
-- ----------------------------------------------
-- Ensure integrations column exists
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS integrations jsonb;

-- Create/Update the function with correct 11-parameter signature
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
  p_integrations jsonb DEFAULT NULL
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
    INSERT INTO public.pages (
      user_id, 
      slug, 
      title, 
      description, 
      avatar_url, 
      avatar_style, 
      theme_settings, 
      seo_meta, 
      is_published, 
      editor_mode, 
      grid_config,
      integrations
    )
    VALUES (
      p_user_id, 
      p_slug, 
      p_title, 
      p_description, 
      p_avatar_url, 
      p_avatar_style, 
      p_theme_settings, 
      p_seo_meta, 
      false, 
      COALESCE(p_editor_mode, 'linear'), 
      p_grid_config,
      p_integrations
    )
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
      integrations = p_integrations,
      updated_at = now()
    WHERE id = v_page_id;
  END IF;

  RETURN v_page_id;
END;
$function$;


-- PART 2: Ensure Templates Table and Access
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  preview_image text,
  is_premium boolean DEFAULT false,
  is_public boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Select policies
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON public.templates;
CREATE POLICY "Templates are viewable by everyone"
  ON public.templates FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Authenticated users can view all templates" ON public.templates;
CREATE POLICY "Authenticated users can view all templates"
  ON public.templates FOR SELECT
  TO authenticated
  USING (true);

-- Manage policies
DROP POLICY IF EXISTS "Authenticated users can manage templates" ON public.templates;
CREATE POLICY "Authenticated users can manage templates"
  ON public.templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- PART 3: Fix Analytics RLS (401 error)
-- -------------------------------------
-- Ensure table exists (precautionary)
CREATE TABLE IF NOT EXISTS public.analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE,
  block_id uuid,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public tracking)
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
CREATE POLICY "Anyone can insert analytics"
  ON public.analytics
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users to view analytics
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.analytics;
CREATE POLICY "Users can view their own analytics"
  ON public.analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pages 
      WHERE pages.id = analytics.page_id 
      AND pages.user_id = auth.uid()
    )
  );
