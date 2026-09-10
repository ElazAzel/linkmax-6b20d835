DO $$
BEGIN
  -- Older production databases already had pages when this migration ran.
  -- A clean replay creates pages later, and the 2026 repair migration then
  -- adds this column, so the historical step must be safe in both states.
  IF to_regclass('public.pages') IS NOT NULL THEN
    ALTER TABLE public.pages
    ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{}'::jsonb;
  END IF;
END
$$;
