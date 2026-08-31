REVOKE SELECT ON public.sites FROM anon;

GRANT SELECT (
  id,
  name,
  primary_page_id,
  settings,
  header_blocks,
  footer_blocks,
  created_at,
  updated_at
) ON public.sites TO anon;
