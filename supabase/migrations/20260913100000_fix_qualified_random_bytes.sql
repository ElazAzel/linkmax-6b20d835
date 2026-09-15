-- Supabase installs pgcrypto in the extensions schema. Keep this security
-- definer trigger explicit so creating a zone works on recovered projects.
CREATE OR REPLACE FUNCTION public.tg_init_zone_secret()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  INSERT INTO public.zone_secrets (zone_id, calendar_feed_token)
  VALUES (NEW.id, encode(extensions.gen_random_bytes(24), 'hex'))
  ON CONFLICT (zone_id) DO NOTHING;
  RETURN NEW;
END;
$$;
