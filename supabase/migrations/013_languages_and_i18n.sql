BEGIN;

-- ==============================================
-- 013_languages_and_i18n.sql
-- Tables: languages, language_upload_history, i18n_translations
-- Seeds: Default languages (en, ru, kk)
-- ==============================================

-- 1. languages table
CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT UNIQUE NOT NULL,
  language_name TEXT NOT NULL,
  flag_emoji TEXT,
  region TEXT,
  translations JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT language_code_format CHECK (language_code ~ '^[a-z]{2}$')
);

-- 2. language_upload_history table
CREATE TABLE IF NOT EXISTS public.language_upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL,
  translations JSONB NOT NULL,
  validation_result JSONB,
  uploaded_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT status_check CHECK (status IN ('pending', 'validated', 'applied', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_languages_code ON public.languages(language_code);
CREATE INDEX IF NOT EXISTS idx_languages_active ON public.languages(is_active);
CREATE INDEX IF NOT EXISTS idx_upload_history_code ON public.language_upload_history(language_code);
CREATE INDEX IF NOT EXISTS idx_upload_history_status ON public.language_upload_history(status);

ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_upload_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for languages (using has_role)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view active languages' AND tablename = 'languages') THEN
    CREATE POLICY "Anyone can view active languages" ON public.languages FOR SELECT USING (is_active = true);
  END IF;
  DROP POLICY IF EXISTS "Admins can manage languages" ON public.languages;
  CREATE POLICY "Admins can manage languages" ON public.languages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
END $$;

-- RLS Policies for language_upload_history
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can view upload history" ON public.language_upload_history;
  CREATE POLICY "Admins can view upload history" ON public.language_upload_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  DROP POLICY IF EXISTS "Admins can create upload history" ON public.language_upload_history;
  CREATE POLICY "Admins can create upload history" ON public.language_upload_history FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update upload history' AND tablename = 'language_upload_history') THEN
    CREATE POLICY "Admins can update upload history" ON public.language_upload_history FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
  END IF;
END $$;

-- Trigger for updated_at on languages
DROP TRIGGER IF EXISTS update_languages_updated_at ON public.languages;
CREATE TRIGGER update_languages_updated_at BEFORE UPDATE ON public.languages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. telegram_language column on user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS telegram_language VARCHAR(2) DEFAULT 'ru';
COMMENT ON COLUMN public.user_profiles.telegram_language IS 'User preferred language for Telegram bot (ru, en, kk)';

-- 4. i18n_translations table
CREATE TABLE IF NOT EXISTS public.i18n_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lang_code VARCHAR(10) NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.i18n_translations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access to translations' AND tablename = 'i18n_translations') THEN
    CREATE POLICY "Public read access to translations" ON public.i18n_translations FOR SELECT TO public USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage translations' AND tablename = 'i18n_translations') THEN
    CREATE POLICY "Authenticated users can manage translations" ON public.i18n_translations FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
DROP TRIGGER IF EXISTS handle_i18n_updated_at ON public.i18n_translations;
CREATE TRIGGER handle_i18n_updated_at BEFORE UPDATE ON public.i18n_translations FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- 5. Default language seeds
INSERT INTO public.languages (language_code, language_name, flag_emoji, region, translations, is_active)
VALUES
  ('en', 'English', '🇬🇧', 'core', '{}'::jsonb, true),
  ('ru', 'Русский', '🇷🇺', 'core', '{}'::jsonb, true),
  ('kk', 'Қазақша', '🇰🇿', 'core', '{}'::jsonb, true)
ON CONFLICT (language_code) DO NOTHING;

COMMIT;
