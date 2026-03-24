-- Add active_page_id to telegram_bot_settings
ALTER TABLE public.telegram_bot_settings 
ADD COLUMN IF NOT EXISTS active_page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL;

-- Function to set active page for a chat
CREATE OR REPLACE FUNCTION public.upsert_telegram_bot_active_page(
  p_chat_id text,
  p_page_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.telegram_bot_settings (chat_id, active_page_id, updated_at)
  VALUES (p_chat_id, p_page_id, now())
  ON CONFLICT (chat_id)
  DO UPDATE SET
    active_page_id = EXCLUDED.active_page_id,
    updated_at = now();
END;
$$;
