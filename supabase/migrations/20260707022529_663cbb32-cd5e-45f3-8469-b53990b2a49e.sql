-- P2 Monetization: recurring & usage-based billing over public.offers (Lago-style abstraction)

CREATE TABLE IF NOT EXISTS public.offer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  customer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email text,
  seller_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing','active','past_due','paused','canceled','ended')),
  billing_interval text NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('day','week','month','year')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  provider text NOT NULL DEFAULT 'robokassa',
  provider_subscription_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS offer_subscriptions_offer_idx ON public.offer_subscriptions(offer_id);
CREATE INDEX IF NOT EXISTS offer_subscriptions_seller_idx ON public.offer_subscriptions(seller_user_id);
CREATE INDEX IF NOT EXISTS offer_subscriptions_customer_idx ON public.offer_subscriptions(customer_user_id);
CREATE INDEX IF NOT EXISTS offer_subscriptions_status_idx ON public.offer_subscriptions(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_subscriptions TO authenticated;
GRANT ALL ON public.offer_subscriptions TO service_role;

ALTER TABLE public.offer_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers manage own offer subscriptions"
  ON public.offer_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = seller_user_id)
  WITH CHECK (auth.uid() = seller_user_id);

CREATE POLICY "Customers view own subscriptions"
  ON public.offer_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = customer_user_id);

CREATE OR REPLACE FUNCTION public.tg_offer_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER offer_subscriptions_updated_at
BEFORE UPDATE ON public.offer_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.tg_offer_subscriptions_updated_at();

-- Usage events (metered billing input)
CREATE TABLE IF NOT EXISTS public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.offer_subscriptions(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.offers(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metric_code text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_amount_cents integer,
  currency text NOT NULL DEFAULT 'KZT',
  external_id text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_user_id, external_id)
);

CREATE INDEX IF NOT EXISTS usage_events_subscription_idx ON public.usage_events(subscription_id);
CREATE INDEX IF NOT EXISTS usage_events_seller_metric_idx ON public.usage_events(seller_user_id, metric_code, occurred_at);
CREATE INDEX IF NOT EXISTS usage_events_offer_idx ON public.usage_events(offer_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage_events TO authenticated;
GRANT ALL ON public.usage_events TO service_role;

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers manage own usage events"
  ON public.usage_events FOR ALL TO authenticated
  USING (auth.uid() = seller_user_id)
  WITH CHECK (auth.uid() = seller_user_id);

CREATE POLICY "Customers view own usage events"
  ON public.usage_events FOR SELECT TO authenticated
  USING (auth.uid() = customer_user_id);

-- Aggregation helper for billing period
CREATE OR REPLACE FUNCTION public.aggregate_usage(
  _subscription_id uuid,
  _metric_code text,
  _period_start timestamptz,
  _period_end timestamptz
) RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(quantity), 0)
  FROM public.usage_events
  WHERE subscription_id = _subscription_id
    AND metric_code = _metric_code
    AND occurred_at >= _period_start
    AND occurred_at < _period_end;
$$;