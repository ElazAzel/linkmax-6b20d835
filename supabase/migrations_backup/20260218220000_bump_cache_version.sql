-- Bump cache_version to 5 to force client-side cache clear for all users
-- This is required to propagate the rebranding (Inkmx -> lnkmx.my)

INSERT INTO public.app_settings (key, value)
VALUES ('cache_version', '5')
ON CONFLICT (key)
DO UPDATE SET value = '5', updated_at = now();
