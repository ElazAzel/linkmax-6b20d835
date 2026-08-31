-- Add custom_domain to pages table
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Create an index for faster lookups when routing
CREATE INDEX IF NOT EXISTS idx_pages_custom_domain ON public.pages(custom_domain);

-- Add comment explaining usage
COMMENT ON COLUMN public.pages.custom_domain IS 'User-provided custom domain for this page (e.g. "ivan.ru"). Must be unique across all pages and requires CNAME configuration pointing to lnkmx.my.';
