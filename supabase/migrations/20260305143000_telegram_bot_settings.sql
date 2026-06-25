-- Create a table for persistent Telegram bot settings
-- This solves the issue of language resets on Edge Function cold starts
CREATE TABLE IF NOT EXISTS public.telegram_bot_settings (
  chat_id text PRIMARY KEY,
  language text DEFAULT 'ru',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_bot_settings ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access" ON public.telegram_bot_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to view their own Chat ID settings if they are linked
CREATE POLICY "Users can view their own bot settings" ON public.telegram_bot_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.telegram_chat_id = telegram_bot_settings.chat_id
      AND user_profiles.id = auth.uid()
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_telegram_bot_settings_chat_id ON public.telegram_bot_settings(chat_id);

-- Upsert function for bot settings
CREATE OR REPLACE FUNCTION public.upsert_telegram_bot_settings(
  p_chat_id text,
  p_language text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.telegram_bot_settings (chat_id, language, metadata, updated_at)
  VALUES (p_chat_id, p_language, p_metadata, now())
  ON CONFLICT (chat_id)
  DO UPDATE SET
    language = EXCLUDED.language,
    metadata = telegram_bot_settings.metadata || EXCLUDED.metadata,
    updated_at = now();
END;
$$;
