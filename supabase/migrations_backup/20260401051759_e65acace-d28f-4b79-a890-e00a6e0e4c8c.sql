CREATE TABLE public.currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_pair text UNIQUE NOT NULL,
  rate numeric NOT NULL,
  source text,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read currency rates"
  ON public.currency_rates FOR SELECT
  TO anon, authenticated
  USING (true);