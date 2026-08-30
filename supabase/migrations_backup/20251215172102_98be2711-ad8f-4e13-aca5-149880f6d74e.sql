-- Add function to unlike a gallery page
CREATE OR REPLACE FUNCTION public.unlike_gallery_page(p_page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pages
  SET gallery_likes = GREATEST(gallery_likes - 1, 0)
  WHERE id = p_page_id;
END;
$$;