-- P0 Security Fix: Restrict bookings SELECT access to owner and customer only
-- Drop any existing overly permissive SELECT policies on bookings
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;

-- Create secure SELECT policy: only owner (page owner) or the customer who made the booking
CREATE POLICY "Owner or customer can view bookings" 
ON public.bookings FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR user_id = auth.uid()
);

-- P0 Security Fix: Restrict event_registrations SELECT access
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Event owner can view registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can view own event registrations" ON public.event_registrations;

-- Create secure SELECT policy: only event owner or the attendee
CREATE POLICY "Event owner or attendee can view registrations" 
ON public.event_registrations FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR user_id = auth.uid()
);

-- Verify leads table has proper RLS (should already be user_id based)
-- Just ensure the policy exists and is correct
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;

CREATE POLICY "Users can view own leads" 
ON public.leads FOR SELECT 
USING (user_id = auth.uid());

-- Add index for performance on new policy checks if not exists
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON public.bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_owner_id ON public.event_registrations(owner_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);