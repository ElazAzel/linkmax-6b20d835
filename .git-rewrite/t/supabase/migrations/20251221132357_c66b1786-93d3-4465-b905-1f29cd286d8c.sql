-- Fix: Drop the security definer view and recreate without security definer
DROP VIEW IF EXISTS public.public_user_profiles;

-- Recreate view without SECURITY DEFINER (it inherits invoker's permissions by default)
CREATE VIEW public.public_user_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  username,
  display_name,
  avatar_url,
  bio,
  current_streak,
  longest_streak,
  friends_count,
  is_premium,
  created_at
FROM public.user_profiles;

-- Grant select on the view
GRANT SELECT ON public.public_user_profiles TO authenticated;
GRANT SELECT ON public.public_user_profiles TO anon;