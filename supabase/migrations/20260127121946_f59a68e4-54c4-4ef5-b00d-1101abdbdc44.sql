-- Add RLS policy for event owners to view registrations for their events
CREATE POLICY "Event owners can view registrations"
ON public.event_registrations
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Add RLS policy for event owners to view tickets for their event registrations
CREATE POLICY "Event owners can view tickets for their events"
ON public.event_tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.event_registrations er
    WHERE er.id = event_tickets.registration_id
    AND er.owner_id = auth.uid()
  )
);