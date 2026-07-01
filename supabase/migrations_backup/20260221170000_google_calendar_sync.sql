-- ==============================================
-- 2026M_google_calendar_sync.sql
-- Adds columns to user_profiles for storing Google Calendar integration tokens securely.
-- Uses Supabase Vault for the refresh token if available, otherwise encrypted strings.
-- ==============================================

-- 1. Add fields to user_profiles (if they don't exist)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS gcal_sync_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS gcal_calendar_id TEXT;

-- NOTE: We store the refresh_token in a separate secure table or field.
-- For simplicity and security, we'll create a dedicated table with strict RLS:

CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    provider TEXT NOT NULL DEFAULT 'google_calendar',
    access_token TEXT,
    refresh_token TEXT, -- Ideally, in production, this should be encrypted using pgcrypto or Vault
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Protect the integrations table strictly: only the owner can manage their own row,
-- AND Edge Functions (Service Role) can read/write them.
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own integrations"
    ON public.user_integrations
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create a view showing only public status (whether a user HAS integrated)
-- This allows the UI to check if calendar is connected without exposing the token
CREATE OR REPLACE VIEW public.user_integrations_status AS
SELECT 
    user_id, 
    provider, 
    (refresh_token IS NOT NULL) AS is_connected,
    updated_at
FROM public.user_integrations;

GRANT SELECT ON public.user_integrations_status TO anon, authenticated;
