-- Allow inserting analytics events with null page_id (marketing/activation events)
CREATE POLICY "Anyone can insert marketing analytics"
  ON public.analytics FOR INSERT
  TO anon, authenticated
  WITH CHECK (page_id IS NULL);