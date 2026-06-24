BEGIN;

-- ==============================================
-- 012_custom_domains_and_integrations.sql
-- Tables: custom_domains, user_integrations, user_integrations_status
-- Columns: gcal_sync_enabled, gcal_calendar_id, webhook_url, webhook_secret
-- Functions: Google Calendar RPC, webhook-related
-- ==============================================

-- 1. Google Calendar columns on user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS gcal_sync_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gcal_calendar_id TEXT;

-- 2. user_integrations table
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'google_calendar',
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- Drop old unique constraint and re-create composite
ALTER TABLE public.user_integrations DROP CONSTRAINT IF EXISTS user_integrations_user_id_key;
DELETE FROM public.user_integrations current_row
USING public.user_integrations newer_row
WHERE current_row.ctid < newer_row.ctid
  AND current_row.user_id = newer_row.user_id
  AND current_row.provider = newer_row.provider;
CREATE UNIQUE INDEX IF NOT EXISTS user_integrations_user_id_provider_key ON public.user_integrations (user_id, provider);

-- user_integrations_status (table, not view)
DROP VIEW IF EXISTS public.user_integrations_status;
CREATE TABLE IF NOT EXISTS public.user_integrations_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

-- Migrate data
INSERT INTO public.user_integrations_status (user_id, provider, is_connected, updated_at)
SELECT user_id, provider, (refresh_token IS NOT NULL OR access_token IS NOT NULL) AS is_connected, COALESCE(updated_at, now()) AS updated_at
FROM public.user_integrations
ON CONFLICT (user_id, provider) DO UPDATE SET is_connected = EXCLUDED.is_connected, updated_at = EXCLUDED.updated_at;

ALTER TABLE public.user_integrations_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.user_integrations;
  CREATE POLICY "Users can manage their own integrations" ON public.user_integrations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own integration status" ON public.user_integrations_status;
  CREATE POLICY "Users can view own integration status" ON public.user_integrations_status FOR SELECT TO authenticated USING (user_id = auth.uid());
END $$;

-- Grants
REVOKE ALL ON TABLE public.user_integrations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.user_integrations_status FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.user_integrations_status TO authenticated;
GRANT ALL ON TABLE public.user_integrations TO service_role;
GRANT ALL ON TABLE public.user_integrations_status TO service_role;

-- 3. custom_domains table
CREATE TABLE IF NOT EXISTS public.custom_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    hostname TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'configuring')),
    ssl_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_hostname ON public.custom_domains(hostname);
CREATE INDEX IF NOT EXISTS idx_custom_domains_page_id ON public.custom_domains(page_id);

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own domains' AND tablename = 'custom_domains') THEN
    CREATE POLICY "Users can manage their own domains" ON public.custom_domains FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all domains' AND tablename = 'custom_domains') THEN
    CREATE POLICY "Admins can manage all domains" ON public.custom_domains FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can read domains' AND tablename = 'custom_domains') THEN
    CREATE POLICY "Service role can read domains" ON public.custom_domains FOR SELECT TO service_role USING (true);
  END IF;
END $$;

-- handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS set_custom_domains_updated_at ON public.custom_domains;
  CREATE TRIGGER set_custom_domains_updated_at BEFORE UPDATE ON public.custom_domains FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
END $$;

-- custom_domain column on pages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'pages' AND COLUMN_NAME = 'custom_domain') THEN
    ALTER TABLE public.pages ADD COLUMN custom_domain TEXT UNIQUE;
  END IF;
END $$;

-- 4. Webhook columns on pages
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

COMMENT ON COLUMN public.pages.webhook_url IS 'External URL to send lead and form data to via POST request';
COMMENT ON COLUMN public.pages.webhook_secret IS 'Secret key for signing webhook payloads to ensure authenticity';

-- 5. Google Calendar RPC functions (latest versions from 20260419092000)
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
    INSERT INTO public.user_integrations (user_id, provider, access_token, refresh_token, expires_at, updated_at)
    VALUES (p_user_id, p_provider, p_access_token, p_refresh_token, p_expires_at, now())
    ON CONFLICT (user_id, provider)
    DO UPDATE SET access_token = EXCLUDED.access_token, refresh_token = COALESCE(EXCLUDED.refresh_token, public.user_integrations.refresh_token), expires_at = EXCLUDED.expires_at, updated_at = now();

    INSERT INTO public.user_integrations_status (user_id, provider, is_connected, updated_at)
    VALUES (p_user_id, p_provider, true, now())
    ON CONFLICT (user_id, provider)
    DO UPDATE SET is_connected = true, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_integration_tokens(
    p_user_id UUID,
    p_provider TEXT
)
RETURNS TABLE (access_token TEXT, refresh_token TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY SELECT ui.access_token, ui.refresh_token, ui.expires_at
    FROM public.user_integrations ui WHERE ui.user_id = p_user_id AND ui.provider = p_provider;
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
    DELETE FROM public.user_integrations WHERE user_id = p_user_id AND provider = p_provider;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_integration_tokens(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_integration_tokens(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_user_integration(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_integration_tokens(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_integration_tokens(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_integration(UUID, TEXT) TO service_role;

-- 6. Page Templates table
CREATE TABLE IF NOT EXISTS public.page_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    niches TEXT[] DEFAULT '{}'::TEXT[],
    is_premium BOOLEAN DEFAULT FALSE,
    blocks JSONB[] NOT NULL DEFAULT '{}'::JSONB[],
    theme_settings JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view page templates' AND tablename = 'page_templates') THEN
    CREATE POLICY "Anyone can view page templates" ON public.page_templates FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only admins can modify page templates' AND tablename = 'page_templates') THEN
    CREATE POLICY "Only admins can modify page templates" ON public.page_templates FOR ALL USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

DROP TRIGGER IF EXISTS handle_updated_at ON public.page_templates;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.page_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMIT;
