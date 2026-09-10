-- analytics.block_id and blocks.id are UUIDs in the canonical schema. Keep the
-- RPC argument text-compatible with the client, but do not change the FK-backed
-- column type during replay.

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
  WHERE id = block_id::uuid;
END;
$$;
