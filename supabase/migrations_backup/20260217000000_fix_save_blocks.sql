-- Fix for "Access denied: you do not own this page" error in save_page_blocks
-- The previous check relied on looking up the page by ID and checking ownership
-- This updates the function to explicitly accept user_id and verify it matches auth.uid()
-- AND matches the page owner.

CREATE OR REPLACE FUNCTION public.save_page_blocks(
  p_page_id uuid, 
  p_blocks jsonb, 
  p_is_premium boolean DEFAULT false,
  p_user_id uuid DEFAULT auth.uid() -- Default to current user if not provided, but explicit is better
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Security check: Ensure authenticated user is acting on their own behalf
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Verify p_user_id matches auth.uid() if provided
  -- (If p_user_id is passed, it MUST match the authenticated user)
  IF p_user_id IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: User ID mismatch';
  END IF;

  -- 3. Verify ownership: The page must belong to the user
  IF NOT EXISTS (SELECT 1 FROM public.pages WHERE id = p_page_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: you do not own this page';
  END IF;

  -- Delete old blocks
  DELETE FROM public.blocks WHERE page_id = p_page_id;
  
  -- Insert new blocks
  INSERT INTO public.blocks (page_id, type, position, title, content, style, is_premium, schedule, click_count)
  SELECT 
    p_page_id,
    (block->>'type')::text,
    (block->>'position')::integer,
    block->>'title',
    block->'content',
    COALESCE(block->'style', '{}'::jsonb),
    p_is_premium,
    block->'schedule',
    0
  FROM jsonb_array_elements(p_blocks) AS block;
END;
$$;
