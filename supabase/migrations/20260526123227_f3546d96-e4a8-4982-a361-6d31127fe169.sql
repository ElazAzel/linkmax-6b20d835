DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;

CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscriptions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = newsletter_subscriptions.page_id
        AND pages.is_published = true
        AND pages.user_id = newsletter_subscriptions.owner_id
    )
  );

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;