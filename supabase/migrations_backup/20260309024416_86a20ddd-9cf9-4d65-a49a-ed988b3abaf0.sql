
-- P2.8: Persistence Integrity Hardening
-- Fix: normalize pricing item IDs in JSONB BEFORE block insertion,
-- so auto-generated IDs persist in blocks.content.items[].

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
  v_item_id text;
  v_svc_title text;
  v_svc_slug text;
  v_svc_desc text;
  v_svc_state text;
  v_old_entry jsonb;
  v_slug_base text;
  v_slug_candidate text;
  v_slug_counter integer;
  v_seen_item_ids text[];
  v_used_slugs text[];
  -- P2.8: Block normalization vars
  v_normalized_blocks jsonb;
  v_block_idx integer;
  v_item_idx integer;
  v_items_arr jsonb;
  v_normalized_items jsonb;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (SELECT 1 FROM public.pages WHERE id = p_page_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: you do not own this page';
  END IF;

  -- ====== P2.8: NORMALIZE PRICING ITEM IDs BEFORE INSERTION ======
  -- Mutate p_blocks JSONB: assign stable IDs to pricing items missing them.
  -- This ensures auto-generated IDs are persisted in blocks.content.items[].
  v_normalized_blocks := p_blocks;
  
  FOR v_block_idx IN 0..jsonb_array_length(v_normalized_blocks) - 1
  LOOP
    v_block := v_normalized_blocks->v_block_idx;
    IF v_block->>'type' = 'pricing' THEN
      v_items_arr := COALESCE(v_block->'content'->'items', '[]'::jsonb);
      v_normalized_items := '[]'::jsonb;
      
      FOR v_item_idx IN 0..jsonb_array_length(v_items_arr) - 1
      LOOP
        v_item := v_items_arr->v_item_idx;
        v_item_id := COALESCE(v_item->>'id', '');
        
        IF length(v_item_id) < 2 THEN
          v_item_id := 'auto-' || gen_random_uuid()::text;
          v_item := jsonb_set(v_item, '{id}', to_jsonb(v_item_id));
        END IF;
        
        v_normalized_items := v_normalized_items || jsonb_build_array(v_item);
      END LOOP;
      
      -- Write normalized items back into the block
      v_block := jsonb_set(v_block, '{content,items}', v_normalized_items);
      -- Write normalized block back into the array
      v_normalized_blocks := jsonb_set(v_normalized_blocks, ARRAY[v_block_idx::text], v_block);
    END IF;
  END LOOP;

  -- Delete old blocks
  DELETE FROM public.blocks WHERE page_id = p_page_id;
  
  -- Insert new blocks FROM NORMALIZED data (IDs now persisted!)
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
  FROM jsonb_array_elements(v_normalized_blocks) AS block;

  -- Compute quality_score from page data + blocks
  SELECT * INTO v_page FROM public.pages WHERE id = p_page_id;

  -- Get existing service_slugs mapping (id-keyed)
  v_old_slugs := COALESCE(v_page.service_slugs, '{}'::jsonb);
  v_seen_item_ids := '{}';
  v_used_slugs := '{}';

  -- Collect all used slugs from old mapping to avoid collisions
  DECLARE
    v_old_key text;
    v_old_val jsonb;
  BEGIN
    FOR v_old_key, v_old_val IN SELECT * FROM jsonb_each(v_old_slugs)
    LOOP
      IF jsonb_typeof(v_old_val) = 'object' THEN
        v_used_slugs := array_append(v_used_slugs, v_old_val->>'slug');
      END IF;
    END LOOP;
  END;

  -- ====== CHILD ENTITY LIFECYCLE: id-keyed service_slugs sync ======
  -- Now uses v_normalized_blocks so item IDs match what was persisted
  FOR v_block IN SELECT * FROM jsonb_array_elements(v_normalized_blocks)
  LOOP
    IF v_block->>'type' = 'pricing' THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_block->'content'->'items', '[]'::jsonb))
      LOOP
        v_item_id := COALESCE(v_item->>'id', '');
        
        -- At this point all items already have IDs from normalization above
        IF length(v_item_id) < 2 THEN CONTINUE; END IF;

        v_svc_title := COALESCE(v_item->>'title', v_item->>'name', '');
        IF length(v_svc_title) < 2 THEN CONTINUE; END IF;

        v_svc_desc := COALESCE(v_item->>'description', '');
        
        -- Check if this item_id already has an entry in old mapping
        v_old_entry := v_old_slugs->v_item_id;
        
        IF v_old_entry IS NOT NULL AND jsonb_typeof(v_old_entry) = 'object' THEN
          -- Reuse existing slug (stable across renames!)
          v_svc_slug := v_old_entry->>'slug';
        ELSE
          -- Generate new slug from current title
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
          
          -- Deduplicate within used slugs
          v_slug_candidate := v_slug_base;
          v_slug_counter := 2;
          WHILE v_slug_candidate = ANY(v_used_slugs) LOOP
            v_slug_candidate := v_slug_base || '-' || v_slug_counter;
            v_slug_counter := v_slug_counter + 1;
          END LOOP;
          v_svc_slug := v_slug_candidate;
        END IF;

        -- Determine state
        IF length(v_svc_desc) < 20 THEN
          v_svc_state := 'thin';
        ELSE
          v_svc_state := 'active';
        END IF;

        v_new_slugs := v_new_slugs || jsonb_build_object(
          v_item_id,
          jsonb_build_object('slug', v_svc_slug, 'state', v_svc_state, 'title', v_svc_title)
        );
        
        v_seen_item_ids := array_append(v_seen_item_ids, v_item_id);
        v_used_slugs := array_append(v_used_slugs, v_svc_slug);
      END LOOP;
    END IF;
  END LOOP;

  -- Mark removed services (were in old mapping, not in current blocks)
  DECLARE
    v_old_key text;
    v_old_val jsonb;
  BEGIN
    FOR v_old_key, v_old_val IN SELECT * FROM jsonb_each(v_old_slugs)
    LOOP
      IF NOT (v_old_key = ANY(v_seen_item_ids)) THEN
        IF jsonb_typeof(v_old_val) = 'object' THEN
          v_new_slugs := v_new_slugs || jsonb_build_object(
            v_old_key,
            jsonb_build_object(
              'slug', v_old_val->>'slug',
              'state', 'removed',
              'title', COALESCE(v_old_val->>'title', v_old_key)
            )
          );
        END IF;
      END IF;
    END LOOP;
  END;

  -- ====== QUALITY SCORING ======
  IF v_page.title IS NOT NULL AND length(v_page.title) > 0 THEN
    v_score := v_score + 15;
    v_check_name := true;
  ELSE
    v_exclusions := array_append(v_exclusions, 'missing_name');
  END IF;

  IF v_page.avatar_url IS NOT NULL AND length(v_page.avatar_url) > 0 THEN
    v_score := v_score + 10;
    v_check_avatar := true;
  ELSE
    v_exclusions := array_append(v_exclusions, 'missing_avatar');
  END IF;

  IF v_page.niche IS NOT NULL AND v_page.niche != 'other' AND length(v_page.niche) > 0 THEN
    v_score := v_score + 10;
    v_check_niche := true;
  ELSE
    v_exclusions := array_append(v_exclusions, 'missing_niche');
  END IF;

  IF v_page.city IS NOT NULL AND length(v_page.city) > 0 THEN
    v_score := v_score + 10;
    v_check_city := true;
  ELSE
    v_exclusions := array_append(v_exclusions, 'missing_city');
  END IF;

  -- Analyze blocks for quality
  FOR v_block IN SELECT * FROM jsonb_array_elements(v_normalized_blocks)
  LOOP
    CASE v_block->>'type'
      WHEN 'profile' THEN
        v_bio_length := length(COALESCE(v_block->'content'->>'bio', ''));
        IF v_bio_length > 0 THEN v_has_bio := true; END IF;
      WHEN 'pricing' THEN
        v_has_pricing := true;
        v_service_count := v_service_count + COALESCE(jsonb_array_length(v_block->'content'->'items'), 0);
      WHEN 'socials' THEN
        v_has_socials := true;
      WHEN 'booking' THEN
        v_has_booking := true;
      ELSE NULL;
    END CASE;
  END LOOP;

  -- Bio scoring
  IF v_has_bio AND v_bio_length >= 100 THEN
    v_score := v_score + 15;
  ELSIF v_has_bio AND v_bio_length >= 30 THEN
    v_score := v_score + 10;
  ELSIF v_has_bio THEN
    v_score := v_score + 5;
  ELSE
    v_exclusions := array_append(v_exclusions, 'missing_bio');
  END IF;

  -- Block type scoring
  IF v_has_pricing AND v_service_count >= 2 THEN
    v_score := v_score + 15;
  ELSIF v_has_pricing THEN
    v_score := v_score + 10;
  ELSE
    v_exclusions := array_append(v_exclusions, 'missing_services');
  END IF;

  IF v_has_socials THEN v_score := v_score + 5; END IF;
  IF v_has_booking THEN v_score := v_score + 10; END IF;

  -- Block count scoring
  IF jsonb_array_length(v_normalized_blocks) >= 4 THEN
    v_score := v_score + 10;
  ELSIF jsonb_array_length(v_normalized_blocks) >= 2 THEN
    v_score := v_score + 5;
  ELSE
    v_exclusions := array_append(v_exclusions, 'too_few_blocks');
  END IF;

  -- Build breakdown
  v_breakdown := jsonb_build_object(
    'name', jsonb_build_object('passed', v_check_name, 'points', CASE WHEN v_check_name THEN 15 ELSE 0 END),
    'avatar', jsonb_build_object('passed', v_check_avatar, 'points', CASE WHEN v_check_avatar THEN 10 ELSE 0 END),
    'niche', jsonb_build_object('passed', v_check_niche, 'points', CASE WHEN v_check_niche THEN 10 ELSE 0 END),
    'city', jsonb_build_object('passed', v_check_city, 'points', CASE WHEN v_check_city THEN 10 ELSE 0 END),
    'bio', jsonb_build_object('passed', v_has_bio, 'points',
      CASE WHEN v_has_bio AND v_bio_length >= 100 THEN 15
           WHEN v_has_bio AND v_bio_length >= 30 THEN 10
           WHEN v_has_bio THEN 5
           ELSE 0 END),
    'services', jsonb_build_object('passed', v_has_pricing, 'points',
      CASE WHEN v_has_pricing AND v_service_count >= 2 THEN 15
           WHEN v_has_pricing THEN 10
           ELSE 0 END,
      'count', v_service_count),
    'socials', jsonb_build_object('passed', v_has_socials, 'points', CASE WHEN v_has_socials THEN 5 ELSE 0 END),
    'booking', jsonb_build_object('passed', v_has_booking, 'points', CASE WHEN v_has_booking THEN 10 ELSE 0 END),
    'blocks', jsonb_build_object('passed', jsonb_array_length(v_normalized_blocks) >= 2, 'points',
      CASE WHEN jsonb_array_length(v_normalized_blocks) >= 4 THEN 10
           WHEN jsonb_array_length(v_normalized_blocks) >= 2 THEN 5
           ELSE 0 END)
  );

  -- Determine indexability
  IF v_score < 40 THEN
    v_exclusions := array_append(v_exclusions, 'low_quality_score');
  END IF;

  -- Update page with computed data
  UPDATE public.pages
  SET quality_score = v_score,
      quality_breakdown = v_breakdown,
      index_exclusion_reasons = v_exclusions,
      service_slugs = v_new_slugs,
      updated_at = now()
  WHERE id = p_page_id;
END;
$function$;
