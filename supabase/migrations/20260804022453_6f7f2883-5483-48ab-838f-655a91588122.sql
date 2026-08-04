DROP POLICY IF EXISTS "Anyone can register for published events" ON public.event_registrations;

CREATE POLICY "Anyone can register for published events"
ON public.event_registrations
FOR INSERT
WITH CHECK (
  status IN ('pending', 'confirmed')
  AND payment_status IN ('pending', 'paid', 'free', 'unpaid')
  AND EXISTS (
    SELECT 1 FROM public.pages p
    WHERE p.id = event_registrations.page_id
      AND p.is_published = true
      AND p.user_id = event_registrations.owner_id
  )
);