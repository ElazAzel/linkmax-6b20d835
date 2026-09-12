-- Fix bookings table: Only owner and client can view bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = owner_id OR auth.uid() = user_id);

-- Fix user_profiles: Users can only see their own sensitive data, others see public fields only
-- First drop the existing policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

-- Create a view for public profile data (without sensitive fields)
-- The public_user_profiles view already exists and excludes sensitive fields

-- Create policy that allows users to see only their own full profile
CREATE POLICY "Users can view own full profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- For other users viewing profiles, they should use the public_user_profiles view
-- which already excludes telegram_chat_id and other sensitive fields

-- Mark the public_pages view finding as acceptable (it's intentionally public for gallery)
-- The view already filters to only show is_published = true pages