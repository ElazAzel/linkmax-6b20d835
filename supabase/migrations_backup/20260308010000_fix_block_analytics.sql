-- Migration: Fix Block Analytics
-- 1. Remove foreign key constraint from analytics to blocks to prevent data loss on page save
-- 2. Fix increment_block_clicks function to actually update the click_count
-- 3. Ensure the function is accessible to everyone

-- Drop the old constraint if it exists. 
-- In different environments the name might vary, so we'll try to find it or just ignore if not found.
DO $$ 
BEGIN
    -- Try to drop by name if it exists (common for Supabase)
    ALTER TABLE public.analytics DROP CONSTRAINT IF EXISTS analytics_block_id_fkey;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Fix the increment_block_clicks function
-- It should actually update the block's click count.
-- Since blocks might be recreated, we update by the stable ID from the content JSON if needed,
-- but the simplest for now is to update by the ID we have.
-- If save_page_blocks recreates everything, blocks.click_count will be lost anyway,
-- but the analytics table will keep the history.

CREATE OR REPLACE FUNCTION public.increment_block_clicks(block_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to update by UUID first
  UPDATE public.blocks
  SET click_count = click_count + 1
  WHERE id::text = block_id;
  
  -- If we want to be even more robust, we could update by the ID in the content JSON
  -- but that's heavier. The analytics table is the source of truth.
END;
$$;

-- Grant permissions (if not already granted)
GRANT EXECUTE ON FUNCTION public.increment_block_clicks(text) TO anon, authenticated, service_role;

-- Re-confirm RLS for insert on analytics
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'analytics' AND policyname = 'Enable insert for everyone'
    ) THEN
        DROP POLICY IF EXISTS "Enable insert for everyone" ON public.analytics;
        CREATE POLICY "Enable insert for everyone" ON public.analytics FOR INSERT TO public WITH CHECK (true);
    END IF;
END $$;
