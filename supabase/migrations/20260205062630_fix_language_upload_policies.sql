-- Add missing UPDATE policy for language_upload_history table
-- This allows admins to update the status of upload records

CREATE POLICY "Admins can update upload history"
  ON public.language_upload_history FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
