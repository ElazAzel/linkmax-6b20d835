ALTER TABLE public.smart_links ADD CONSTRAINT smart_links_safe_target CHECK (
  length(target_url) <= 2048
  AND target_url ~* '^https?://[^/@:?#]+\.[^/@:?#]+([:/?#]|$)'
  AND target_url !~* '^https?://(\d{1,3}(\.\d{1,3}){3}|\[|localhost)([:/?#]|$)'
  AND target_url !~* '^https?://[^/?#]*\.(localhost|local|internal|lan|home|corp)([:/?#]|$)'
) NOT VALID;

DROP POLICY IF EXISTS "Users can create gifts" ON public.premium_gifts;
CREATE POLICY "Admins can create gifts" ON public.premium_gifts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = sender_id
    AND recipient_id IS NOT NULL AND recipient_id <> sender_id
    AND days_gifted IS NOT NULL AND days_gifted > 0 AND days_gifted <= 30);