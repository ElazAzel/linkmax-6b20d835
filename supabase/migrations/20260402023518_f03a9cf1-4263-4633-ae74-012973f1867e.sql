
CREATE TABLE IF NOT EXISTS public.telegram_bot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text NOT NULL UNIQUE,
  active_page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  language text DEFAULT 'ru',
  pending_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- This table already exists from the original Telegram settings migration.
-- Reconcile the newer session fields without replacing existing chat settings.
ALTER TABLE public.telegram_bot_settings
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS active_page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pending_action text;

ALTER TABLE public.telegram_bot_settings
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.telegram_bot_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.telegram_bot_settings;
CREATE POLICY "Service role full access" ON public.telegram_bot_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.upsert_telegram_bot_active_page(p_chat_id text, p_page_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO telegram_bot_settings (chat_id, active_page_id, updated_at)
  VALUES (p_chat_id, p_page_id, now())
  ON CONFLICT (chat_id) DO UPDATE SET active_page_id = p_page_id, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_telegram_bot_settings(p_chat_id text, p_language text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO telegram_bot_settings (chat_id, language, updated_at)
  VALUES (p_chat_id, p_language, now())
  ON CONFLICT (chat_id) DO UPDATE SET language = p_language, updated_at = now();
END;
$$;
