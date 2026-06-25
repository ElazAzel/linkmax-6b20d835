-- Add Telegram and WhatsApp notification settings to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS telegram_notifications_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS telegram_chat_id text,
ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_phone text;