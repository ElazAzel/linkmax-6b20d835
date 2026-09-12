
-- Restrict sensitive columns on user_profiles from authenticated/anon (defensive column-level protection)
REVOKE SELECT (push_subscription, telegram_chat_id) ON public.user_profiles FROM authenticated;
REVOKE SELECT (push_subscription, telegram_chat_id) ON public.user_profiles FROM anon;

-- Remove zone_automations from realtime publication to avoid broadcasting sensitive config/template_message to non-admin members
ALTER PUBLICATION supabase_realtime DROP TABLE public.zone_automations;
