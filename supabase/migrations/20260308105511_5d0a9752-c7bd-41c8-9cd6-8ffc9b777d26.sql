-- Orders table (for payment processing)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KZT',
  provider text NOT NULL DEFAULT 'robokassa',
  description text,
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- The payment-order migration may have created public.orders earlier with a
-- zone owner only. Reconcile the later user-facing billing contract.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Billing history (human-readable records)
CREATE TABLE IF NOT EXISTS public.billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KZT',
  description text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (user_id = auth.uid());

-- Users can view their own billing
DROP POLICY IF EXISTS "Users view own billing" ON public.billing_history;
CREATE POLICY "Users view own billing" ON public.billing_history FOR SELECT USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON public.billing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_created_at ON public.billing_history(created_at DESC);
