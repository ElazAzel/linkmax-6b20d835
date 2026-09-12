-- Add CHECK constraint for premium_tier to ensure valid values
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_premium_tier_check;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_premium_tier_check 
CHECK (premium_tier IN ('free', 'pro', 'business'));

-- Update any NULL values to 'free'
UPDATE public.user_profiles 
SET premium_tier = 'free' 
WHERE premium_tier IS NULL OR premium_tier NOT IN ('free', 'pro', 'business');