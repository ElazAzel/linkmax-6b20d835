-- Add gallery fields to pages table
ALTER TABLE public.pages 
ADD COLUMN IF NOT EXISTS is_in_gallery boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gallery_featured_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS gallery_likes integer DEFAULT 0;

-- Create index for gallery queries
CREATE INDEX IF NOT EXISTS idx_pages_gallery ON public.pages(is_in_gallery, gallery_featured_at DESC) WHERE is_in_gallery = true;

-- Update RLS policy to allow viewing gallery pages
CREATE POLICY "Anyone can view gallery pages" 
ON public.pages 
FOR SELECT 
USING (is_in_gallery = true);

-- Function to toggle gallery status
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

-- Function to like a page
CREATE OR REPLACE FUNCTION public.like_gallery_page(p_page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pages
  SET gallery_likes = gallery_likes + 1
  WHERE id = p_page_id AND is_in_gallery = true;
END;
$$;