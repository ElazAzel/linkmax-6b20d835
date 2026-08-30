-- P1-D: Add diagnostics fields to pages table
ALTER TABLE public.pages 
  ADD COLUMN IF NOT EXISTS last_indexnow_at timestamptz,
  ADD COLUMN IF NOT EXISTS index_exclusion_reasons text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS quality_breakdown jsonb DEFAULT '{}'::jsonb;

-- Update save_page_blocks to store quality_breakdown JSON + exclusion reasons
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
  v_breakdown jsonb;
  v_exclusions text[] := '{}';
  v_check_name boolean := false;
  v_check_avatar boolean := false;
  v_check_niche boolean := false;
  v_check_city boolean := false;
  v_service_count integer := 0;
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
    v_check_name := true;
  ELSE
    v_exclusions := array_append(v_exclusions, 'missing_name');
  END IF;

  -- Avatar: 10pts
  IF v_page.avatar_url IS NOT NULL AND length(v_page.avatar_url) > 0 THEN
    v_score := v_score + 10;
    v_check_avatar := true;
  ELSE
    v_exclusions := array_append(v_exclusions, 'missing_avatar');
  END IF;

  -- Niche (not 'other'): 10pts
  IF v_page.niche IS NOT NULL AND v_page.niche != 'other' AND length(v_page.niche) > 0 THEN
    v_score := v_score + 10;
    v_check_niche := true;
  ELSE
    v_exclusions := array_append(v_exclusions, 'missing_niche');
  END IF;

  -- City: 10pts
  IF v_page.city IS NOT NULL AND length(v_page.city) > 0 THEN
    v_score := v_score + 10;
    v_check_city := true;
  ELSE
    v_exclusions := array_append(v_exclusions, 'missing_city');
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
      v_service_count := jsonb_array_length(coalesce(v_block->'content'->'items', '[]'::jsonb));
      IF v_service_count > 0 THEN
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
    IF NOT v_has_booking AND (v_block->>'type' = 'booking' OR v_block->>'type' = 'form' OR v_block->>'type' = 'newsletter') THEN
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
    v_has_booking := true;
    v_score := v_score + 15;
  END IF;

  -- Build exclusion reasons
  IF NOT v_has_bio THEN v_exclusions := array_append(v_exclusions, 'missing_bio'); END IF;
  IF NOT v_has_pricing THEN v_exclusions := array_append(v_exclusions, 'no_services'); END IF;
  IF NOT v_has_socials THEN v_exclusions := array_append(v_exclusions, 'no_socials'); END IF;
  IF NOT v_has_booking THEN v_exclusions := array_append(v_exclusions, 'no_contact'); END IF;
  IF v_score < 40 THEN v_exclusions := array_append(v_exclusions, 'low_quality_score'); END IF;
  IF NOT v_page.is_published THEN v_exclusions := array_append(v_exclusions, 'unpublished'); END IF;

  -- Build quality breakdown JSON
  v_breakdown := jsonb_build_object(
    'name', jsonb_build_object('passed', v_check_name, 'points', 15),
    'avatar', jsonb_build_object('passed', v_check_avatar, 'points', 10),
    'bio', jsonb_build_object('passed', v_has_bio, 'points', 15),
    'niche', jsonb_build_object('passed', v_check_niche, 'points', 10),
    'services', jsonb_build_object('passed', v_has_pricing, 'points', 15, 'count', v_service_count),
    'city', jsonb_build_object('passed', v_check_city, 'points', 10),
    'socials', jsonb_build_object('passed', v_has_socials, 'points', 10),
    'contact', jsonb_build_object('passed', v_has_booking, 'points', 15)
  );

  -- Update quality_score, breakdown, and exclusion reasons
  UPDATE public.pages 
  SET quality_score = v_score,
      quality_breakdown = v_breakdown,
      index_exclusion_reasons = v_exclusions
  WHERE id = p_page_id;
END;
$function$;