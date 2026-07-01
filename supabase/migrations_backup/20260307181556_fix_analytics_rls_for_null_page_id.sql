-- Fix: Allow inserting analytics events that don't belong to a specific page (e.g., landing page metrics or platform signup stats)
-- Previous policy restricted inserts only to existing published pages, causing 403 errors when `page_id IS NULL`.

DROP POLICY IF EXISTS "Anyone can insert analytics for published pages" ON public.analytics;

CREATE POLICY "Anyone can insert analytics for published pages" 
ON public.analytics FOR INSERT 
WITH CHECK (
    analytics.page_id IS NULL
    OR
    EXISTS (
        SELECT 1 FROM public.pages 
        WHERE pages.id = analytics.page_id 
        AND pages.status = 'published'
    )
);
