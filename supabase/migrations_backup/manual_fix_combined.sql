-- ==========================================
-- MANUAL FIX SCRIPT FOR INKMAX STARTUP
-- ==========================================
-- This script fixes two critical issues:
-- 1. "404 Not Found" for Templates (Missing 'templates' table)
-- 2. "401 Unauthorized" for Analytics (Missing public INSERT policy)

-- PART 1: Create Templates Table
-- ------------------------------
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
create policy "Templates are viewable by everyone"
  on public.templates for select
  using (is_public = true);

create policy "Authenticated users can view all templates"
  on public.templates for select
  to authenticated
  using (true);

create policy "Authenticated users can manage templates"
  on public.templates for all
  to authenticated
  using (true)
  with check (true);

-- Triggers for templates
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on public.templates
  for each row execute procedure moddatetime (updated_at);


-- PART 2: Fix Analytics RLS Policy
-- --------------------------------
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
