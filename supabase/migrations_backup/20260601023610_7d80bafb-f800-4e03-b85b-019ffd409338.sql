
-- Quality scoring function: 0-100
CREATE OR REPLACE FUNCTION public.compute_page_quality_score(p_page_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
  block_count integer := 0;
  score integer := 0;
BEGIN
  SELECT id, slug, title, description, avatar_url, contact_email, contact_phone,
         contact_whatsapp, profession, city, seo_meta, is_published
  INTO p FROM public.pages WHERE id = p_page_id;

  IF NOT FOUND OR p.is_published IS NOT TRUE THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO block_count FROM public.blocks WHERE page_id = p_page_id;

  -- Base for being published
  score := 10;
  IF p.title IS NOT NULL AND length(trim(p.title)) >= 2 THEN score := score + 15; END IF;
  IF p.description IS NOT NULL AND length(trim(p.description)) >= 20 THEN score := score + 15; END IF;
  IF p.avatar_url IS NOT NULL THEN score := score + 10; END IF;
  IF p.profession IS NOT NULL OR p.city IS NOT NULL THEN score := score + 5; END IF;
  IF COALESCE(p.contact_email,'') <> '' OR COALESCE(p.contact_phone,'') <> ''
     OR COALESCE(p.contact_whatsapp,'') <> '' THEN score := score + 10; END IF;
  IF p.seo_meta ? 'title' AND length(coalesce(p.seo_meta->>'title','')) >= 5 THEN score := score + 5; END IF;
  IF p.seo_meta ? 'description' AND length(coalesce(p.seo_meta->>'description','')) >= 20 THEN score := score + 5; END IF;

  -- Blocks contribute up to 25 (5 per block, capped)
  score := score + LEAST(25, block_count * 5);

  RETURN LEAST(100, score);
END;
$$;

-- Trigger function for pages table
CREATE OR REPLACE FUNCTION public.tg_pages_update_quality()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.quality_score := public.compute_page_quality_score(NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger function for blocks table (recompute parent page score)
CREATE OR REPLACE FUNCTION public.tg_blocks_update_page_quality()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
BEGIN
  pid := COALESCE(NEW.page_id, OLD.page_id);
  IF pid IS NOT NULL THEN
    UPDATE public.pages
       SET quality_score = public.compute_page_quality_score(pid)
     WHERE id = pid;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS pages_quality_score_trg ON public.pages;
CREATE TRIGGER pages_quality_score_trg
BEFORE INSERT OR UPDATE OF title, description, avatar_url, contact_email,
  contact_phone, contact_whatsapp, profession, city, seo_meta, is_published
ON public.pages
FOR EACH ROW EXECUTE FUNCTION public.tg_pages_update_quality();

DROP TRIGGER IF EXISTS blocks_quality_score_trg ON public.blocks;
CREATE TRIGGER blocks_quality_score_trg
AFTER INSERT OR UPDATE OR DELETE ON public.blocks
FOR EACH ROW EXECUTE FUNCTION public.tg_blocks_update_page_quality();

-- Backfill existing published pages
UPDATE public.pages
   SET quality_score = public.compute_page_quality_score(id)
 WHERE is_published = true;
