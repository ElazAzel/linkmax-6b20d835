
-- Sprint 1: Multi-Page Foundation — sites table + page nesting

CREATE TABLE IF NOT EXISTS public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Site',
  primary_page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  header_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  footer_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sites_user_id ON public.sites(user_id);

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS page_path text,
  ADD COLUMN IF NOT EXISTS is_home boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_pages_site_id ON public.pages(site_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_site_path_unique
  ON public.pages(site_id, page_path)
  WHERE site_id IS NOT NULL AND page_path IS NOT NULL;

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sites"
  ON public.sites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own sites"
  ON public.sites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sites"
  ON public.sites FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own sites"
  ON public.sites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public can view sites for published pages"
  ON public.sites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.site_id = sites.id AND p.is_published = true
    )
  );

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill: create a site for every existing user with pages, link primary page
INSERT INTO public.sites (user_id, name, primary_page_id)
SELECT
  p.user_id,
  COALESCE(p.title, 'My Site'),
  p.id
FROM public.pages p
WHERE NOT EXISTS (SELECT 1 FROM public.sites s WHERE s.user_id = p.user_id)
  AND p.id = (
    SELECT id FROM public.pages
    WHERE user_id = p.user_id
    ORDER BY created_at ASC
    LIMIT 1
  );

UPDATE public.pages p
SET site_id = s.id,
    is_home = (s.primary_page_id = p.id)
FROM public.sites s
WHERE s.user_id = p.user_id AND p.site_id IS NULL;
