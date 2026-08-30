-- Add premium_tier column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS premium_tier text DEFAULT 'free' CHECK (premium_tier IN ('free', 'pro', 'business'));

-- Add premium_expires_at column for subscription expiration
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS premium_expires_at timestamp with time zone DEFAULT NULL;

-- Update existing premium users to 'pro' tier
UPDATE public.user_profiles 
SET premium_tier = 'pro' 
WHERE is_premium = true OR (trial_ends_at IS NOT NULL AND trial_ends_at > now());