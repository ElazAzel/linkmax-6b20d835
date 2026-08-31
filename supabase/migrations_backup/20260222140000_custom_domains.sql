-- Create custom_domains table
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

-- Index for fast Lookups (needed for resolve-domain function)
CREATE INDEX IF NOT EXISTS idx_custom_domains_hostname ON public.custom_domains(hostname);
CREATE INDEX IF NOT EXISTS idx_custom_domains_page_id ON public.custom_domains(page_id);

-- Enable RLS
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own domains
CREATE POLICY "Users can manage their own domains"
    ON public.custom_domains
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can view and manage all domains
CREATE POLICY "Admins can manage all domains"
    ON public.custom_domains
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public (edge functions) can read domains for resolution
-- We need this for the resolve-domain edge function which might run without user JWT context
CREATE POLICY "Service role can read domains"
    ON public.custom_domains
    FOR SELECT
    TO service_role
    USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_custom_domains_updated_at
    BEFORE UPDATE ON public.custom_domains
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add is_custom_domain_enabled to pages table if not exists (as a cache/flag)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'pages' AND COLUMN_NAME = 'custom_domain') THEN
        ALTER TABLE public.pages ADD COLUMN custom_domain TEXT UNIQUE;
    END IF;
END $$;
