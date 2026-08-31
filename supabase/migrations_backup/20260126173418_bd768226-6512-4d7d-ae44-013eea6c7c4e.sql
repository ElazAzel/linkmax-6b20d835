-- Fix RLS policies for events to allow proper registration

-- Allow anyone to read events (for registration form)
-- Current policy only allows published events - this is fine

-- Fix: Allow anyone to insert registrations for published events
DROP POLICY IF EXISTS "Anyone can register for events" ON public.event_registrations;
CREATE POLICY "Anyone can register for published events"
ON public.event_registrations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id 
    AND (status = 'published' OR owner_id = auth.uid())
  )
);

-- Allow users to view their own registrations by email or user_id
DROP POLICY IF EXISTS "Users can view own registrations" ON public.event_registrations;
CREATE POLICY "Users can view own registrations"
ON public.event_registrations
FOR SELECT
USING (
  owner_id = auth.uid() OR
  user_id = auth.uid() OR
  attendee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Allow event owners to manage tickets
DROP POLICY IF EXISTS "Ticket owners can view tickets" ON public.event_tickets;
CREATE POLICY "Event participants can view tickets"
ON public.event_tickets
FOR SELECT
USING (
  registration_id IN (
    SELECT id FROM public.event_registrations
    WHERE owner_id = auth.uid() 
       OR user_id = auth.uid()
       OR attendee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Ensure trigger for ticket generation exists
CREATE OR REPLACE FUNCTION public.generate_event_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status <> 'confirmed') THEN
    INSERT INTO public.event_tickets (registration_id, ticket_code)
    VALUES (NEW.id, 'TKT-' || upper(substring(md5(random()::text) from 1 for 8)))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_generate_event_ticket ON public.event_registrations;
CREATE TRIGGER trg_generate_event_ticket
AFTER INSERT OR UPDATE OF status ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.generate_event_ticket();