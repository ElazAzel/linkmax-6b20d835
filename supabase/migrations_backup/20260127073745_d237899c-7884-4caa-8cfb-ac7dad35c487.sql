-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can check own email registration" ON public.event_registrations;

-- Create a SECURITY DEFINER function to check if email is already registered for an event
-- This allows checking without exposing the full registration data
CREATE OR REPLACE FUNCTION public.check_email_registered_for_event(
  p_event_id uuid,
  p_email text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.event_registrations 
    WHERE event_id = p_event_id 
      AND attendee_email = p_email
      AND status != 'cancelled'
  )
$$;