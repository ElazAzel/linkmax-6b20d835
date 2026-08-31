-- Harden newsletter_subscriptions INSERT policy
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;

CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscriptions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pages
    WHERE public.pages.id = newsletter_subscriptions.page_id
    AND public.pages.is_published = true
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE public.user_profiles.id = newsletter_subscriptions.owner_id
  )
);