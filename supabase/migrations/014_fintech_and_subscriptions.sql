BEGIN;

-- ==============================================
-- 014_fintech_and_subscriptions.sql
-- Tables: user_wallets, wallet_transactions, payout_requests, currency_rates, subscriptions
-- Functions: record_wallet_income(), ensure_user_wallet(), has_active_subscription(),
--            sync_premium_tier_from_subscription(), start_pro_trial()
-- ==============================================

-- 1. user_wallets table
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    balance numeric(10, 2) DEFAULT 0.00 NOT NULL,
    currency text DEFAULT 'KZT' NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, currency)
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;
  CREATE POLICY "Users can view own wallet" ON public.user_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can view their own wallets" ON public.user_wallets;
  CREATE POLICY "Users can view their own wallets" ON public.user_wallets FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
  CREATE POLICY "Admins can view all wallets" ON public.user_wallets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
END $$;

CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
DROP TRIGGER IF EXISTS handle_updated_at ON public.user_wallets;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_wallets FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- 2. wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id uuid REFERENCES public.user_wallets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID,
    type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'fee', 'refund', 'payment', 'income')),
    status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    gross_amount numeric(10, 2),
    fee_amount numeric(10, 2) DEFAULT 0.00 NOT NULL,
    net_amount numeric(10, 2),
    amount DECIMAL(15, 2),
    currency text DEFAULT 'KZT' NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    related_entity_id UUID,
    related_entity_type VARCHAR(50),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at timestamp with time zone,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
  CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions;
  CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- 3. payout_requests table
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.user_wallets(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'completed', 'rejected')),
  payout_method JSONB DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view/create own payout requests' AND tablename = 'payout_requests') THEN
    CREATE POLICY "Users can view/create own payout requests" ON public.payout_requests FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  DROP POLICY IF EXISTS "Admins can manage all payout requests" ON public.payout_requests;
  CREATE POLICY "Admins can manage all payout requests" ON public.payout_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
END $$;

-- Triggers for updated_at on fintech tables
DO $$
BEGIN
  DROP TRIGGER IF EXISTS trigger_user_wallets_updated_at ON public.user_wallets;
  CREATE TRIGGER trigger_user_wallets_updated_at BEFORE UPDATE ON public.user_wallets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  DROP TRIGGER IF EXISTS trigger_wallet_transactions_updated_at ON public.wallet_transactions;
  CREATE TRIGGER trigger_wallet_transactions_updated_at BEFORE UPDATE ON public.wallet_transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  DROP TRIGGER IF EXISTS trigger_payout_requests_updated_at ON public.payout_requests;
  CREATE TRIGGER trigger_payout_requests_updated_at BEFORE UPDATE ON public.payout_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
END $$;

-- 4. currency_rates table
CREATE TABLE IF NOT EXISTS public.currency_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_pair TEXT NOT NULL DEFAULT 'USD_KZT',
    rate NUMERIC(10,2) NOT NULL,
    source TEXT NOT NULL DEFAULT 'nationalbank.kz',
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(currency_pair)
);

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access' AND tablename = 'currency_rates') THEN
    CREATE POLICY "Public read access" ON public.currency_rates FOR SELECT USING (true);
  END IF;
END $$;

INSERT INTO public.currency_rates (currency_pair, rate) VALUES ('USD_KZT', 497.33) ON CONFLICT (currency_pair) DO NOTHING;

-- 5. subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paddle_subscription_id text NOT NULL UNIQUE,
  paddle_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_id ON public.subscriptions(paddle_subscription_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own subscriptions' AND tablename = 'subscriptions') THEN
    CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages subscriptions' AND tablename = 'subscriptions') THEN
    CREATE POLICY "Service role manages subscriptions" ON public.subscriptions FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Align premium tier contract
UPDATE public.user_profiles SET premium_tier = 'free'
WHERE premium_tier IS NULL OR premium_tier = 'identity' OR premium_tier NOT IN ('free', 'starter', 'pro', 'business');

UPDATE public.user_profiles SET is_premium = false, premium_expires_at = NULL, trial_ends_at = NULL WHERE premium_tier = 'starter';

ALTER TABLE public.user_profiles ALTER COLUMN premium_tier SET DEFAULT 'free';
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_premium_tier_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_premium_tier_check CHECK (premium_tier IN ('free', 'starter', 'pro', 'business'));

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;

-- 7. Functions

-- ensure_user_wallet
CREATE OR REPLACE FUNCTION public.ensure_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id, balance) VALUES (NEW.id, 0) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_wallet_on_profile ON public.user_profiles;
CREATE TRIGGER trigger_ensure_wallet_on_profile AFTER INSERT ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.ensure_user_wallet();

-- record_wallet_income
CREATE OR REPLACE FUNCTION public.record_wallet_income(
  p_user_id UUID,
  p_amount DECIMAL(15, 2),
  p_description TEXT,
  p_related_entity_type VARCHAR(50) DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_internal_ref VARCHAR(100) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_tx_id UUID;
BEGIN
  IF p_internal_ref IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.wallet_transactions WHERE metadata->>'internal_ref' = p_internal_ref AND status = 'completed'
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Transaction already processed');
  END IF;

  SELECT id INTO v_wallet_id FROM public.user_wallets WHERE user_id = p_user_id;
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.user_wallets (user_id, balance) VALUES (p_user_id, 0) RETURNING id INTO v_wallet_id;
  END IF;

  UPDATE public.user_wallets SET balance = balance + p_amount, updated_at = NOW() WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (wallet_id, user_id, amount, type, status, description, related_entity_type, related_entity_id, metadata)
  VALUES (v_wallet_id, p_user_id, p_amount, 'income', 'completed', p_description, p_related_entity_type, p_related_entity_id, jsonb_build_object('internal_ref', p_internal_ref, 'confirmed_at', NOW()))
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_tx_id, 'new_balance', (SELECT balance FROM public.user_wallets WHERE id = v_wallet_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.record_wallet_income FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_wallet_income TO service_role;

-- has_active_subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid AND environment = check_env
      AND ((status IN ('active', 'trialing', 'past_due') AND (current_period_end IS NULL OR current_period_end > now())) OR (status = 'canceled' AND current_period_end > now()))
  );
$$;

-- sync_premium_tier_from_subscription
CREATE OR REPLACE FUNCTION public.sync_premium_tier_from_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_active boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = NEW.user_id AND environment = NEW.environment
      AND ((status IN ('active', 'trialing', 'past_due') AND (current_period_end IS NULL OR current_period_end > now())) OR (status = 'canceled' AND current_period_end > now()))
  ) INTO has_active;

  IF has_active THEN
    UPDATE public.user_profiles SET premium_tier = 'pro', is_premium = true, premium_expires_at = NEW.current_period_end, updated_at = now() WHERE id = NEW.user_id;
  ELSE
    UPDATE public.user_profiles SET premium_tier = 'free', is_premium = false, premium_expires_at = NULL, updated_at = now() WHERE id = NEW.user_id AND premium_tier = 'pro';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_premium_tier ON public.subscriptions;
CREATE TRIGGER trg_sync_premium_tier AFTER INSERT OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.sync_premium_tier_from_subscription();

-- start_pro_trial
CREATE OR REPLACE FUNCTION public.start_pro_trial()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile record;
  v_new_end timestamptz := now() + interval '7 days';
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  SELECT is_premium, trial_started_at, trial_ends_at, premium_expires_at INTO v_profile
  FROM public.user_profiles WHERE id = v_uid FOR UPDATE;

  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'no_profile'); END IF;
  IF v_profile.trial_started_at IS NOT NULL OR v_profile.trial_ends_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'trial_already_used');
  END IF;
  IF COALESCE(v_profile.is_premium, false) = true AND (v_profile.premium_expires_at IS NULL OR v_profile.premium_expires_at > now()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_premium');
  END IF;

  UPDATE public.user_profiles SET trial_started_at = now(), trial_ends_at = v_new_end, updated_at = now() WHERE id = v_uid;
  RETURN jsonb_build_object('ok', true, 'trial_ends_at', v_new_end);
END;
$$;

REVOKE ALL ON FUNCTION public.start_pro_trial() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.start_pro_trial() TO authenticated;

-- Migrate data: copy amount to gross_amount/net_amount if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'amount') THEN
    UPDATE public.wallet_transactions SET gross_amount = amount, net_amount = amount WHERE gross_amount IS NULL;
  END IF;
END $$;

COMMIT;
