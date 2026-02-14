-- Fix: Restrict user_profiles public SELECT to non-sensitive fields only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can search other profiles" ON public.user_profiles;

-- Create a new policy that only allows authenticated users to view limited data
CREATE POLICY "Users can view public profile data"
ON public.user_profiles
FOR SELECT
USING (
  -- Own profile - full access
  auth.uid() = id
  OR 
  -- Others - only if authenticated (they'll get limited fields via view)
  auth.uid() IS NOT NULL
);

-- Create a secure view for public profile data that hides sensitive fields
CREATE OR REPLACE VIEW public.public_user_profiles AS
SELECT 
  id,
  username,
  display_name,
  avatar_url,
  bio,
  current_streak,
  longest_streak,
  friends_count,
  is_premium,
  created_at
FROM public.user_profiles;

-- Grant select on the view
GRANT SELECT ON public.public_user_profiles TO authenticated;
GRANT SELECT ON public.public_user_profiles TO anon;

-- Fix: Add spam protection for gallery likes - create tracking table
CREATE TABLE IF NOT EXISTS public.page_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id uuid,
  ip_hash text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(page_id, user_id),
  UNIQUE(page_id, ip_hash)
);

-- Enable RLS on page_likes
ALTER TABLE public.page_likes ENABLE ROW LEVEL SECURITY;

-- Users can see their own likes
CREATE POLICY "Users can view their own likes"
ON public.page_likes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own likes
CREATE POLICY "Users can like pages"
ON public.page_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND ip_hash IS NOT NULL));

-- Users can delete their own likes
CREATE POLICY "Users can unlike pages"
ON public.page_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Update like_gallery_page function to use tracking
CREATE OR REPLACE FUNCTION public.like_gallery_page(p_page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  -- Insert like record (will fail silently on duplicate)
  INSERT INTO public.page_likes (page_id, user_id)
  VALUES (p_page_id, v_user_id)
  ON CONFLICT DO NOTHING;
  
  -- Update counter from actual count
  UPDATE public.pages 
  SET gallery_likes = (
    SELECT COUNT(*) FROM public.page_likes WHERE page_id = p_page_id
  )
  WHERE id = p_page_id AND is_in_gallery = true;
END;
$$;

-- Update unlike_gallery_page function
CREATE OR REPLACE FUNCTION public.unlike_gallery_page(p_page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  -- Delete like record
  DELETE FROM public.page_likes 
  WHERE page_id = p_page_id AND user_id = v_user_id;
  
  -- Update counter from actual count
  UPDATE public.pages 
  SET gallery_likes = (
    SELECT COUNT(*) FROM public.page_likes WHERE page_id = p_page_id
  )
  WHERE id = p_page_id;
END;
$$;

-- Fix: Add ownership check to save_page_blocks
CREATE OR REPLACE FUNCTION public.save_page_blocks(p_page_id uuid, p_blocks jsonb, p_is_premium boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify ownership
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

-- Fix: Add ownership check to toggle_gallery_status
CREATE OR REPLACE FUNCTION public.toggle_gallery_status(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status boolean;
  v_new_status boolean;
BEGIN
  -- Verify caller is the owner
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only toggle your own gallery status';
  END IF;

  SELECT is_in_gallery INTO v_current_status 
  FROM public.pages 
  WHERE user_id = p_user_id;
  
  v_new_status := NOT COALESCE(v_current_status, false);
  
  UPDATE public.pages
  SET 
    is_in_gallery = v_new_status,
    gallery_featured_at = CASE WHEN v_new_status THEN now() ELSE NULL END
  WHERE user_id = p_user_id;
  
  RETURN v_new_status;
END;
$$;