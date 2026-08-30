-- Fix: Restrict leads INSERT to service_role only (prevent direct spam bypassing edge function rate limiting)
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;

CREATE POLICY "Service role can insert leads"
ON public.leads FOR INSERT
TO service_role
WITH CHECK (true);