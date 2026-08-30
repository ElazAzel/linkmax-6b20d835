-- Change analytics.block_id to TEXT to match blocks.id which uses generated string IDs
ALTER TABLE public.analytics 
  ALTER COLUMN block_id TYPE TEXT;

-- Drop the old function that took UUID
DROP FUNCTION IF EXISTS public.increment_block_clicks(UUID);

-- Create new function that takes TEXT
CREATE OR REPLACE FUNCTION public.increment_block_clicks(block_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blocks
  SET click_count = click_count + 1
  WHERE id = block_id;
END;
$$;
