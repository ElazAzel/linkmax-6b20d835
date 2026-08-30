-- Add language preference column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS telegram_language VARCHAR(2) DEFAULT 'ru';

-- Add comment
COMMENT ON COLUMN public.user_profiles.telegram_language IS 'User preferred language for Telegram bot (ru, en, kk)';