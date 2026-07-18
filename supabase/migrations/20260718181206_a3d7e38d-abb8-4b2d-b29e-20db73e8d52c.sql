DROP POLICY IF EXISTS "Anyone can register for published events" ON public.event_registrations;

CREATE POLICY "Anyone can register for published events"
  ON public.event_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    payment_status IN ('none','pending')
    AND status IN ('pending','confirmed')
    AND EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND p.is_published = true
    )
  );