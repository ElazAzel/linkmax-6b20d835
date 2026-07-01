-- ==========================================
-- FIX SUPABASE SCHEMA SCRIPT
-- ==========================================
-- Run this script in the Supabase SQL Editor to fix:
-- 1. "404 Not Found" for Templates (Missing 'templates' table)
-- 2. "Error: Could not find the function public.upsert_user_page" (Missing/Outdated RPC)
-- 3. "401 Unauthorized" for Analytics (Missing public INSERT policy)


-- ==========================================
-- PART 1: Templates Table & Policies
-- ==========================================

create table if not exists public.templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  category text not null, -- 'business', 'creators', etc.
  blocks jsonb not null default '[]'::jsonb,
  preview_image text,
  is_premium boolean default false,
  is_public boolean default true, -- visible in gallery
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for templates
alter table public.templates enable row level security;

-- Policies for templates
drop policy if exists "Templates are viewable by everyone" on public.templates;
create policy "Templates are viewable by everyone"
  on public.templates for select
  using (is_public = true);

drop policy if exists "Authenticated users can view all templates" on public.templates;
create policy "Authenticated users can view all templates"
  on public.templates for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can manage templates" on public.templates;
create policy "Authenticated users can manage templates"
  on public.templates for all
  to authenticated
  using (true)
  with check (true);

-- Triggers for templates
create extension if not exists moddatetime schema extensions;

drop trigger if exists handle_updated_at on public.templates;
create trigger handle_updated_at before update on public.templates
  for each row execute procedure moddatetime (updated_at);


-- ==========================================
-- PART 2: Upsert User Page Function (RPC)
-- ==========================================
-- This function must match the signature expected by usePageCache.ts

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


-- ==========================================
-- PART 3: Analytics RLS Policy
-- ==========================================

-- Drop existing policy to ensure clean state
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;

-- Re-create policy allowing insert for any role (anon + authenticated)
CREATE POLICY "Anyone can insert analytics"
  ON public.analytics
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
