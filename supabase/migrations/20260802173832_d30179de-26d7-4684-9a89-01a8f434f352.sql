-- 1) premium_gifts: replace ineffective self-referential RLS check with a trigger guard
CREATE OR REPLACE FUNCTION public.protect_premium_gift_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins / service role may modify freely
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
     OR NEW.days_gifted IS DISTINCT FROM OLD.days_gifted
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Gift details cannot be modified';
  END IF;

  -- A gift can only move from unclaimed to claimed
  IF OLD.is_claimed AND NOT NEW.is_claimed THEN
    RAISE EXCEPTION 'Gift cannot be unclaimed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_premium_gift_columns ON public.premium_gifts;
CREATE TRIGGER trg_protect_premium_gift_columns
BEFORE UPDATE ON public.premium_gifts
FOR EACH ROW EXECUTE FUNCTION public.protect_premium_gift_columns();

DROP POLICY IF EXISTS "Recipients can update to claim" ON public.premium_gifts;
CREATE POLICY "Recipients can update to claim"
ON public.premium_gifts
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- 2) One-time codes proving Telegram chat ownership
CREATE TABLE IF NOT EXISTS public.telegram_link_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  code text NOT NULL,
  chat_id text,
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_telegram_link_codes_code ON public.telegram_link_codes(code);
CREATE INDEX IF NOT EXISTS idx_telegram_link_codes_user ON public.telegram_link_codes(user_id);

GRANT ALL ON public.telegram_link_codes TO service_role;

ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (backend edge functions) may access these codes.