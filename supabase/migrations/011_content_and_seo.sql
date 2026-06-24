BEGIN;

-- ==============================================
-- 011_content_and_seo.sql
-- Tables: page_snapshots, newsletter_subscriptions, private_page_data, sites
-- Columns: quality_score, is_indexable
-- Functions: create_page_snapshot(), get_page_version(), compute_page_quality_score(), get_site_pages_stats()
-- IndexNow ping triggers
-- ==============================================

-- 1. EXTENSIONS (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. SCHEMA CHANGES

-- private_page_data table
CREATE TABLE IF NOT EXISTS public.private_page_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL UNIQUE REFERENCES public.pages(id) ON DELETE CASCADE,
  chatbot_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.private_page_data ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Page owners can view own private data' AND tablename = 'private_page_data') THEN
    CREATE POLICY "Page owners can view own private data" ON public.private_page_data FOR SELECT USING (EXISTS (SELECT 1 FROM public.pages WHERE pages.id = private_page_data.page_id AND pages.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Page owners can insert own private data' AND tablename = 'private_page_data') THEN
    CREATE POLICY "Page owners can insert own private data" ON public.private_page_data FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.pages WHERE pages.id = private_page_data.page_id AND pages.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Page owners can update own private data' AND tablename = 'private_page_data') THEN
    CREATE POLICY "Page owners can update own private data" ON public.private_page_data FOR UPDATE USING (EXISTS (SELECT 1 FROM public.pages WHERE pages.id = private_page_data.page_id AND pages.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Page owners can delete own private data' AND tablename = 'private_page_data') THEN
    CREATE POLICY "Page owners can delete own private data" ON public.private_page_data FOR DELETE USING (EXISTS (SELECT 1 FROM public.pages WHERE pages.id = private_page_data.page_id AND pages.user_id = auth.uid()));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_private_page_data_updated_at ON public.private_page_data;
CREATE TRIGGER update_private_page_data_updated_at BEFORE UPDATE ON public.private_page_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Drop chatbot_context from pages (moved to private_page_data)
ALTER TABLE public.pages DROP COLUMN IF EXISTS chatbot_context;

-- Add quality_score, is_indexable, last_snapshot_at to pages
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS is_indexable BOOLEAN DEFAULT true;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS last_snapshot_at TIMESTAMP WITH TIME ZONE;

-- page_snapshots table
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

CREATE INDEX IF NOT EXISTS idx_page_snapshots_page_id ON public.page_snapshots(page_id);
CREATE INDEX IF NOT EXISTS idx_page_snapshots_version ON public.page_snapshots(page_id, version_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_snapshots_unique_version ON public.page_snapshots(page_id, version_id);

ALTER TABLE public.page_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view snapshots of published pages' AND tablename = 'page_snapshots') THEN
    DROP POLICY IF EXISTS "Anyone can view page snapshots" ON public.page_snapshots;
    CREATE POLICY "Anyone can view snapshots of published pages" ON public.page_snapshots FOR SELECT USING (
      EXISTS (SELECT 1 FROM pages WHERE pages.id = page_snapshots.page_id AND pages.is_published = true)
      OR EXISTS (SELECT 1 FROM pages WHERE pages.id = page_snapshots.page_id AND pages.user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Page owners can create snapshots' AND tablename = 'page_snapshots') THEN
    CREATE POLICY "Page owners can create snapshots" ON public.page_snapshots FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.pages WHERE pages.id = page_id AND pages.user_id = auth.uid())
    );
  END IF;
END $$;

-- sites table
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_site_path_unique ON public.pages(site_id, page_path) WHERE site_id IS NOT NULL AND page_path IS NOT NULL;

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users view own sites' AND tablename = 'sites') THEN
    CREATE POLICY "Users view own sites" ON public.sites FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own sites' AND tablename = 'sites') THEN
    CREATE POLICY "Users insert own sites" ON public.sites FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own sites' AND tablename = 'sites') THEN
    CREATE POLICY "Users update own sites" ON public.sites FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users delete own sites' AND tablename = 'sites') THEN
    CREATE POLICY "Users delete own sites" ON public.sites FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view sites for published pages' AND tablename = 'sites') THEN
    CREATE POLICY "Public can view sites for published pages" ON public.sites FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.pages p WHERE p.site_id = sites.id AND p.is_published = true)
    );
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_sites_updated_at ON public.sites;
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- newsletter_subscriptions policy (harden)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;
  CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.pages WHERE public.pages.id = newsletter_subscriptions.page_id AND public.pages.is_published = true)
    OR EXISTS (SELECT 1 FROM public.user_profiles WHERE public.user_profiles.id = newsletter_subscriptions.owner_id)
  );
END $$;

-- analytics hardening
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
  CREATE POLICY "Anyone can insert analytics" ON public.analytics FOR INSERT TO public WITH CHECK (true);
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Page owners can view analytics" ON public.analytics;
  CREATE POLICY "Page owners can view analytics" ON public.analytics FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pages WHERE pages.id = analytics.page_id AND pages.user_id = auth.uid())
  );
END $$;

-- user_tokens policy
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own token balance" ON public.user_tokens;
  CREATE POLICY "Users can view own token balance" ON public.user_tokens FOR SELECT USING (auth.uid() = user_id);
END $$;

-- analytics table grants
GRANT UPDATE (view_count) ON TABLE public.pages TO anon, authenticated;

-- indexing_submissions columns
ALTER TABLE public.indexing_submissions
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_attempted_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS payload jsonb;

CREATE INDEX IF NOT EXISTS idx_indexing_submissions_retry ON public.indexing_submissions (next_retry_at) WHERE submission_status = 'provider_failed' AND retry_count < 5;

-- Schedule retry worker
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retry-failed-indexing-every-15min') THEN
    PERFORM cron.schedule(
      'retry-failed-indexing-every-15min',
      '*/15 * * * *',
      $job$
      SELECT net.http_post(
        url := 'https://pphdcfxucfndmwulpfwv.supabase.co/functions/v1/retry-failed-indexing',
        headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwaGRjZnh1Y2ZuZG13dWxwZnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTgwMDcsImV4cCI6MjA3OTc5NDAwN30.u5O_XrdvtjHaZjsAkVZyoYbNQIBKx9xfVxRFuUi2WbA"}'::jsonb,
        body := '{"source":"cron"}'::jsonb
      );
      $job$
    );
  END IF;
END $$;

-- 3. FUNCTIONS

-- RPC functions
CREATE OR REPLACE FUNCTION public.increment_view_count(page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE pages SET view_count = view_count + 1 WHERE id = page_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_block_clicks(block_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_view_count(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_block_clicks(text) TO anon, authenticated, service_role;

-- create_page_snapshot trigger function
CREATE OR REPLACE FUNCTION public.create_page_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_version_id VARCHAR(12);
  v_content_hash VARCHAR(16);
  v_blocks JSONB;
BEGIN
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL OR OLD.updated_at IS DISTINCT FROM NEW.updated_at) THEN
    SELECT jsonb_agg(
      jsonb_build_object('id', id, 'type', type, 'position', position, 'content', content, 'style', style) ORDER BY position
    ) INTO v_blocks
    FROM public.blocks WHERE page_id = NEW.id;

    v_version_id := to_char(now(), 'YYYYMMDDHH24MI');
    v_content_hash := substr(md5(v_blocks::text), 1, 8);

    INSERT INTO public.page_snapshots (page_id, version_id, content_hash, blocks_json, theme_json, seo_json)
    VALUES (NEW.id, v_version_id, v_content_hash, COALESCE(v_blocks, '[]'::jsonb), NEW.theme_settings, NEW.seo_meta)
    ON CONFLICT (page_id, version_id) DO UPDATE
    SET content_hash = EXCLUDED.content_hash, blocks_json = EXCLUDED.blocks_json,
        theme_json = EXCLUDED.theme_json, seo_json = EXCLUDED.seo_json, published_at = now();

    NEW.last_snapshot_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_page_snapshot ON public.pages;
CREATE TRIGGER trigger_page_snapshot BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.create_page_snapshot();

-- get_page_version
CREATE OR REPLACE FUNCTION public.get_page_version(p_slug TEXT, p_version_id VARCHAR DEFAULT NULL)
RETURNS TABLE (page_id UUID, slug TEXT, version_id VARCHAR, blocks_json JSONB, theme_json JSONB, seo_json JSONB, published_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_version_id IS NOT NULL THEN
    RETURN QUERY SELECT ps.page_id, p.slug, ps.version_id, ps.blocks_json, ps.theme_json, ps.seo_json, ps.published_at
    FROM public.page_snapshots ps JOIN public.pages p ON p.id = ps.page_id
    WHERE p.slug = p_slug AND ps.version_id = p_version_id AND p.is_published = true;
  ELSE
    RETURN QUERY SELECT ps.page_id, p.slug, ps.version_id, ps.blocks_json, ps.theme_json, ps.seo_json, ps.published_at
    FROM public.page_snapshots ps JOIN public.pages p ON p.id = ps.page_id
    WHERE p.slug = p_slug AND p.is_published = true ORDER BY ps.published_at DESC LIMIT 1;
  END IF;
END;
$$;

-- compute_page_quality_score
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

  score := 10;
  IF p.title IS NOT NULL AND length(trim(p.title)) >= 2 THEN score := score + 15; END IF;
  IF p.description IS NOT NULL AND length(trim(p.description)) >= 20 THEN score := score + 15; END IF;
  IF p.avatar_url IS NOT NULL THEN score := score + 10; END IF;
  IF p.profession IS NOT NULL OR p.city IS NOT NULL THEN score := score + 5; END IF;
  IF COALESCE(p.contact_email,'') <> '' OR COALESCE(p.contact_phone,'') <> '' OR COALESCE(p.contact_whatsapp,'') <> '' THEN score := score + 10; END IF;
  IF p.seo_meta ? 'title' AND length(coalesce(p.seo_meta->>'title','')) >= 5 THEN score := score + 5; END IF;
  IF p.seo_meta ? 'description' AND length(coalesce(p.seo_meta->>'description','')) >= 20 THEN score := score + 5; END IF;

  score := score + LEAST(25, block_count * 5);
  RETURN LEAST(100, score);
END;
$$;

-- tg_pages_update_quality
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

-- tg_blocks_update_page_quality
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
    UPDATE public.pages SET quality_score = public.compute_page_quality_score(pid) WHERE id = pid;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS pages_quality_score_trg ON public.pages;
CREATE TRIGGER pages_quality_score_trg
BEFORE INSERT OR UPDATE OF title, description, avatar_url, contact_email, contact_phone, contact_whatsapp, profession, city, seo_meta, is_published
ON public.pages FOR EACH ROW EXECUTE FUNCTION public.tg_pages_update_quality();

DROP TRIGGER IF EXISTS blocks_quality_score_trg ON public.blocks;
CREATE TRIGGER blocks_quality_score_trg
AFTER INSERT OR UPDATE OR DELETE ON public.blocks FOR EACH ROW EXECUTE FUNCTION public.tg_blocks_update_page_quality();

-- get_site_pages_stats
CREATE OR REPLACE FUNCTION public.get_site_pages_stats(_site_id uuid, _days int DEFAULT 30)
RETURNS TABLE (page_id uuid, views bigint, clicks bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id AS page_id, COUNT(*) FILTER (WHERE a.event_type = 'page_view') AS views, COUNT(*) FILTER (WHERE a.event_type = 'block_click') AS clicks
  FROM pages p
  LEFT JOIN analytics a ON a.page_id = p.id AND a.created_at >= now() - make_interval(days => _days)
  WHERE p.site_id = _site_id AND EXISTS (SELECT 1 FROM sites s WHERE s.id = _site_id AND s.user_id = auth.uid())
  GROUP BY p.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_site_pages_stats(uuid, int) TO authenticated;

-- ping_indexnow_on_page_change
CREATE OR REPLACE FUNCTION public.ping_indexnow_on_page_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_should_ping boolean := false;
BEGIN
  IF NEW.is_published IS NOT TRUE OR NEW.is_indexable IS NOT TRUE THEN RETURN NEW; END IF;
  IF NEW.slug IS NULL OR length(NEW.slug) = 0 THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN v_should_ping := true;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.is_published IS DISTINCT FROM NEW.is_published) OR (OLD.is_indexable IS DISTINCT FROM NEW.is_indexable) OR (OLD.slug IS DISTINCT FROM NEW.slug) OR (COALESCE(OLD.quality_score, 0) < 25 AND COALESCE(NEW.quality_score, 0) >= 25) OR (NEW.last_indexnow_at IS NULL) OR (NEW.last_indexnow_at < now() - interval '6 hours') THEN v_should_ping := true; END IF;
  END IF;
  IF NOT v_should_ping THEN RETURN NEW; END IF;
  v_url := 'https://lnkmx.my/' || NEW.slug;
  PERFORM net.http_post(url := 'https://pphdcfxucfndmwulpfwv.supabase.co/functions/v1/notify-indexnow', headers := jsonb_build_object('Content-Type', 'application/json'), body := jsonb_build_object('urls', jsonb_build_array(v_url), 'page_id', NEW.id, 'action_type', CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END), timeout_milliseconds := 5000);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'ping_indexnow_on_page_change failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pages_indexnow_ping_trg ON public.pages;
CREATE TRIGGER pages_indexnow_ping_trg
AFTER INSERT OR UPDATE OF is_published, is_indexable, slug, quality_score
ON public.pages FOR EACH ROW EXECUTE FUNCTION public.ping_indexnow_on_page_change();

REVOKE ALL ON FUNCTION public.ping_indexnow_on_page_change() FROM PUBLIC, anon, authenticated;

-- save_page_blocks (P2.9 version with soft delete + upsert)
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
  v_normalized_blocks jsonb;
  v_block_idx integer;
  v_item_idx integer;
  v_items_arr jsonb;
  v_normalized_items jsonb;
  v_current_block_ids uuid[] := '{}';
  v_incoming_block_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.pages WHERE id = p_page_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: you do not own this page';
  END IF;

  v_normalized_blocks := p_blocks;

  FOR v_block_idx IN 0..jsonb_array_length(v_normalized_blocks) - 1 LOOP
    v_block := v_normalized_blocks->v_block_idx;
    v_incoming_block_id := (v_block->>'id')::uuid;
    IF v_incoming_block_id IS NOT NULL THEN v_current_block_ids := array_append(v_current_block_ids, v_incoming_block_id); END IF;

    IF v_block->>'type' = 'pricing' THEN
      v_items_arr := COALESCE(v_block->'content'->'items', '[]'::jsonb);
      v_normalized_items := '[]'::jsonb;
      FOR v_item_idx IN 0..jsonb_array_length(v_items_arr) - 1 LOOP
        v_item := v_items_arr->v_item_idx;
        v_item_id := COALESCE(v_item->>'id', '');
        IF length(v_item_id) < 2 THEN v_item_id := 'auto-' || gen_random_uuid()::text; v_item := jsonb_set(v_item, '{id}', to_jsonb(v_item_id)); END IF;
        v_normalized_items := v_normalized_items || jsonb_build_array(v_item);
      END LOOP;
      v_block := jsonb_set(v_block, '{content,items}', v_normalized_items);
      v_normalized_blocks := jsonb_set(v_normalized_blocks, ARRAY[v_block_idx::text], v_block);
    END IF;
  END LOOP;

  UPDATE public.blocks SET deleted_at = now() WHERE page_id = p_page_id AND (id <> ALL(v_current_block_ids) OR v_current_block_ids IS NULL) AND deleted_at IS NULL;

  FOR v_block IN SELECT * FROM jsonb_array_elements(v_normalized_blocks) LOOP
    INSERT INTO public.blocks (id, page_id, type, position, title, content, style, is_premium, schedule, click_count, deleted_at)
    VALUES (COALESCE((v_block->>'id')::uuid, gen_random_uuid()), p_page_id, (v_block->>'type')::text, (v_block->>'position')::integer, v_block->>'title', v_block->'content', COALESCE(v_block->'style', '{}'::jsonb), p_is_premium, v_block->'schedule', COALESCE((v_block->>'click_count')::integer, 0), NULL)
    ON CONFLICT (id) DO UPDATE SET position = EXCLUDED.position, title = EXCLUDED.title, content = EXCLUDED.content, style = EXCLUDED.style, is_premium = EXCLUDED.is_premium, schedule = EXCLUDED.schedule, deleted_at = NULL;
  END LOOP;

  SELECT * INTO v_page FROM public.pages WHERE id = p_page_id;
  v_old_slugs := COALESCE(v_page.service_slugs, '{}'::jsonb);
  v_seen_item_ids := '{}';
  v_used_slugs := '{}';

  DECLARE v_old_key text; v_old_val jsonb;
  BEGIN
    FOR v_old_key, v_old_val IN SELECT * FROM jsonb_each(v_old_slugs) LOOP
      IF jsonb_typeof(v_old_val) = 'object' THEN v_used_slugs := array_append(v_used_slugs, v_old_val->>'slug'); END IF;
    END LOOP;
  END;

  FOR v_block IN SELECT * FROM jsonb_array_elements(v_normalized_blocks) LOOP
    IF v_block->>'type' = 'pricing' THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_block->'content'->'items', '[]'::jsonb)) LOOP
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
          v_slug_candidate := v_slug_base; v_slug_counter := 2;
          WHILE v_slug_candidate = ANY(v_used_slugs) LOOP
            v_slug_candidate := v_slug_base || '-' || v_slug_counter; v_slug_counter := v_slug_counter + 1;
          END LOOP;
          v_svc_slug := v_slug_candidate;
        END IF;
        v_svc_state := CASE WHEN length(v_svc_desc) < 20 THEN 'thin' ELSE 'active' END;
        v_new_slugs := v_new_slugs || jsonb_build_object(v_item_id, jsonb_build_object('slug', v_svc_slug, 'state', v_svc_state, 'title', v_svc_title));
        v_seen_item_ids := array_append(v_seen_item_ids, v_item_id);
        v_used_slugs := array_append(v_used_slugs, v_svc_slug);
      END LOOP;
    END IF;
  END LOOP;

  DECLARE v_old_key text; v_old_val jsonb;
  BEGIN
    FOR v_old_key, v_old_val IN SELECT * FROM jsonb_each(v_old_slugs) LOOP
      IF NOT (v_old_key = ANY(v_seen_item_ids)) THEN
        IF jsonb_typeof(v_old_val) = 'object' THEN
          v_new_slugs := v_new_slugs || jsonb_build_object(v_old_key, jsonb_build_object('slug', v_old_val->>'slug', 'state', 'removed', 'title', COALESCE(v_old_val->>'title', v_old_key)));
        END IF;
      END IF;
    END LOOP;
  END;

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

  UPDATE public.pages SET quality_score = v_score, quality_breakdown = v_breakdown, index_exclusion_reasons = v_exclusions, service_slugs = v_new_slugs, updated_at = now() WHERE id = p_page_id;
END;
$function$;

-- normalize_page_search_exclusions
CREATE OR REPLACE FUNCTION public.normalize_page_search_exclusions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.index_exclusion_reasons := COALESCE(NEW.index_exclusion_reasons, '{}'::text[]);
  IF COALESCE(NEW.quality_score, 0) >= 25 THEN
    NEW.index_exclusion_reasons := array_remove(NEW.index_exclusion_reasons, 'low_quality_score');
  ELSIF NOT ('low_quality_score' = ANY(NEW.index_exclusion_reasons)) THEN
    NEW.index_exclusion_reasons := array_append(NEW.index_exclusion_reasons, 'low_quality_score');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_page_search_exclusions ON public.pages;
CREATE TRIGGER trg_normalize_page_search_exclusions BEFORE INSERT OR UPDATE OF quality_score, index_exclusion_reasons ON public.pages FOR EACH ROW EXECUTE FUNCTION public.normalize_page_search_exclusions();

-- Backfill quality scores
UPDATE public.pages SET quality_score = public.compute_page_quality_score(id) WHERE is_published = true;

-- Backfill exclude_reasons
UPDATE public.pages SET index_exclusion_reasons = CASE WHEN COALESCE(quality_score, 0) >= 25 THEN array_remove(COALESCE(index_exclusion_reasons, '{}'::text[]), 'low_quality_score') WHEN NOT ('low_quality_score' = ANY(COALESCE(index_exclusion_reasons, '{}'::text[]))) THEN array_append(COALESCE(index_exclusion_reasons, '{}'::text[]), 'low_quality_score') ELSE COALESCE(index_exclusion_reasons, '{}'::text[]) END;

-- Backfill: create a site for every existing user with pages
INSERT INTO public.sites (user_id, name, primary_page_id)
SELECT p.user_id, COALESCE(p.title, 'My Site'), p.id
FROM public.pages p
WHERE NOT EXISTS (SELECT 1 FROM public.sites s WHERE s.user_id = p.user_id)
  AND p.id = (SELECT id FROM public.pages WHERE user_id = p.user_id ORDER BY created_at ASC LIMIT 1);

UPDATE public.pages p SET site_id = s.id, is_home = (s.primary_page_id = p.id)
FROM public.sites s WHERE s.user_id = p.user_id AND p.site_id IS NULL;

-- Migrate existing chatbot_context data
INSERT INTO public.private_page_data (page_id, chatbot_context)
SELECT id, chatbot_context FROM public.pages WHERE chatbot_context IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM public.private_page_data WHERE page_id = public.pages.id);

-- Password reset tokens & rate limits denials
DO $$
BEGIN
  DROP POLICY IF EXISTS "Deny all public access to password_reset_tokens" ON public.password_reset_tokens;
  CREATE POLICY "Deny all public access to password_reset_tokens" ON public.password_reset_tokens FOR ALL USING (false);
  DROP POLICY IF EXISTS "Deny all public access to rate_limits" ON public.rate_limits;
  CREATE POLICY "Deny all public access to rate_limits" ON public.rate_limits FOR ALL USING (false);
END $$;

COMMIT;
