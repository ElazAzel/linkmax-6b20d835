CREATE TABLE IF NOT EXISTS public.integration_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

REVOKE ALL ON public.integration_secrets FROM anon, authenticated;
GRANT ALL ON public.integration_secrets TO service_role;

ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (edge functions) can access the values.