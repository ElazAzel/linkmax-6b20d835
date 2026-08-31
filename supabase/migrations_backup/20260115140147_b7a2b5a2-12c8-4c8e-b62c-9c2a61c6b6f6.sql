-- Clean up and finalize remaining policies

-- Drop the specific policy causing the conflict
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics;
DROP POLICY IF EXISTS "Users can view analytics for their own pages only" ON public.analytics;

-- Recreate with unique names
CREATE POLICY "Page owners view their analytics"
  ON public.analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = analytics.page_id AND p.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Public insert analytics"
  ON public.analytics FOR INSERT
  WITH CHECK (true);