-- P2.9: Platform Hardening - Notifications, Analytics, Media Lifecycle

-- 1. Notification Queue (Outbox Pattern)
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'lead_created', 'booking_created', 'broadcast', 'system'
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Index for queue processing
CREATE INDEX IF NOT EXISTS idx_notification_queue_status_created ON public.notification_queue(status, created_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Service role has full access
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on notification_queue') THEN
        CREATE POLICY "Service role full access on notification_queue" ON public.notification_queue
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 2. Media Lifecycle Tables
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_path TEXT UNIQUE NOT NULL, -- e.g. 'avatars/uuid/file.png'
    bucket_id TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reference_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_referenced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.media_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.media_assets(id) ON DELETE CASCADE,
    block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE,
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for media tables
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_references ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on media_assets') THEN
        CREATE POLICY "Service role full access on media_assets" ON public.media_assets FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on media_references') THEN
        CREATE POLICY "Service role full access on media_references" ON public.media_references FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 3. Analytics & Blocks Hardening
-- Add deleted_at to blocks for Soft Delete
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blocks' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.blocks ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update analytics foreign key to NOT CASCADE
DO $$
DECLARE
    v_constraint_name text;
BEGIN
    -- Find the constraint name for block_id reference
    SELECT conname INTO v_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.analytics'::regclass
      AND confrelid = 'public.blocks'::regclass;

    IF v_constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.analytics DROP CONSTRAINT ' || v_constraint_name;
    END IF;
    
    ALTER TABLE public.analytics 
    ADD CONSTRAINT analytics_block_id_fkey 
    FOREIGN KEY (block_id) REFERENCES public.blocks(id) ON DELETE SET NULL;
END $$;

-- 4. Refactor save_page_blocks to use UPSERT and Soft Delete
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
  -- P2.8/P2.9: Block normalization & upsert vars
  v_normalized_blocks jsonb;
  v_block_idx integer;
  v_item_idx integer;
  v_items_arr jsonb;
  v_normalized_items jsonb;
  v_current_block_ids uuid[] := '{}';
  v_incoming_block_id uuid;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (SELECT 1 FROM public.pages WHERE id = p_page_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: you do not own this page';
  END IF;

  -- ====== P2.8: NORMALIZE PRICING ITEM IDs BEFORE INSERTION ======
  v_normalized_blocks := p_blocks;
  
  FOR v_block_idx IN 0..jsonb_array_length(v_normalized_blocks) - 1
  LOOP
    v_block := v_normalized_blocks->v_block_idx;
    
    -- Ensure block itself has a stable UUID if generated by frontend
    -- (Frontend might send string IDs, we should keep them if they are valid UUIDs)
    v_incoming_block_id := (v_block->>'id')::uuid;
    IF v_incoming_block_id IS NOT NULL THEN
       v_current_block_ids := array_append(v_current_block_ids, v_incoming_block_id);
    END IF;

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
      
      v_block := jsonb_set(v_block, '{content,items}', v_normalized_items);
      v_normalized_blocks := jsonb_set(v_normalized_blocks, ARRAY[v_block_idx::text], v_block);
    END IF;
  END LOOP;

  -- ====== P2.9: UPSERT BLOCKS INSTEAD OF DELETE ALL ======
  -- 1. Mark blocks NOT in the incoming list as DELETED (Soft Delete)
  -- This preserves analytics linked to these blocks
  UPDATE public.blocks 
  SET deleted_at = now() 
  WHERE page_id = p_page_id 
    AND (id <> ALL(v_current_block_ids) OR v_current_block_ids IS NULL)
    AND deleted_at IS NULL;

  -- 2. Upsert incoming blocks
  FOR v_block IN SELECT * FROM jsonb_array_elements(v_normalized_blocks)
  LOOP
    INSERT INTO public.blocks (id, page_id, type, position, title, content, style, is_premium, schedule, click_count, deleted_at)
    VALUES (
      COALESCE((v_block->>'id')::uuid, gen_random_uuid()),
      p_page_id,
      (v_block->>'type')::text,
      (v_block->>'position')::integer,
      v_block->>'title',
      v_block->'content',
      COALESCE(v_block->'style', '{}'::jsonb),
      p_is_premium,
      v_block->'schedule',
      COALESCE((v_block->>'click_count')::integer, 0),
      NULL -- Ensure it's not marked as deleted if it's being upserted
    )
    ON CONFLICT (id) DO UPDATE SET
      position = EXCLUDED.position,
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      style = EXCLUDED.style,
      is_premium = EXCLUDED.is_premium,
      schedule = EXCLUDED.schedule,
      deleted_at = NULL; -- Un-delete if it was previously soft-deleted
  END LOOP;

  -- (Remaining quality scoring logic stays the same - copy-pasted from original for completeness)
  SELECT * INTO v_page FROM public.pages WHERE id = p_page_id;
  v_old_slugs := COALESCE(v_page.service_slugs, '{}'::jsonb);
  v_seen_item_ids := '{}';
  v_used_slugs := '{}';

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

  FOR v_block IN SELECT * FROM jsonb_array_elements(v_normalized_blocks)
  LOOP
    IF v_block->>'type' = 'pricing' THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_block->'content'->'items', '[]'::jsonb))
      LOOP
        v_item_id := COALESCE(v_item->>'id', '');
        IF length(v_item_id) < 2 THEN CONTINUE; END IF;
        v_svc_title := COALESCE(v_item->>'title', v_item->>'name', '');
        IF length(v_svc_title) < 2 THEN CONTINUE; END IF;
        v_svc_desc := COALESCE(v_item->>'description', '');
        v_old_entry := v_old_slugs->v_item_id;
        
        IF v_old_entry IS NOT NULL AND jsonb_typeof(v_old_entry) = 'object' THEN
          v_svc_slug := v_old_entry->>'slug';
        ELSE
          v_slug_base := lower(regexp_replace(regexp_replace(v_svc_title, '[^a-zA-Zа-яА-ЯёЁ0-9\s-]', '', 'g'), '\s+', '-', 'g'));
          v_slug_base := translate(v_slug_base, 'абвгдежзийклмнопрстуфхцчшщъыьэюя', 'abvgdezhzijklmnoprstufhcchshshh_y_eyu_ya');
          v_slug_base := regexp_replace(v_slug_base, '[^a-z0-9-]', '', 'g');
          v_slug_base := regexp_replace(v_slug_base, '-+', '-', 'g');
          v_slug_base := trim(both '-' from v_slug_base);
          IF length(v_slug_base) < 2 THEN v_slug_base := 'service'; END IF;
          v_slug_base := left(v_slug_base, 60);
          v_slug_candidate := v_slug_base;
          v_slug_counter := 2;
          WHILE v_slug_candidate = ANY(v_used_slugs) LOOP
            v_slug_candidate := v_slug_base || '-' || v_slug_counter;
            v_slug_counter := v_slug_counter + 1;
          END LOOP;
          v_svc_slug := v_slug_candidate;
        END IF;

        v_svc_state := CASE WHEN length(v_svc_desc) < 20 THEN 'thin' ELSE 'active' END;

        v_new_slugs := v_new_slugs || jsonb_build_object(
          v_item_id,
          jsonb_build_object('slug', v_svc_slug, 'state', v_svc_state, 'title', v_svc_title)
        );
        v_seen_item_ids := array_append(v_seen_item_ids, v_item_id);
        v_used_slugs := array_append(v_used_slugs, v_svc_slug);
      END LOOP;
    END IF;
  END LOOP;

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
            jsonb_build_object('slug', v_old_val->>'slug', 'state', 'removed', 'title', COALESCE(v_old_val->>'title', v_old_key))
          );
        END IF;
      END IF;
    END LOOP;
  END;

  -- Scoring logic (abreviated for migration readability but kept fully intact)
  IF v_page.title IS NOT NULL AND length(v_page.title) > 0 THEN v_score := v_score + 15; v_check_name := true; ELSE v_exclusions := array_append(v_exclusions, 'missing_name'); END IF;
  IF v_page.avatar_url IS NOT NULL AND length(v_page.avatar_url) > 0 THEN v_score := v_score + 10; v_check_avatar := true; ELSE v_exclusions := array_append(v_exclusions, 'missing_avatar'); END IF;
  IF v_page.niche IS NOT NULL AND v_page.niche != 'other' AND length(v_page.niche) > 0 THEN v_score := v_score + 10; v_check_niche := true; ELSE v_exclusions := array_append(v_exclusions, 'missing_niche'); END IF;
  IF v_page.city IS NOT NULL AND length(v_page.city) > 0 THEN v_score := v_score + 10; v_check_city := true; ELSE v_exclusions := array_append(v_exclusions, 'missing_city'); END IF;

  FOR v_block IN SELECT * FROM jsonb_array_elements(v_normalized_blocks) LOOP
    CASE v_block->>'type'
      WHEN 'profile' THEN v_bio_length := length(COALESCE(v_block->'content'->>'bio', '')); IF v_bio_length > 0 THEN v_has_bio := true; END IF;
      WHEN 'pricing' THEN v_has_pricing := true; v_service_count := v_service_count + COALESCE(jsonb_array_length(v_block->'content'->'items'), 0);
      WHEN 'socials' THEN v_has_socials := true;
      WHEN 'booking' THEN v_has_booking := true;
      ELSE NULL;
    END CASE;
  END LOOP;

  IF v_has_bio AND v_bio_length >= 100 THEN v_score := v_score + 15; ELSIF v_has_bio AND v_bio_length >= 30 THEN v_score := v_score + 10; ELSIF v_has_bio THEN v_score := v_score + 5; ELSE v_exclusions := array_append(v_exclusions, 'missing_bio'); END IF;
  IF v_has_pricing AND v_service_count >= 2 THEN v_score := v_score + 15; ELSIF v_has_pricing THEN v_score := v_score + 10; ELSE v_exclusions := array_append(v_exclusions, 'missing_services'); END IF;
  IF v_has_socials THEN v_score := v_score + 5; END IF;
  IF v_has_booking THEN v_score := v_score + 10; END IF;
  IF jsonb_array_length(v_normalized_blocks) >= 4 THEN v_score := v_score + 10; ELSIF jsonb_array_length(v_normalized_blocks) >= 2 THEN v_score := v_score + 5; ELSE v_exclusions := array_append(v_exclusions, 'too_few_blocks'); END IF;

  v_breakdown := jsonb_build_object(
    'name', jsonb_build_object('passed', v_check_name, 'points', CASE WHEN v_check_name THEN 15 ELSE 0 END),
    'avatar', jsonb_build_object('passed', v_check_avatar, 'points', CASE WHEN v_check_avatar THEN 10 ELSE 0 END),
    'niche', jsonb_build_object('passed', v_check_niche, 'points', CASE WHEN v_check_niche THEN 10 ELSE 0 END),
    'city', jsonb_build_object('passed', v_check_city, 'points', CASE WHEN v_check_city THEN 10 ELSE 0 END),
    'bio', jsonb_build_object('passed', v_has_bio, 'points', CASE WHEN v_has_bio AND v_bio_length >= 100 THEN 15 WHEN v_has_bio AND v_bio_length >= 30 THEN 10 WHEN v_has_bio THEN 5 ELSE 0 END),
    'services', jsonb_build_object('passed', v_has_pricing, 'points', CASE WHEN v_has_pricing AND v_service_count >= 2 THEN 15 WHEN v_has_pricing THEN 10 ELSE 0 END, 'count', v_service_count),
    'socials', jsonb_build_object('passed', v_has_socials, 'points', CASE WHEN v_has_socials THEN 5 ELSE 0 END),
    'booking', jsonb_build_object('passed', v_has_booking, 'points', CASE WHEN v_has_booking THEN 10 ELSE 0 END),
    'blocks', jsonb_build_object('passed', jsonb_array_length(v_normalized_blocks) >= 2, 'points', CASE WHEN jsonb_array_length(v_normalized_blocks) >= 4 THEN 10 WHEN jsonb_array_length(v_normalized_blocks) >= 2 THEN 5 ELSE 0 END)
  );

  IF v_score < 40 THEN v_exclusions := array_append(v_exclusions, 'low_quality_score'); END IF;

  UPDATE public.pages
  SET quality_score = v_score, quality_breakdown = v_breakdown, index_exclusion_reasons = v_exclusions, service_slugs = v_new_slugs, updated_at = now()
  WHERE id = p_page_id;
END;
$function$;
