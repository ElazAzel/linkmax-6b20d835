-- Drop conflicting/problematic policies and recreate clean ones

-- Fix event_registrations: drop overlapping policies and create a clean one
DROP POLICY IF EXISTS "Event owners can view registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Event owner or attendee can view registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Event owners can manage registrations" ON public.event_registrations;

-- Create clean policies for event_registrations
CREATE POLICY "Owners can manage their event registrations"
ON public.event_registrations
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Attendees can view own registrations"
ON public.event_registrations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Fix event_tickets: drop and recreate
DROP POLICY IF EXISTS "Event owners can view tickets for their events" ON public.event_tickets;
DROP POLICY IF EXISTS "Event participants can view tickets" ON public.event_tickets;

-- Create clean policy for event_tickets for owners
CREATE POLICY "Owners can view tickets for their events"
ON public.event_tickets
FOR SELECT
TO authenticated
USING (
  registration_id IN (
    SELECT id FROM public.event_registrations 
    WHERE owner_id = auth.uid()
  )
);

-- Allow owners to update tickets (for check-in)
CREATE POLICY "Owners can update tickets for their events"
ON public.event_tickets
FOR UPDATE
TO authenticated
USING (
  registration_id IN (
    SELECT id FROM public.event_registrations 
    WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  registration_id IN (
    SELECT id FROM public.event_registrations 
    WHERE owner_id = auth.uid()
  )
);