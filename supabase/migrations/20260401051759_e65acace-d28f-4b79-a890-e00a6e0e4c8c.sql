CREATE TABLE IF NOT EXISTS public.currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_pair text UNIQUE NOT NULL,
  rate numeric NOT NULL,
  source text,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- The table was introduced earlier with the same core columns but without
-- created_at. Reconcile that legacy shape before applying this migration.
ALTER TABLE public.currency_rates
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read currency rates" ON public.currency_rates;
CREATE POLICY "Anyone can read currency rates"
  ON public.currency_rates FOR SELECT
  TO anon, authenticated
  USING (true);
