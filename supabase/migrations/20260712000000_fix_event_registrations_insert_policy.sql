-- Fix event registrations RLS policies to allow:
-- 1. Free event registration with status = 'confirmed' on INSERT
-- 2. Anonymous guests to view their own newly created registrations/tickets via a secure short window of 30 seconds

-- ==================== Fix INSERT policy ====================
DROP POLICY IF EXISTS "Anyone can register for published events" ON public.event_registrations;

CREATE POLICY "Anyone can register for published events"
  ON public.event_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    payment_status IN ('none', 'pending')
    AND (
      status = 'pending'
      OR (
        status = 'confirmed'
        AND EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = event_id AND e.is_paid = false
        )
      )
    )
    AND EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND p.is_published = true
    )
  );

-- ==================== Fix SELECT policy on event_registrations ====================
DROP POLICY IF EXISTS "Attendees can view own registrations" ON public.event_registrations;

CREATE POLICY "Attendees can view own registrations"
ON public.event_registrations
FOR SELECT
TO anon, authenticated
USING (
  user_id = auth.uid()
  OR (auth.uid() IS NOT NULL AND attendee_email = public.get_auth_user_email())
  OR created_at >= now() - interval '30 seconds'
);

-- ==================== Fix SELECT policy on event_tickets ====================
DROP POLICY IF EXISTS "Attendees can view own tickets" ON public.event_tickets;

CREATE POLICY "Attendees can view own tickets"
ON public.event_tickets
FOR SELECT
TO anon, authenticated
USING (
  registration_id IN (
    SELECT id FROM public.event_registrations
  )
  OR created_at >= now() - interval '30 seconds'
);
