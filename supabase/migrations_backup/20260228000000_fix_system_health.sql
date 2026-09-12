
-- ==============================================
-- FIX 1: Foreign Key for zone_members -> user_profiles
-- This ensures that PostgREST can perform the join needed in useZones.ts
-- ==============================================

-- First ensure the column types match
-- user_profiles.id is uuid, zone_members.user_id should be uuid

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'zone_members_user_id_fkey' 
        AND table_name = 'zone_members'
    ) THEN
        ALTER TABLE public.zone_members
        ADD CONSTRAINT zone_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- ==============================================
-- FIX 2: Enhanced RLS for analytics
-- Allow owners to insert even for non-published pages (previews/drafts)
-- ==============================================

DROP POLICY IF EXISTS "Anyone can insert analytics for published pages" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;

CREATE POLICY "Allow analytics insert" 
ON public.analytics FOR INSERT 
TO anon, authenticated
WITH CHECK (
  -- Public can insert only for published pages
  EXISTS (
    SELECT 1 FROM public.pages 
    WHERE pages.id = analytics.page_id 
    AND (pages.is_published = true OR pages.user_id = auth.uid())
  )
);

-- ==============================================
-- FIX 3: Re-sync upsert_user_page function
-- Ensure and verify the 14-parameter signature
-- ==============================================

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

  -- Verify user has access to the organization if provided
  IF p_organization_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.zone_members 
      WHERE zone_id = p_organization_id AND user_id = auth.uid() AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Unauthorized: User is not a member of this organization';
    END IF;
  END IF;

  -- Find existing page (by slug or user ownership if slug is being updated)
  SELECT id INTO v_page_id FROM public.pages 
  WHERE (slug = p_slug) OR (user_id = p_user_id AND organization_id IS NOT DISTINCT FROM p_organization_id)
  LIMIT 1;

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
      integrations,
      favicon_url,
      hide_branding,
      organization_id
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
      p_integrations,
      p_favicon_url,
      p_hide_branding,
      p_organization_id
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
      favicon_url = p_favicon_url,
      hide_branding = p_hide_branding,
      organization_id = COALESCE(p_organization_id, organization_id),
      updated_at = now()
    WHERE id = v_page_id;
  END IF;

  RETURN v_page_id;
END;
$function$;
