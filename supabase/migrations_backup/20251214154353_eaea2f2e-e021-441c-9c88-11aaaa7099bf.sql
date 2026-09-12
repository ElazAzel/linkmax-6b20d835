-- Add email notification preference to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.email_notifications_enabled IS 'Whether to send email notifications for new leads';