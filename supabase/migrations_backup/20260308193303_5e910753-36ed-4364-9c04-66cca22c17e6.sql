
-- P2.5: Child entity lifecycle engine + service_slugs governance + diagnostics expansion

-- 1. Upgrade save_page_blocks to deterministically sync service_slugs
-- Rules:
--   - Slug created once per service title, survives renames
--   - Duplicate titles get suffix (-2, -3)
--   - Removed services stay in mapping with '_removed' marker
--   - Thin services (no description or < 20 chars) get '_thin' marker
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
  -- Child entity lifecycle vars
  v_old_slugs jsonb;
  v_new_slugs jsonb := '{}'::jsonb;
  v_item jsonb;
  v_svc_title text;
  v_svc_slug text;
  v_svc_desc text;
  v_slug_base text;
  v_slug_candidate text;
  v_slug_counter integer;
  v_existing_titles text[];
  v_used_slugs text[];
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

  -- Get existing service_slugs mapping
  v_old_slugs := COALESCE(v_page.service_slugs, '{}'::jsonb);
  v_existing_titles := '{}';
  v_used_slugs := '{}';

  -- ====== CHILD ENTITY LIFECYCLE: service_slugs sync ======
  -- Collect all current service titles from pricing blocks
  FOR v_block IN SELECT * FROM jsonb_array_elements(p_blocks)
  LOOP
    IF v_block->>'type' = 'pricing' THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_block->'content'->'items', '[]'::jsonb))
      LOOP
        v_svc_title := COALESCE(v_item->>'title', v_item->>'name', '');
        IF length(v_svc_title) < 2 THEN CONTINUE; END IF;

        v_svc_desc := COALESCE(v_item->>'description', '');
        
        -- Check if this title already has a slug in old mapping
        v_svc_slug := v_old_slugs->>v_svc_title;
        
        IF v_svc_slug IS NOT NULL THEN
          -- Reuse existing slug (stable across renames within same title)
          -- Strip _removed/_thin markers if service is back
          v_svc_slug := regexp_replace(v_svc_slug, '::(removed|thin)$', '');
        ELSE
          -- Generate new slug from title
          v_slug_base := lower(regexp_replace(
            regexp_replace(v_svc_title, '[^a-zA-Zа-яА-ЯёЁ0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
          ));
          -- Transliterate basic Cyrillic
          v_slug_base := translate(v_slug_base,
            'абвгдежзийклмнопрстуфхцчшщъыьэюя',
            'abvgdezhzijklmnoprstufhcchshshh_y_eyu_ya');
          v_slug_base := regexp_replace(v_slug_base, '[^a-z0-9-]', '', 'g');
          v_slug_base := regexp_replace(v_slug_base, '-+', '-', 'g');
          v_slug_base := trim(both '-' from v_slug_base);
          IF length(v_slug_base) < 2 THEN v_slug_base := 'service'; END IF;
          v_slug_base := left(v_slug_base, 60);
          
          -- Deduplicate within this save batch
          v_slug_candidate := v_slug_base;
          v_slug_counter := 2;
          WHILE v_slug_candidate = ANY(v_used_slugs) LOOP
            v_slug_candidate := v_slug_base || '-' || v_slug_counter;
            v_slug_counter := v_slug_counter + 1;
          END LOOP;
          v_svc_slug := v_slug_candidate;
        END IF;

        -- Mark thin services
        IF length(v_svc_desc) < 20 THEN
          v_new_slugs := v_new_slugs || jsonb_build_object(v_svc_title, v_svc_slug || '::thin');
        ELSE
          v_new_slugs := v_new_slugs || jsonb_build_object(v_svc_title, v_svc_slug);
        END IF;
        
        v_existing_titles := array_append(v_existing_titles, v_svc_title);
        v_used_slugs := array_append(v_used_slugs, v_svc_slug);
      END LOOP;
    END IF;
  END LOOP;

  -- Mark removed services (were in old mapping, not in current blocks)
  DECLARE
    v_old_key text;
    v_old_val text;
  BEGIN
    FOR v_old_key, v_old_val IN SELECT * FROM jsonb_each_text(v_old_slugs)
    LOOP
      IF NOT (v_old_key = ANY(v_existing_titles)) THEN
        -- Preserve slug but mark as removed
        v_old_val := regexp_replace(v_old_val, '::(removed|thin)$', '');
        v_new_slugs := v_new_slugs || jsonb_build_object(v_old_key, v_old_val || '::removed');
      END IF;
    END LOOP;
  END;

  -- ====== QUALITY SCORING (unchanged logic) ======
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
    IF NOT v_has_bio AND (v_block->>'type' = 'text' OR v_block->>'type' = 'profile') THEN
      v_bio_length := coalesce(length(v_block->'content'->>'text'), 0) + coalesce(length(v_block->'content'->>'bio'), 0);
      IF v_bio_length > 50 THEN
        v_has_bio := true;
        v_score := v_score + 15;
      END IF;
    END IF;

    IF NOT v_has_pricing AND v_block->>'type' = 'pricing' THEN
      v_service_count := jsonb_array_length(coalesce(v_block->'content'->'items', '[]'::jsonb));
      IF v_service_count > 0 THEN
        v_has_pricing := true;
        v_score := v_score + 15;
      END IF;
    END IF;

    IF NOT v_has_socials AND v_block->>'type' = 'socials' THEN
      IF jsonb_array_length(coalesce(v_block->'content'->'platforms', '[]'::jsonb)) > 0 THEN
        v_has_socials := true;
        v_score := v_score + 10;
      END IF;
    END IF;

    IF NOT v_has_booking AND (v_block->>'type' = 'booking' OR v_block->>'type' = 'form' OR v_block->>'type' = 'newsletter') THEN
      v_has_booking := true;
      v_score := v_score + 15;
    END IF;
  END LOOP;

  -- Contact fields on page
  IF NOT v_has_booking AND (
    (v_page.contact_email IS NOT NULL AND length(v_page.contact_email) > 0) OR
    (v_page.contact_phone IS NOT NULL AND length(v_page.contact_phone) > 0) OR
    (v_page.contact_whatsapp IS NOT NULL AND length(v_page.contact_whatsapp) > 0)
  ) THEN
    v_has_booking := true;
    v_score := v_score + 15;
  END IF;

  IF NOT v_has_bio THEN v_exclusions := array_append(v_exclusions, 'missing_bio'); END IF;
  IF NOT v_has_pricing THEN v_exclusions := array_append(v_exclusions, 'no_services'); END IF;
  IF NOT v_has_socials THEN v_exclusions := array_append(v_exclusions, 'no_socials'); END IF;
  IF NOT v_has_booking THEN v_exclusions := array_append(v_exclusions, 'no_contact'); END IF;
  IF v_score < 40 THEN v_exclusions := array_append(v_exclusions, 'low_quality_score'); END IF;
  IF NOT v_page.is_published THEN v_exclusions := array_append(v_exclusions, 'unpublished'); END IF;

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

  -- Update page with quality + service_slugs
  UPDATE public.pages 
  SET quality_score = v_score,
      quality_breakdown = v_breakdown,
      index_exclusion_reasons = v_exclusions,
      service_slugs = v_new_slugs,
      updated_at = now()
  WHERE id = p_page_id;
END;
$function$;

-- 2. Upgrade diagnostics RPC with child entity summary
CREATE OR REPLACE FUNCTION public.get_page_search_diagnostics(p_page_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_page record;
  v_recent_submissions jsonb;
  v_child_total integer := 0;
  v_child_eligible integer := 0;
  v_child_excluded_thin integer := 0;
  v_child_removed integer := 0;
  v_child_details jsonb := '[]'::jsonb;
  v_svc_title text;
  v_svc_val text;
  v_svc_slug text;
  v_svc_state text;
  v_is_indexable boolean;
BEGIN
  SELECT
    id, slug, is_published, quality_score, quality_breakdown,
    index_exclusion_reasons, last_indexnow_at, service_slugs,
    city, profession, entity_type, niche, updated_at
  INTO v_page
  FROM public.pages
  WHERE id = p_page_id;

  IF v_page IS NULL THEN
    RETURN jsonb_build_object('error', 'page_not_found');
  END IF;

  v_is_indexable := v_page.is_published AND COALESCE(v_page.quality_score, 0) >= 40;

  -- Parse service_slugs into child entity states
  FOR v_svc_title, v_svc_val IN
    SELECT * FROM jsonb_each_text(COALESCE(v_page.service_slugs, '{}'::jsonb))
  LOOP
    v_child_total := v_child_total + 1;

    -- Parse state marker from slug value (slug::state or just slug)
    IF v_svc_val LIKE '%::removed' THEN
      v_svc_slug := regexp_replace(v_svc_val, '::removed$', '');
      v_svc_state := 'removed';
      v_child_removed := v_child_removed + 1;
    ELSIF v_svc_val LIKE '%::thin' THEN
      v_svc_slug := regexp_replace(v_svc_val, '::thin$', '');
      v_svc_state := 'excluded_thin';
      v_child_excluded_thin := v_child_excluded_thin + 1;
    ELSE
      v_svc_slug := v_svc_val;
      IF v_is_indexable THEN
        v_svc_state := 'eligible';
        v_child_eligible := v_child_eligible + 1;
      ELSE
        v_svc_state := 'parent_not_indexable';
      END IF;
    END IF;

    v_child_details := v_child_details || jsonb_build_array(jsonb_build_object(
      'title', v_svc_title,
      'slug', v_svc_slug,
      'state', v_svc_state,
      'url', 'https://lnkmx.my/' || v_page.slug || '/services/' || v_svc_slug
    ));
  END LOOP;

  -- Last 10 indexing submissions
  SELECT COALESCE(jsonb_agg(sub ORDER BY sub_created DESC), '[]'::jsonb)
  INTO v_recent_submissions
  FROM (
    SELECT jsonb_build_object(
      'id', s.id,
      'target_url', s.target_url,
      'child_type', s.child_type,
      'provider', s.provider,
      'action_type', s.action_type,
      'status', s.submission_status,
      'skip_reason', s.skip_reason,
      'http_status', s.http_status,
      'created_at', s.created_at
    ) as sub, s.created_at as sub_created
    FROM public.indexing_submissions s
    WHERE s.page_id = p_page_id
    ORDER BY s.created_at DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'page_id', v_page.id,
    'slug', v_page.slug,
    'is_published', v_page.is_published,
    'quality_score', COALESCE(v_page.quality_score, 0),
    'quality_breakdown', v_page.quality_breakdown,
    'index_exclusion_reasons', v_page.index_exclusion_reasons,
    'is_indexable', v_is_indexable,
    'included_in_sitemap', v_is_indexable,
    'last_indexnow_at', v_page.last_indexnow_at,
    'service_slugs', v_page.service_slugs,
    'canonical_url', 'https://lnkmx.my/' || v_page.slug,
    -- Child entity summary
    'child_page_count', v_child_total - v_child_removed,
    'child_summary', jsonb_build_object(
      'total', v_child_total,
      'eligible', v_child_eligible,
      'excluded_thin', v_child_excluded_thin,
      'removed', v_child_removed,
      'parent_not_indexable', v_child_total - v_child_eligible - v_child_excluded_thin - v_child_removed
    ),
    'child_details', v_child_details,
    'recent_submissions', v_recent_submissions,
    'diagnostics_at', now()
  );
END;
$$;
