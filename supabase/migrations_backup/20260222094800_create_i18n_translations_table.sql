-- Migration: Create i18n_translations table
-- Date: 2026-02-22

CREATE TABLE IF NOT EXISTS public.i18n_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lang_code VARCHAR(10) NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.i18n_translations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to translations (needed for fast client loading)
CREATE POLICY "Public read access to translations"
  ON public.i18n_translations
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated admins to manage translations
-- We check if user is authenticated. 
CREATE POLICY "Authenticated users can manage translations"
  ON public.i18n_translations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

DROP TRIGGER IF EXISTS handle_i18n_updated_at ON public.i18n_translations;
CREATE TRIGGER handle_i18n_updated_at 
  BEFORE UPDATE ON public.i18n_translations
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
