-- Add push subscription column for PWA notifications
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS push_subscription jsonb,
ADD COLUMN IF NOT EXISTS push_notifications_enabled boolean DEFAULT false;

-- Drop WhatsApp columns (no longer needed)
ALTER TABLE public.user_profiles 
DROP COLUMN IF EXISTS whatsapp_notifications_enabled,
DROP COLUMN IF EXISTS whatsapp_phone;