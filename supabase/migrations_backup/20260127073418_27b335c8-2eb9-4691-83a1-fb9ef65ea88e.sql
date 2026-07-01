-- Add missing utm_json column to event_registrations
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS utm_json jsonb DEFAULT '{}'::jsonb;

-- Add other missing columns from the event-block spec
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS currency text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS provider text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS provider_payment_id text DEFAULT NULL;

-- Add index for better query performance on utm data
CREATE INDEX IF NOT EXISTS idx_event_registrations_utm 
ON public.event_registrations USING gin (utm_json);