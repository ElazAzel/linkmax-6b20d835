-- Page version snapshots for stable URLs and version tracking
CREATE TABLE IF NOT EXISTS public.page_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  version_id VARCHAR(12) NOT NULL,
  content_hash VARCHAR(16) NOT NULL,
  blocks_json JSONB NOT NULL,
  theme_json JSONB,
  seo_json JSONB,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast version lookups
CREATE INDEX IF NOT EXISTS idx_page_snapshots_page_id ON public.page_snapshots(page_id);
CREATE INDEX IF NOT EXISTS idx_page_snapshots_version ON public.page_snapshots(page_id, version_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_snapshots_unique_version ON public.page_snapshots(page_id, version_id);

-- Enable RLS
ALTER TABLE public.page_snapshots ENABLE ROW LEVEL SECURITY;

-- Anyone can read published snapshots (for stable URL access)
CREATE POLICY "Anyone can view page snapshots" 
ON public.page_snapshots 
FOR SELECT 
USING (true);

-- Only page owners can create snapshots (via trigger, not direct insert)
CREATE POLICY "Page owners can create snapshots" 
ON public.page_snapshots 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pages 
    WHERE pages.id = page_id 
    AND pages.user_id = auth.uid()
  )
);

-- Add quality_score column to pages table for quality gate
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS is_indexable BOOLEAN DEFAULT true;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS last_snapshot_at TIMESTAMP WITH TIME ZONE;

-- Function to create a snapshot on publish
CREATE OR REPLACE FUNCTION public.create_page_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_version_id VARCHAR(12);
  v_content_hash VARCHAR(16);
  v_blocks JSONB;
BEGIN
  -- Only create snapshot if page is being published
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL OR OLD.updated_at IS DISTINCT FROM NEW.updated_at) THEN
    -- Get blocks for this page
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'type', type,
        'position', position,
        'content', content,
        'style', style
      ) ORDER BY position
    ) INTO v_blocks
    FROM public.blocks
    WHERE page_id = NEW.id;
    
    -- Generate version ID (timestamp-based)
    v_version_id := to_char(now(), 'YYYYMMDDHH24MI');
    
    -- Generate simple content hash
    v_content_hash := substr(md5(v_blocks::text), 1, 8);
    
    -- Insert snapshot (on conflict update)
    INSERT INTO public.page_snapshots (page_id, version_id, content_hash, blocks_json, theme_json, seo_json)
    VALUES (
      NEW.id,
      v_version_id,
      v_content_hash,
      COALESCE(v_blocks, '[]'::jsonb),
      NEW.theme_settings,
      NEW.seo_meta
    )
    ON CONFLICT (page_id, version_id) DO UPDATE
    SET content_hash = EXCLUDED.content_hash,
        blocks_json = EXCLUDED.blocks_json,
        theme_json = EXCLUDED.theme_json,
        seo_json = EXCLUDED.seo_json,
        published_at = now();
    
    -- Update last snapshot timestamp
    NEW.last_snapshot_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-snapshot on publish
DROP TRIGGER IF EXISTS trigger_page_snapshot ON public.pages;
CREATE TRIGGER trigger_page_snapshot
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_page_snapshot();

-- Function to get page by version
CREATE OR REPLACE FUNCTION public.get_page_version(p_slug TEXT, p_version_id VARCHAR DEFAULT NULL)
RETURNS TABLE (
  page_id UUID,
  slug TEXT,
  version_id VARCHAR,
  blocks_json JSONB,
  theme_json JSONB,
  seo_json JSONB,
  published_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF p_version_id IS NOT NULL THEN
    -- Return specific version
    RETURN QUERY
    SELECT 
      ps.page_id,
      p.slug,
      ps.version_id,
      ps.blocks_json,
      ps.theme_json,
      ps.seo_json,
      ps.published_at
    FROM public.page_snapshots ps
    JOIN public.pages p ON p.id = ps.page_id
    WHERE p.slug = p_slug 
    AND ps.version_id = p_version_id
    AND p.is_published = true;
  ELSE
    -- Return latest version
    RETURN QUERY
    SELECT 
      ps.page_id,
      p.slug,
      ps.version_id,
      ps.blocks_json,
      ps.theme_json,
      ps.seo_json,
      ps.published_at
    FROM public.page_snapshots ps
    JOIN public.pages p ON p.id = ps.page_id
    WHERE p.slug = p_slug 
    AND p.is_published = true
    ORDER BY ps.published_at DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;