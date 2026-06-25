-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Service role can insert analytics" ON public.analytics;

-- Create a new policy that allows anyone to insert analytics events
-- This is necessary because visitors are not authenticated
CREATE POLICY "Anyone can insert analytics events" 
ON public.analytics 
FOR INSERT 
WITH CHECK (true);

-- Keep the existing restrictive SELECT policies
-- Analytics data should only be viewable by page owners