-- Harden OAuth integration storage for Google Calendar and account linking status.
-- Tokens remain service-role only; the client reads only RLS-filtered status.

ALTER TABLE public.user_integrations
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'google_calendar';

ALTER TABLE public.user_integrations
  ALTER COLUMN provider SET DEFAULT 'google_calendar';

ALTER TABLE public.user_integrations
  DROP CONSTRAINT IF EXISTS user_integrations_user_id_key;

DELETE FROM public.user_integrations current_row
USING public.user_integrations newer_row
WHERE current_row.ctid < newer_row.ctid
  AND current_row.user_id = newer_row.user_id
  AND current_row.provider = newer_row.provider;

CREATE UNIQUE INDEX IF NOT EXISTS user_integrations_user_id_provider_key
  ON public.user_integrations (user_id, provider);

DO $$
DECLARE
  status_relkind "char";
BEGIN
  SELECT c.relkind
    INTO status_relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'user_integrations_status';

  IF status_relkind = 'v' THEN
    EXECUTE 'DROP VIEW public.user_integrations_status';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_integrations_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

INSERT INTO public.user_integrations_status (user_id, provider, is_connected, updated_at)
SELECT
  user_id,
  provider,
  (refresh_token IS NOT NULL OR access_token IS NOT NULL) AS is_connected,
  COALESCE(updated_at, now()) AS updated_at
FROM public.user_integrations
ON CONFLICT (user_id, provider)
DO UPDATE SET
  is_connected = EXCLUDED.is_connected,
  updated_at = EXCLUDED.updated_at;

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.user_integrations;

DROP POLICY IF EXISTS "Users can view own integrations" ON public.user_integrations_status;
DROP POLICY IF EXISTS "Users can manage own integrations" ON public.user_integrations_status;
DROP POLICY IF EXISTS "Users can view own integration status" ON public.user_integrations_status;

CREATE POLICY "Users can view own integration status"
  ON public.user_integrations_status
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON TABLE public.user_integrations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.user_integrations_status FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.user_integrations_status TO authenticated;
GRANT ALL ON TABLE public.user_integrations TO service_role;
GRANT ALL ON TABLE public.user_integrations_status TO service_role;

CREATE OR REPLACE FUNCTION public.set_user_integration_tokens(
    p_user_id UUID,
    p_provider TEXT,
    p_access_token TEXT,
    p_refresh_token TEXT,
    p_expires_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_integrations (
        user_id,
        provider,
        access_token,
        refresh_token,
        expires_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_provider,
        p_access_token,
        p_refresh_token,
        p_expires_at,
        now()
    )
    ON CONFLICT (user_id, provider)
    DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, public.user_integrations.refresh_token),
        expires_at = EXCLUDED.expires_at,
        updated_at = now();

    INSERT INTO public.user_integrations_status (
        user_id,
        provider,
        is_connected,
        updated_at
    )
    VALUES (
        p_user_id,
        p_provider,
        true,
        now()
    )
    ON CONFLICT (user_id, provider)
    DO UPDATE SET
        is_connected = true,
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_integration_tokens(
    p_user_id UUID,
    p_provider TEXT
)
RETURNS TABLE (
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ui.access_token,
        ui.refresh_token,
        ui.expires_at
    FROM public.user_integrations ui
    WHERE ui.user_id = p_user_id
      AND ui.provider = p_provider;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_integration(
    p_user_id UUID,
    p_provider TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.user_integrations
    WHERE user_id = p_user_id
      AND provider = p_provider;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_integration_tokens(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_integration_tokens(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_user_integration(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.set_user_integration_tokens(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_integration_tokens(UUID, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_integration(UUID, TEXT)
  TO service_role;
