
CREATE TABLE public.telegram_bot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text NOT NULL UNIQUE,
  active_page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  language text DEFAULT 'ru',
  pending_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_bot_settings ENABLE ROW LEVEL SECURITY;

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
