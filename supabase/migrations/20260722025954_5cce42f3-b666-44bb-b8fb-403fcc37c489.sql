-- Allow analytics inserts with NULL page_id (for landing/marketing/auth funnel events)
DROP POLICY IF EXISTS "Anyone can insert analytics for published pages" ON public.analytics;

CREATE POLICY "Anyone can insert analytics events"
ON public.analytics FOR INSERT
WITH CHECK (
  page_id IS NULL
  OR EXISTS (
    SELECT 1 FROM public.pages
    WHERE pages.id = analytics.page_id
      AND pages.is_published = true
  )
);

-- Restore admin SELECT access to templates (including non-public drafts).
CREATE POLICY "Admins can view all templates"
ON public.templates FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));