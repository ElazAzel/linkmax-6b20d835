-- Align frontend and database premium tier contracts.
-- FE uses identity/starter/pro/business; DB stores free/starter/pro/business.

UPDATE public.user_profiles
SET premium_tier = 'free'
WHERE premium_tier IS NULL
   OR premium_tier = 'identity'
   OR premium_tier NOT IN ('free', 'starter', 'pro', 'business');

UPDATE public.user_profiles
SET is_premium = false,
    premium_expires_at = NULL,
    trial_ends_at = NULL
WHERE premium_tier = 'starter';

ALTER TABLE public.user_profiles
  ALTER COLUMN premium_tier SET DEFAULT 'free';

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_premium_tier_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_premium_tier_check
  CHECK (premium_tier IN ('free', 'starter', 'pro', 'business'));
