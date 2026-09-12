-- Add missing UPDATE policy for language_upload_history table
-- This allows admins to update the status of upload records

CREATE POLICY "Admins can update upload history"
  ON public.language_upload_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
