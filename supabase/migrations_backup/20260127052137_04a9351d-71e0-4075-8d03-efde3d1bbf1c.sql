-- Add RLS policy for public read access to event registration count
-- This allows anyone to count registrations for published events (for capacity display)

-- First, create a security definer function to safely count registrations
CREATE OR REPLACE FUNCTION public.get_event_registration_count(p_event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.event_registrations
  WHERE event_id = p_event_id
    AND status IN ('confirmed', 'pending')
$$;