-- Create a view for public page access that excludes user_id
CREATE OR REPLACE VIEW public.public_pages AS
SELECT 
  id,
  slug,
  title,
  description,
  avatar_url,
  avatar_style,
  theme_settings,
  seo_meta,
  is_published,
  view_count,
  created_at,
  updated_at
FROM public.pages
WHERE is_published = true;

-- Grant access to the view for anonymous and authenticated users
GRANT SELECT ON public.public_pages TO anon;
GRANT SELECT ON public.public_pages TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.public_pages IS 'Public view of published pages that excludes user_id to prevent user enumeration';