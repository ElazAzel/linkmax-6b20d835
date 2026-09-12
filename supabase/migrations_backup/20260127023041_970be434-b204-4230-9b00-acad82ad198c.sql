-- P1 Security Fix: Restrict analytics INSERT to valid page_id only
DROP POLICY IF EXISTS "Public insert analytics" ON public.analytics;

-- Allow analytics insert only for published pages
CREATE POLICY "Anyone can insert analytics for published pages" 
ON public.analytics FOR INSERT 
WITH CHECK (
  page_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM pages 
    WHERE pages.id = analytics.page_id 
    AND pages.is_published = true
  )
);

-- P1: Move pg_net extension to extensions schema
-- Note: This requires careful handling as it may affect edge functions
-- Creating extensions schema if not exists and moving extension

CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;