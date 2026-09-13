-- The baseline schema uses UUID block IDs and keeps a foreign key from
-- analytics. Keep that contract here; the later analytics migration removes
-- the foreign key when string IDs are needed by the editor.

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
  WHERE id::text = block_id;
END;
$$;
