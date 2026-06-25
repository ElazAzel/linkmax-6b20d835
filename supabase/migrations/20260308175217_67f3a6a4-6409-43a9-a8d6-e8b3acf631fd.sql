-- P1: Add entity-grade fields to pages table for SEO entity architecture
ALTER TABLE public.pages 
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'KZ',
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS entity_type text DEFAULT 'person',
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_whatsapp text;

-- Add slug to events for child page URLs
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS slug text;

-- Create index on events slug for fast lookup
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- Create index on pages quality_score for sitemap filtering
CREATE INDEX IF NOT EXISTS idx_pages_quality_score ON public.pages(quality_score) WHERE is_published = true;

-- Create index on pages entity fields for SSR queries
CREATE INDEX IF NOT EXISTS idx_pages_published_indexable ON public.pages(is_published, quality_score) WHERE is_published = true;

-- Update save_page_blocks to recompute quality_score
CREATE OR REPLACE FUNCTION public.save_page_blocks(p_page_id uuid, p_blocks jsonb, p_is_premium boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_score integer := 0;
  v_page record;
  v_has_bio boolean := false;
  v_has_pricing boolean := false;
  v_has_socials boolean := false;
  v_has_booking boolean := false;
  v_bio_length integer := 0;
  v_block jsonb;
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

  -- Compute quality_score from page data + blocks
  SELECT * INTO v_page FROM public.pages WHERE id = p_page_id;

  -- Title/display name: 15pts
  IF v_page.title IS NOT NULL AND length(v_page.title) > 0 THEN
    v_score := v_score + 15;
  END IF;

  -- Avatar: 10pts
  IF v_page.avatar_url IS NOT NULL AND length(v_page.avatar_url) > 0 THEN
    v_score := v_score + 10;
  END IF;

  -- Niche (not 'other'): 10pts
  IF v_page.niche IS NOT NULL AND v_page.niche != 'other' AND length(v_page.niche) > 0 THEN
    v_score := v_score + 10;
  END IF;

  -- City: 10pts
  IF v_page.city IS NOT NULL AND length(v_page.city) > 0 THEN
    v_score := v_score + 10;
  END IF;

  -- Scan blocks for content signals
  FOR v_block IN SELECT * FROM jsonb_array_elements(p_blocks)
  LOOP
    -- Bio from text or profile block: 15pts
    IF NOT v_has_bio AND (v_block->>'type' = 'text' OR v_block->>'type' = 'profile') THEN
      v_bio_length := coalesce(length(v_block->'content'->>'text'), 0) + coalesce(length(v_block->'content'->>'bio'), 0);
      IF v_bio_length > 50 THEN
        v_has_bio := true;
        v_score := v_score + 15;
      END IF;
    END IF;

    -- Pricing/services: 15pts
    IF NOT v_has_pricing AND v_block->>'type' = 'pricing' THEN
      IF jsonb_array_length(coalesce(v_block->'content'->'items', '[]'::jsonb)) > 0 THEN
        v_has_pricing := true;
        v_score := v_score + 15;
      END IF;
    END IF;

    -- Social links: 10pts
    IF NOT v_has_socials AND v_block->>'type' = 'socials' THEN
      IF jsonb_array_length(coalesce(v_block->'content'->'platforms', '[]'::jsonb)) > 0 THEN
        v_has_socials := true;
        v_score := v_score + 10;
      END IF;
    END IF;

    -- Booking or contact: 15pts
    IF NOT v_has_booking AND (v_block->>'type' = 'booking' OR v_block->>'type' = 'form') THEN
      v_has_booking := true;
      v_score := v_score + 15;
    END IF;
  END LOOP;

  -- Also check contact fields on page
  IF NOT v_has_booking AND (
    (v_page.contact_email IS NOT NULL AND length(v_page.contact_email) > 0) OR
    (v_page.contact_phone IS NOT NULL AND length(v_page.contact_phone) > 0) OR
    (v_page.contact_whatsapp IS NOT NULL AND length(v_page.contact_whatsapp) > 0)
  ) THEN
    v_score := v_score + 15;
  END IF;

  -- Update quality_score
  UPDATE public.pages SET quality_score = v_score WHERE id = p_page_id;
END;
$function$;