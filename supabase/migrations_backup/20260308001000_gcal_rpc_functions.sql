-- ==============================================
-- RPC functions for Google Calendar token management
-- Used by google-calendar-sync Edge Function
-- ==============================================

-- 1. set_user_integration_tokens — UPSERT tokens into user_integrations
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
    ON CONFLICT (user_id)
    DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, public.user_integrations.refresh_token),
        expires_at = EXCLUDED.expires_at,
        updated_at = now();
END;
$$;

-- 2. get_user_integration_tokens — SELECT tokens from user_integrations
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

-- 3. delete_user_integration — remove integration tokens
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
    WHERE user_id = p_user_id AND provider = p_provider;

    -- Also update the status table
    DELETE FROM public.user_integrations_status
    WHERE user_id = p_user_id AND provider = p_provider;
END;
$$;

-- Grant execution to service_role (Edge Functions use this)
GRANT EXECUTE ON FUNCTION public.set_user_integration_tokens TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_integration_tokens TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_integration TO service_role;
