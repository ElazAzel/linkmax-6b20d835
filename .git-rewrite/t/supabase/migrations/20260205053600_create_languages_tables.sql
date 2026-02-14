-- Create languages table for storing language translations
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

-- Create language upload history table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_languages_code ON public.languages(language_code);
CREATE INDEX IF NOT EXISTS idx_languages_active ON public.languages(is_active);
CREATE INDEX IF NOT EXISTS idx_upload_history_code ON public.language_upload_history(language_code);
CREATE INDEX IF NOT EXISTS idx_upload_history_status ON public.language_upload_history(status);

-- Enable RLS
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_upload_history ENABLE ROW LEVEL SECURITY;

-- Policies for languages table
-- Anyone can read active languages
CREATE POLICY "Anyone can view active languages"
  ON public.languages FOR SELECT
  USING (is_active = true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage languages"
  ON public.languages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policies for upload history
-- Only admins can view upload history
CREATE POLICY "Admins can view upload history"
  ON public.language_upload_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only admins can insert upload history
CREATE POLICY "Admins can create upload history"
  ON public.language_upload_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_languages_updated_at
  BEFORE UPDATE ON public.languages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default languages (if they don't exist)
INSERT INTO public.languages (language_code, language_name, flag_emoji, region, translations, is_active)
VALUES 
  ('en', 'English', '🇬🇧', 'core', '{}'::jsonb, true),
  ('ru', 'Русский', '🇷🇺', 'core', '{}'::jsonb, true),
  ('kk', 'Қазақша', '🇰🇿', 'core', '{}'::jsonb, true)
ON CONFLICT (language_code) DO NOTHING;
