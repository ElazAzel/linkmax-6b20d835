-- Migration: Add currency_rates table
CREATE TABLE IF NOT EXISTS public.currency_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_pair TEXT NOT NULL DEFAULT 'USD_KZT',
    rate NUMERIC(10,2) NOT NULL,
    source TEXT NOT NULL DEFAULT 'nationalbank.kz',
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(currency_pair)
);

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.currency_rates FOR SELECT USING (true);
-- Service role has bypass RLS, so it can insert/update

-- Add initial row (will be updated by edge function)
INSERT INTO public.currency_rates (currency_pair, rate) 
VALUES ('USD_KZT', 497.33)
ON CONFLICT (currency_pair) DO NOTHING;
