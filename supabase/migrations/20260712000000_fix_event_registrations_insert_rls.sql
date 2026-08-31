-- Fix event_registrations INSERT policy to allow confirmed status for free events while preventing paid event bypass
DROP POLICY IF EXISTS "Anyone can register for published events" ON public.event_registrations;

CREATE POLICY "Anyone can register for published events"
  ON public.event_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    payment_status IN ('none', 'pending')
    AND (
      (status = 'pending') OR
      (status = 'confirmed' AND EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_id AND e.is_paid = false
      ))
    )
    AND EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND p.is_published = true
    )
  );
