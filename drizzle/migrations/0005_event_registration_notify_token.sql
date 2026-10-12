ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS notify_token uuid NOT NULL DEFAULT gen_random_uuid();
GRANT SELECT (notify_token) ON public.event_registrations TO anon, authenticated;