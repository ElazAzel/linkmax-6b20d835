BEGIN;

-- ==============================================
-- 015_security_hardening_and_grants.sql
-- Column-level REVOKE/GRANT, Realtime policies, GDPR functions,
-- Storage policies, Upsert RPCs, all RLS policies, security functions
-- ==============================================

-- ==============================================
-- 1. SECURITY FUNCTIONS
-- ==============================================

CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = p_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.has_role(p_user_id, 'admin');
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = p_role::text);
END;
$$;

-- check_realtime_topic_access
CREATE OR REPLACE FUNCTION public.check_realtime_topic_access(topic text)
RETURNS boolean AS $$
DECLARE
    extracted_zone_id uuid;
BEGIN
    IF topic LIKE 'zone-messages-%' THEN
        BEGIN
            extracted_zone_id := substr(topic, 15)::uuid;
            RETURN public.is_zone_member(extracted_zone_id, auth.uid());
        EXCEPTION WHEN OTHERS THEN
            RETURN false;
        END;
    END IF;
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_allowed_analytics_event_type
CREATE OR REPLACE FUNCTION public.is_allowed_analytics_event_type(p_event_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    p_event_type IS NOT NULL
    AND char_length(p_event_type) BETWEEN 1 AND 80
    AND p_event_type ~ '^[a-z][a-z0-9_:-]*$'
    AND (
      p_event_type = ANY (ARRAY['view','click','share','heatmap_clicks','heatmap_scroll','session_end','landing_view','landing_scroll','landing_section_view','landing_exit','cta_create_click','cta_gallery_click','cta_login_click','cta_pricing_click','pricing_toggle','signup_start','hero_primary_cta_click','hero_secondary_cta_click','how_it_works_view','pricing_view','faq_expand','alternatives_view','alternatives_cta_click','signup_from_landing','signup_from_alternatives','impression','conversion','broadcast','payment_success','booking_created','booking_created_staff']::text[])
      OR p_event_type LIKE 'activation:%'
      OR p_event_type LIKE 'auth:%'
      OR p_event_type LIKE 'editor:%'
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_allowed_analytics_event_type(text) TO anon, authenticated, service_role;

-- analytics event_type check constraint (NOT VALID for existing data)
ALTER TABLE public.analytics DROP CONSTRAINT IF EXISTS analytics_event_type_check;
ALTER TABLE public.analytics ADD CONSTRAINT analytics_event_type_check CHECK (public.is_allowed_analytics_event_type(event_type)) NOT VALID;

-- ==============================================
-- 2. API KEYS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hint VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users view own api keys" ON public.api_keys;
  CREATE POLICY "Users view own api keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
END $$;

-- ==============================================
-- 3. SECRETS TABLES (team_secrets, zone_secrets)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.team_secrets (
  team_id uuid PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  invite_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.team_secrets (team_id, invite_code)
SELECT id, invite_code FROM public.teams WHERE invite_code IS NOT NULL
ON CONFLICT (team_id) DO NOTHING;

REVOKE ALL ON public.team_secrets FROM anon, authenticated;
GRANT ALL ON public.team_secrets TO service_role;
ALTER TABLE public.team_secrets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.zone_secrets (
  zone_id uuid PRIMARY KEY REFERENCES public.zones(id) ON DELETE CASCADE,
  calendar_feed_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.zone_secrets (zone_id, calendar_feed_token)
SELECT id, calendar_feed_token FROM public.zones WHERE calendar_feed_token IS NOT NULL
ON CONFLICT (zone_id) DO NOTHING;

REVOKE ALL ON public.zone_secrets FROM anon, authenticated;
GRANT ALL ON public.zone_secrets TO service_role;
ALTER TABLE public.zone_secrets ENABLE ROW LEVEL SECURITY;

-- Drop sensitive columns
ALTER TABLE public.teams DROP COLUMN IF EXISTS invite_code;
ALTER TABLE public.zones DROP COLUMN IF EXISTS calendar_feed_token;

-- ==============================================
-- 4. REALTIME MESSAGES POLICIES
-- ==============================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop all existing realtime.messages policies
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'realtime' AND tablename = 'messages' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON realtime.messages', pol.policyname);
  END LOOP;
END $$;

-- Strict SELECT: only zone members can subscribe to their zone's topic
CREATE POLICY "zone_members_select_zone_topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'zone:%'
  AND public.is_zone_member(
    (substring(realtime.topic() FROM 'zone:([0-9a-f-]{36})'))::uuid,
    auth.uid()
  )
);

-- Strict INSERT (broadcast): only zone members can publish to their zone's topic
CREATE POLICY "zone_members_insert_zone_topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'zone:%'
  AND public.is_zone_member(
    (substring(realtime.topic() FROM 'zone:([0-9a-f-]{36})'))::uuid,
    auth.uid()
  )
);

-- ==============================================
-- 5. STORAGE POLICIES
-- ==============================================

-- user-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-media', 'user-media', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;
  CREATE POLICY "Users can upload their own media" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'user-media' AND (storage.foldername(name))[1] = auth.uid()::text);

  DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
  CREATE POLICY "Users can update their own media" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'user-media' AND (storage.foldername(name))[1] = auth.uid()::text);

  DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
  CREATE POLICY "Users can delete their own media" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'user-media' AND (storage.foldername(name))[1] = auth.uid()::text);

  DROP POLICY IF EXISTS "Public read access for media" ON storage.objects;
  CREATE POLICY "Public read access for media" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'user-media');
END $$;

-- verification-documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload own verification documents" ON storage.objects;
  CREATE POLICY "Users can upload own verification documents" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

  DROP POLICY IF EXISTS "Users can view own verification documents" ON storage.objects;
  CREATE POLICY "Users can view own verification documents" ON storage.objects FOR SELECT
    USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

  DROP POLICY IF EXISTS "Admins can view all verification documents" ON storage.objects;
  CREATE POLICY "Admins can view all verification documents" ON storage.objects FOR SELECT
    USING (bucket_id = 'verification-documents' AND has_role(auth.uid(), 'admin'::app_role));

  DROP POLICY IF EXISTS "Users can update own verification documents" ON storage.objects;
  CREATE POLICY "Users can update own verification documents" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'verification-documents' AND (auth.uid())::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'verification-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

  DROP POLICY IF EXISTS "Users can delete own verification documents" ON storage.objects;
  CREATE POLICY "Users can delete own verification documents" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'verification-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);
END $$;

-- ==============================================
-- 6. COLUMN-LEVEL GRANTS & REVOKES
-- ==============================================

-- --- pages ---
REVOKE SELECT ON public.pages FROM anon, authenticated;

-- Safe columns for anon
GRANT SELECT (
  id, slug, title, description, avatar_url, avatar_style, theme_settings, seo_meta,
  is_published, view_count, created_at, updated_at, editor_mode, grid_config,
  is_in_gallery, gallery_featured_at, gallery_likes, niche, preview_url,
  quality_score, is_indexable, last_snapshot_at, is_paid, is_primary_paid,
  page_type, integrations, favicon_url, hide_branding, organization_id,
  custom_domain, city, country_code, profession, entity_type,
  service_slugs, last_indexnow_at,
  site_id, page_path, is_home
) ON public.pages TO anon;

-- Safe columns for authenticated (includes user_id)
GRANT SELECT (
  id, user_id, slug, title, description, avatar_url, avatar_style,
  theme_settings, seo_meta, is_published, view_count, created_at, updated_at,
  editor_mode, grid_config, is_in_gallery, gallery_featured_at, gallery_likes,
  niche, preview_url, quality_score, is_indexable, last_snapshot_at,
  is_paid, is_primary_paid, page_type, integrations, favicon_url,
  hide_branding, organization_id, custom_domain, city, country_code,
  profession, entity_type, service_slugs,
  site_id, page_path, is_home, last_indexnow_at
) ON public.pages TO authenticated;

-- Owners need INSERT/UPDATE/DELETE
GRANT INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;

-- Explicit REVOKE of sensitive columns from anon + authenticated
REVOKE SELECT (contact_email, contact_phone, contact_whatsapp, webhook_url, webhook_secret, quality_breakdown, index_exclusion_reasons) ON public.pages FROM anon, authenticated;

-- --- sites ---
REVOKE SELECT ON public.sites FROM anon;
GRANT SELECT (id, name, primary_page_id, settings, header_blocks, footer_blocks, created_at, updated_at) ON public.sites TO anon;
REVOKE SELECT (user_id) ON public.sites FROM anon;

-- --- teams ---
REVOKE SELECT ON public.teams FROM anon, authenticated;
GRANT SELECT (id, name, description, avatar_url, slug, owner_id, niche, is_public, created_at, updated_at) ON public.teams TO anon, authenticated;

-- --- zones ---
GRANT SELECT ON public.zones TO anon, authenticated;
GRANT SELECT (id, name, slug, logo_url, owner_user_id, plan_code, plan_cycle, plan_status, current_period_start, current_period_end, grace_period_end, created_at, updated_at) ON public.zones TO anon, authenticated;

-- --- user_profiles ---
REVOKE SELECT (push_subscription, telegram_chat_id) ON public.user_profiles FROM anon, authenticated;
REVOKE UPDATE (push_subscription, telegram_chat_id) ON public.user_profiles FROM anon, authenticated;

-- --- token_withdrawals ---
REVOKE SELECT ON public.token_withdrawals FROM authenticated;
GRANT SELECT (id, user_id, amount, status, payment_method, admin_notes, processed_by, processed_at, created_at, updated_at) ON public.token_withdrawals TO authenticated;
GRANT INSERT, UPDATE ON public.token_withdrawals TO authenticated;
REVOKE SELECT (payment_details) ON public.token_withdrawals FROM anon, authenticated;

-- --- zone_automations ---
REVOKE SELECT ON public.zone_automations FROM authenticated;
GRANT SELECT (id, zone_id, trigger_type, action_type, is_active, created_at, updated_at) ON public.zone_automations TO authenticated;

-- --- telegram_bot_settings ---
REVOKE ALL ON public.telegram_bot_settings FROM anon, authenticated;
GRANT ALL ON public.telegram_bot_settings TO service_role;

-- Remove zone_automations from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.zone_automations;

-- ==============================================
-- 7. ALL RLS POLICIES (final versions)
-- ==============================================

-- --- blocks ---
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can view blocks of published pages" ON public.blocks;
  CREATE POLICY "Anyone can view blocks of published pages" ON public.blocks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pages WHERE pages.id = blocks.page_id AND (pages.is_published = true OR pages.user_id = auth.uid()))
  );
  DROP POLICY IF EXISTS "Users can manage blocks on own pages" ON public.blocks;
  CREATE POLICY "Users can manage blocks on own pages" ON public.blocks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.pages WHERE pages.id = blocks.page_id AND pages.user_id = auth.uid())
  );
END $$;

-- --- analytics (guarded insert) ---
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public insert guarded analytics" ON public.analytics;
  CREATE POLICY "Public insert guarded analytics" ON public.analytics FOR INSERT TO anon, authenticated
  WITH CHECK (
    public.is_allowed_analytics_event_type(event_type)
    AND (
      (page_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.pages WHERE pages.id = analytics.page_id AND (pages.is_published = true OR pages.user_id = auth.uid())))
      OR (page_id IS NULL AND ((block_id IS NULL AND (event_type LIKE 'auth:%' OR event_type = ANY (ARRAY['landing_view','landing_scroll','landing_section_view','landing_exit','cta_create_click','cta_gallery_click','cta_login_click','cta_pricing_click','pricing_toggle','signup_start','hero_primary_cta_click','hero_secondary_cta_click','how_it_works_view','pricing_view','faq_expand','alternatives_view','alternatives_cta_click','signup_from_landing','signup_from_alternatives']::text[]))) OR (auth.uid() IS NOT NULL AND event_type LIKE 'editor:%')))
    )
  );
END $$;

-- --- bookings ---
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
  CREATE POLICY "Authenticated users can create bookings" ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM pages WHERE pages.id = page_id AND pages.is_published = true));

  DROP POLICY IF EXISTS "Owners can manage their bookings" ON public.bookings;
  CREATE POLICY "Owners can manage their bookings" ON public.bookings FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = owner_id OR public.is_admin(auth.uid()));

  DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.bookings;
  CREATE POLICY "Customers can view their own bookings" ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
END $$;

-- double-booking protection
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bookings_uniqueness_guard') THEN
    CREATE UNIQUE INDEX idx_bookings_uniqueness_guard ON public.bookings (owner_id, slot_date, slot_time) WHERE status NOT IN ('cancelled', 'rejected');
  END IF;
END $$;

-- Additional booking columns
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Almaty';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_timezone TEXT DEFAULT 'UTC';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- --- verification_requests ---
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own verification requests' AND tablename = 'verification_requests') THEN
    CREATE POLICY "Users can view own verification requests" ON public.verification_requests FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create own verification request" ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Admins can view all verification requests" ON public.verification_requests FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
    CREATE POLICY "Admins can update verification requests" ON public.verification_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- --- user_profiles policies ---
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public profiles view" ON public.user_profiles;
  DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.user_profiles;
  DROP POLICY IF EXISTS "Users can view own full profile" ON public.user_profiles;
  CREATE POLICY "Users can view own full profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
  CREATE POLICY "Admins can view all profiles" ON public.user_profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- --- media_assets ---
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own media assets" ON public.media_assets;
  CREATE POLICY "Users can view own media assets" ON public.media_assets FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can manage own media assets" ON public.media_assets;
  CREATE POLICY "Users can manage own media assets" ON public.media_assets FOR ALL USING (auth.uid() = user_id);
END $$;

-- --- media_references ---
ALTER TABLE public.media_references ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own media references" ON public.media_references;
  CREATE POLICY "Users can view own media references" ON public.media_references FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can manage own media references" ON public.media_references;
  CREATE POLICY "Users can manage own media references" ON public.media_references FOR ALL USING (auth.uid() = user_id);
END $$;

-- --- notification_queue ---
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on notification_queue' AND tablename = 'notification_queue') THEN
    CREATE POLICY "Service role full access on notification_queue" ON public.notification_queue FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================
-- 8. GDPR FUNCTIONS
-- ==============================================

-- export_user_data
CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF auth.uid() != p_user_id THEN RAISE EXCEPTION 'Unauthorized: UserId mismatch'; END IF;

  SELECT jsonb_build_object(
    'exported_at', now(), 'user_id', p_user_id,
    'profile', (SELECT row_to_json(p) FROM user_profiles p WHERE p.id = p_user_id),
    'pages', (SELECT COALESCE(jsonb_agg(row_to_json(pg)), '[]'::jsonb) FROM pages pg WHERE pg.user_id = p_user_id),
    'blocks', (SELECT COALESCE(jsonb_agg(row_to_json(b)), '[]'::jsonb) FROM blocks b JOIN pages pg ON pg.id = b.page_id WHERE pg.user_id = p_user_id),
    'leads', (SELECT COALESCE(jsonb_agg(row_to_json(l)), '[]'::jsonb) FROM leads l WHERE l.user_id = p_user_id),
    'lead_interactions', (SELECT COALESCE(jsonb_agg(row_to_json(li)), '[]'::jsonb) FROM lead_interactions li WHERE li.user_id = p_user_id),
    'bookings', (SELECT COALESCE(jsonb_agg(row_to_json(bk)), '[]'::jsonb) FROM bookings bk WHERE bk.owner_id = p_user_id),
    'tokens', (SELECT row_to_json(t) FROM user_tokens t WHERE t.user_id = p_user_id),
    'token_transactions', (SELECT COALESCE(jsonb_agg(row_to_json(tt)), '[]'::jsonb) FROM token_transactions tt WHERE tt.user_id = p_user_id),
    'referral_codes', (SELECT COALESCE(jsonb_agg(row_to_json(rc)), '[]'::jsonb) FROM referral_codes rc WHERE rc.user_id = p_user_id),
    'referrals', (SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM referrals r WHERE r.referrer_id = p_user_id OR r.referred_id = p_user_id),
    'withdrawals', (SELECT COALESCE(jsonb_agg(row_to_json(w)), '[]'::jsonb) FROM token_withdrawals w WHERE w.user_id = p_user_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- delete_user_account
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pages_deleted INTEGER;
  v_leads_deleted INTEGER;
BEGIN
  IF auth.uid() != p_user_id THEN RAISE EXCEPTION 'Unauthorized: UserId mismatch'; END IF;

  SELECT COUNT(*) INTO v_pages_deleted FROM pages WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_leads_deleted FROM leads WHERE user_id = p_user_id;

  DELETE FROM page_events WHERE page_id IN (SELECT id FROM pages WHERE user_id = p_user_id);
  DELETE FROM blocks WHERE page_id IN (SELECT id FROM pages WHERE user_id = p_user_id);
  DELETE FROM booking_slots WHERE block_id IN (SELECT b.id FROM blocks b JOIN pages p ON b.page_id = p.id WHERE p.user_id = p_user_id);
  DELETE FROM bookings WHERE owner_id = p_user_id;
  DELETE FROM lead_interactions WHERE user_id = p_user_id;
  DELETE FROM leads WHERE user_id = p_user_id;
  DELETE FROM pages WHERE user_id = p_user_id;
  DELETE FROM token_transactions WHERE user_id = p_user_id;
  DELETE FROM daily_token_limits WHERE user_id = p_user_id;
  DELETE FROM token_withdrawals WHERE user_id = p_user_id;
  DELETE FROM user_tokens WHERE user_id = p_user_id;
  DELETE FROM referrals WHERE referrer_id = p_user_id OR referred_id = p_user_id;
  DELETE FROM referral_codes WHERE user_id = p_user_id;
  BEGIN DELETE FROM collaborations WHERE user_id = p_user_id OR collaborator_id = p_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM friendships WHERE user_id = p_user_id OR friend_id = p_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM rate_limits WHERE ip_address IN (SELECT DISTINCT ip_address FROM rate_limits WHERE endpoint LIKE '%' || p_user_id::text || '%'); EXCEPTION WHEN undefined_table THEN NULL; END;
  DELETE FROM user_roles WHERE user_id = p_user_id;
  DELETE FROM user_profiles WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'pages_deleted', v_pages_deleted, 'leads_deleted', v_leads_deleted, 'message', 'All user data deleted. Auth account must be removed separately.');
END;
$$;

-- ==============================================
-- 9. LATEST VERSION OF UPSERT/SAVE/GET RPCs
-- ==============================================

-- upsert_user_page (latest: with webhooks, org support from 20260619050903)
DROP FUNCTION IF EXISTS public.upsert_user_page(uuid, text, text, text, text, jsonb, jsonb, jsonb, text, jsonb, jsonb, text, boolean, uuid);
DROP FUNCTION IF EXISTS public.upsert_user_page(uuid, text, text, text, text, jsonb, jsonb, jsonb, text, jsonb, jsonb, text, boolean, uuid, text, text);
DROP FUNCTION IF EXISTS public.upsert_user_page(uuid, text, text, text, text, jsonb, jsonb, jsonb, text, jsonb, jsonb, text, boolean);
DROP FUNCTION IF EXISTS public.upsert_user_page(uuid, text, text, text, text, jsonb, jsonb, jsonb, text, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.upsert_user_page(uuid, text, text, text, text, jsonb, jsonb, jsonb, text, jsonb);
DROP FUNCTION IF EXISTS public.upsert_user_page(uuid, text, text, text, text, jsonb, jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.upsert_user_page(
  p_user_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_avatar_url text,
  p_avatar_style jsonb,
  p_theme_settings jsonb,
  p_seo_meta jsonb,
  p_editor_mode text DEFAULT 'linear',
  p_grid_config jsonb DEFAULT NULL,
  p_integrations jsonb DEFAULT NULL,
  p_favicon_url text DEFAULT NULL,
  p_hide_branding boolean DEFAULT false,
  p_organization_id uuid DEFAULT NULL,
  p_webhook_url text DEFAULT NULL,
  p_webhook_secret text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'Unauthorized: p_user_id does not match authenticated user'; END IF;
  IF p_organization_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.zone_members WHERE zone_id = p_organization_id AND user_id = auth.uid() AND status = 'active') THEN
      RAISE EXCEPTION 'Unauthorized: User is not a member of this organization';
    END IF;
  END IF;

  SELECT id INTO v_page_id FROM public.pages WHERE user_id = p_user_id AND organization_id IS NOT DISTINCT FROM p_organization_id LIMIT 1;
  IF v_page_id IS NULL THEN
    SELECT id INTO v_page_id FROM public.pages WHERE slug = p_slug AND user_id = p_user_id LIMIT 1;
  END IF;

  IF v_page_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.pages WHERE slug = p_slug AND user_id != p_user_id) THEN
      RAISE EXCEPTION 'Slug already taken by another user';
    END IF;
    INSERT INTO public.pages (user_id, slug, title, description, avatar_url, avatar_style, theme_settings, seo_meta, is_published, editor_mode, grid_config, integrations, favicon_url, hide_branding, organization_id, webhook_url, webhook_secret)
    VALUES (p_user_id, p_slug, p_title, p_description, p_avatar_url, p_avatar_style, p_theme_settings, p_seo_meta, false, COALESCE(p_editor_mode, 'linear'), p_grid_config, p_integrations, p_favicon_url, p_hide_branding, p_organization_id, p_webhook_url, p_webhook_secret)
    RETURNING id INTO v_page_id;
  ELSE
    UPDATE public.pages SET slug = p_slug, title = p_title, description = p_description, avatar_url = p_avatar_url, avatar_style = p_avatar_style, theme_settings = p_theme_settings, seo_meta = p_seo_meta, editor_mode = COALESCE(p_editor_mode, 'linear'), grid_config = p_grid_config, integrations = p_integrations, favicon_url = p_favicon_url, hide_branding = p_hide_branding, organization_id = COALESCE(p_organization_id, organization_id), webhook_url = COALESCE(p_webhook_url, webhook_url), webhook_secret = COALESCE(p_webhook_secret, webhook_secret), updated_at = now()
    WHERE id = v_page_id;
  END IF;

  RETURN v_page_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_user_page(uuid, text, text, text, text, jsonb, jsonb, jsonb, text, jsonb, jsonb, text, boolean, uuid, text, text) TO authenticated;

-- get_my_full_page (RPC to get full page including sensitive columns)
CREATE OR REPLACE FUNCTION public.get_my_full_page(p_user_id uuid DEFAULT auth.uid())
RETURNS SETOF public.pages
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.pages WHERE user_id = p_user_id AND auth.uid() = p_user_id LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_full_page(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_full_page(uuid) TO authenticated;

-- ==============================================
-- 10. TOKEN ECONOMY SECURITY FUNCTIONS
-- ==============================================

-- add_linkkon_tokens
CREATE OR REPLACE FUNCTION public.add_linkkon_tokens(p_user_id uuid, p_amount integer, p_source text, p_description text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_new_balance INTEGER;
BEGIN
  IF p_user_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;
  INSERT INTO public.user_tokens (user_id, balance, total_earned) VALUES (p_user_id, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_tokens SET balance = balance + p_amount, total_earned = total_earned + p_amount, updated_at = now() WHERE user_id = p_user_id RETURNING balance INTO v_new_balance;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_user_id, p_amount, 'earn', p_source, p_description);
  RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'earned', p_amount);
END;
$$;

-- spend_linkkon_tokens
CREATE OR REPLACE FUNCTION public.spend_linkkon_tokens(p_user_id uuid, p_amount integer, p_source text, p_description text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_current_balance INTEGER; v_new_balance INTEGER;
BEGIN
  IF p_user_id != auth.uid() THEN RETURN json_build_object('success', false, 'error', 'unauthorized'); END IF;
  SELECT balance INTO v_current_balance FROM public.user_tokens WHERE user_id = p_user_id;
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN RETURN json_build_object('success', false, 'error', 'insufficient_balance', 'balance', COALESCE(v_current_balance, 0)); END IF;
  UPDATE public.user_tokens SET balance = balance - p_amount, total_spent = total_spent + p_amount, updated_at = now() WHERE user_id = p_user_id RETURNING balance INTO v_new_balance;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_user_id, -p_amount, 'spend', p_source, p_description);
  RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'spent', p_amount);
END;
$$;

-- convert_tokens_to_premium
CREATE OR REPLACE FUNCTION public.convert_tokens_to_premium(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_current_balance INTEGER; v_current_trial TIMESTAMP WITH TIME ZONE; v_new_trial TIMESTAMP WITH TIME ZONE;
BEGIN
  IF auth.uid() != p_user_id THEN RAISE EXCEPTION 'Unauthorized: UserId mismatch'; END IF;
  SELECT balance INTO v_current_balance FROM public.user_tokens WHERE user_id = p_user_id;
  IF v_current_balance IS NULL OR v_current_balance < 100 THEN RETURN json_build_object('success', false, 'error', 'insufficient_tokens', 'required', 100, 'balance', COALESCE(v_current_balance, 0)); END IF;
  SELECT trial_ends_at INTO v_current_trial FROM public.user_profiles WHERE id = p_user_id;
  IF v_current_trial IS NOT NULL AND v_current_trial > now() THEN v_new_trial := v_current_trial + INTERVAL '1 day'; ELSE v_new_trial := now() + INTERVAL '1 day'; END IF;
  UPDATE public.user_tokens SET balance = balance - 100, total_spent = total_spent + 100, updated_at = now() WHERE user_id = p_user_id;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_user_id, -100, 'spend', 'premium_conversion', '1 день Premium');
  UPDATE public.user_profiles SET trial_ends_at = v_new_trial, updated_at = now() WHERE id = p_user_id;
  RETURN json_build_object('success', true, 'premium_until', v_new_trial);
END;
$$;

-- claim_daily_token_reward
CREATE OR REPLACE FUNCTION public.claim_daily_token_reward(p_user_id uuid, p_action_type text, p_amount integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_already_claimed BOOLEAN; v_new_balance NUMERIC;
BEGIN
  IF p_user_id != auth.uid() THEN RETURN jsonb_build_object('success', false, 'error', 'unauthorized'); END IF;
  SELECT EXISTS(SELECT 1 FROM daily_token_limits WHERE user_id = p_user_id AND action_type = p_action_type AND action_date = CURRENT_DATE) INTO v_already_claimed;
  IF v_already_claimed THEN RETURN jsonb_build_object('success', false, 'error', 'already_claimed_today'); END IF;
  INSERT INTO daily_token_limits (user_id, action_type, action_date) VALUES (p_user_id, p_action_type, CURRENT_DATE);
  INSERT INTO user_tokens (user_id, balance, total_earned, total_spent) VALUES (p_user_id, p_amount, p_amount, 0) ON CONFLICT (user_id) DO UPDATE SET balance = user_tokens.balance + p_amount, total_earned = user_tokens.total_earned + p_amount;
  SELECT balance INTO v_new_balance FROM user_tokens WHERE user_id = p_user_id;
  INSERT INTO token_transactions (user_id, amount, type, source) VALUES (p_user_id, p_amount, 'earn', p_action_type);
  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- complete_daily_quest
CREATE OR REPLACE FUNCTION public.complete_daily_quest(p_user_id uuid, p_quest_key text, p_bonus_hours integer DEFAULT 1)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_today DATE := CURRENT_DATE; v_already_completed BOOLEAN; v_token_amount INTEGER;
BEGIN
  IF p_user_id != auth.uid() THEN RETURN json_build_object('success', false, 'error', 'unauthorized'); END IF;
  SELECT EXISTS(SELECT 1 FROM public.daily_quests_completed WHERE user_id = p_user_id AND quest_key = p_quest_key AND completed_date = v_today) INTO v_already_completed;
  IF v_already_completed THEN RETURN json_build_object('success', false, 'reason', 'already_completed'); END IF;
  v_token_amount := GREATEST(p_bonus_hours * 5, 5);
  INSERT INTO public.daily_quests_completed (user_id, quest_key, completed_date) VALUES (p_user_id, p_quest_key, v_today);
  PERFORM public.add_linkkon_tokens(p_user_id, v_token_amount, 'daily_quest', p_quest_key);
  RETURN json_build_object('success', true, 'tokens_earned', v_token_amount);
END;
$$;

-- process_marketplace_purchase
CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(p_buyer_id uuid, p_seller_id uuid, p_price integer, p_item_type text, p_item_id text, p_description text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_platform_fee NUMERIC; v_net_amount NUMERIC; v_buyer_balance NUMERIC; v_total_cost NUMERIC;
BEGIN
  IF p_buyer_id != auth.uid() THEN RETURN jsonb_build_object('success', false, 'error', 'unauthorized'); END IF;
  v_platform_fee := ROUND(p_price * 0.04, 2); v_total_cost := p_price + v_platform_fee; v_net_amount := p_price;
  SELECT balance INTO v_buyer_balance FROM user_tokens WHERE user_id = p_buyer_id;
  IF v_buyer_balance IS NULL OR v_buyer_balance < v_total_cost THEN RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance'); END IF;
  UPDATE user_tokens SET balance = balance - v_total_cost, total_spent = total_spent + v_total_cost WHERE user_id = p_buyer_id;
  IF p_seller_id IS NOT NULL THEN
    INSERT INTO user_tokens (user_id, balance, total_earned, total_spent) VALUES (p_seller_id, v_net_amount, v_net_amount, 0) ON CONFLICT (user_id) DO UPDATE SET balance = user_tokens.balance + v_net_amount, total_earned = user_tokens.total_earned + v_net_amount;
  END IF;
  INSERT INTO token_transactions (user_id, amount, type, source, description, seller_id, buyer_id, item_type, item_id, original_price, platform_fee, net_amount) VALUES (p_buyer_id, -v_total_cost, 'spend', p_item_type, p_description, p_seller_id, p_buyer_id, p_item_type, p_item_id, p_price, v_platform_fee, v_net_amount);
  IF p_seller_id IS NOT NULL THEN
    INSERT INTO token_transactions (user_id, amount, type, source, description, seller_id, buyer_id, item_type, item_id, original_price, platform_fee, net_amount) VALUES (p_seller_id, v_net_amount, 'earn', p_item_type, p_description, p_seller_id, p_buyer_id, p_item_type, p_item_id, p_price, v_platform_fee, v_net_amount);
  END IF;
  RETURN jsonb_build_object('success', true, 'total_cost', v_total_cost, 'platform_fee', v_platform_fee);
END;
$$;

-- get_token_analytics (admin only)
CREATE OR REPLACE FUNCTION public.get_token_analytics(p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_start DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days'); v_end DATE := COALESCE(p_end_date, CURRENT_DATE); v_result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized: Admin role required'; END IF;
  SELECT jsonb_build_object('total_tokens_in_circulation', (SELECT COALESCE(SUM(balance), 0) FROM user_tokens), 'total_earned_all_time', (SELECT COALESCE(SUM(total_earned), 0) FROM user_tokens), 'total_spent_all_time', (SELECT COALESCE(SUM(total_spent), 0) FROM user_tokens), 'premium_purchases', (SELECT COALESCE(SUM(ABS(amount)), 0) FROM token_transactions WHERE item_type = 'premium' AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'), 'template_purchases', (SELECT COALESCE(SUM(ABS(amount)), 0) FROM token_transactions WHERE item_type = 'template' AND type = 'spend' AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'), 'product_purchases', (SELECT COALESCE(SUM(ABS(amount)), 0) FROM token_transactions WHERE item_type = 'product' AND type = 'spend' AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'), 'platform_fees_earned', (SELECT COALESCE(SUM(platform_fee), 0) FROM token_transactions WHERE platform_fee IS NOT NULL AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'), 'pending_withdrawals', (SELECT COALESCE(SUM(amount), 0) FROM token_withdrawals WHERE status = 'pending'), 'completed_withdrawals', (SELECT COALESCE(SUM(amount), 0) FROM token_withdrawals WHERE status = 'completed' AND created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'), 'active_token_users', (SELECT COUNT(DISTINCT user_id) FROM token_transactions WHERE created_at >= v_start AND created_at <= v_end + INTERVAL '1 day'), 'transactions_by_type', (SELECT jsonb_object_agg(COALESCE(item_type, source), cnt) FROM (SELECT COALESCE(item_type, source) as item_type, COUNT(*) as cnt FROM token_transactions WHERE created_at >= v_start AND created_at <= v_end + INTERVAL '1 day' GROUP BY COALESCE(item_type, source)) sub)) INTO v_result;
  RETURN v_result;
END;
$$;

-- apply_referral
CREATE OR REPLACE FUNCTION public.apply_referral(p_code TEXT, p_referred_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_referrer_id UUID; v_referral_code_id UUID; v_already_referred BOOLEAN; v_referrer_total_referrals INTEGER;
BEGIN
  IF auth.uid() != p_referred_user_id THEN RAISE EXCEPTION 'Unauthorized: UserId mismatch'; END IF;
  SELECT id, user_id INTO v_referral_code_id, v_referrer_id FROM public.referral_codes WHERE code = UPPER(p_code) AND is_active = true;
  IF v_referral_code_id IS NULL THEN RETURN json_build_object('success', false, 'error', 'invalid_code'); END IF;
  IF v_referrer_id = p_referred_user_id THEN RETURN json_build_object('success', false, 'error', 'self_referral'); END IF;
  SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referred_id = p_referred_user_id) INTO v_already_referred;
  IF v_already_referred THEN RETURN json_build_object('success', false, 'error', 'already_referred'); END IF;
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code_id) VALUES (v_referrer_id, p_referred_user_id, v_referral_code_id);
  INSERT INTO public.user_tokens (user_id, balance, total_earned) VALUES (p_referred_user_id, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_tokens SET balance = balance + 50, total_earned = total_earned + 50, updated_at = now() WHERE user_id = p_referred_user_id;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (p_referred_user_id, 50, 'earn', 'referral', 'Бонус за регистрацию');
  INSERT INTO public.user_tokens (user_id, balance, total_earned) VALUES (v_referrer_id, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.user_tokens SET balance = balance + 50, total_earned = total_earned + 50, updated_at = now() WHERE user_id = v_referrer_id;
  INSERT INTO public.token_transactions (user_id, amount, type, source, description) VALUES (v_referrer_id, 50, 'earn', 'referral', 'Бонус за приглашение друга');
  SELECT COUNT(*) INTO v_referrer_total_referrals FROM public.referrals WHERE referrer_id = v_referrer_id;
  IF v_referrer_total_referrals > 0 AND v_referrer_total_referrals % 3 = 0 THEN
    UPDATE public.user_profiles SET trial_ends_at = CASE WHEN trial_ends_at IS NOT NULL AND trial_ends_at > now() THEN trial_ends_at + INTERVAL '1 day' ELSE now() + INTERVAL '1 day' END, updated_at = now() WHERE id = v_referrer_id;
  END IF;
  RETURN json_build_object('success', true, 'bonus_tokens', 50, 'referrer_tokens', 50);
END;
$$;

-- ==============================================
-- 11. TEAM/ZONE RPCs
-- ==============================================

-- get_team_invite_code
CREATE OR REPLACE FUNCTION public.get_team_invite_code(_team_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_owner uuid; v_code text;
BEGIN
  SELECT owner_id INTO v_owner FROM public.teams WHERE id = _team_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'team_not_found'; END IF;
  IF v_owner <> auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT invite_code INTO v_code FROM public.team_secrets WHERE team_id = _team_id;
  RETURN v_code;
END;
$$;

-- get_zone_calendar_token
CREATE OR REPLACE FUNCTION public.get_zone_calendar_token(_zone_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_token text;
BEGIN
  IF NOT public.is_zone_admin(_zone_id, auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT calendar_feed_token INTO v_token FROM public.zone_secrets WHERE zone_id = _zone_id;
  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.get_team_invite_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_team_invite_code(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_zone_calendar_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_zone_calendar_token(uuid) TO authenticated;

-- public_teams view
DROP VIEW IF EXISTS public.public_teams;
CREATE VIEW public.public_teams WITH (security_invoker = true) AS
SELECT t.id, t.name, t.slug, t.description, t.avatar_url, t.niche, t.is_public, t.owner_id, t.created_at, t.updated_at,
  CASE WHEN t.owner_id = auth.uid() THEN ts.invite_code
       WHEN EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = t.id AND tm.user_id = auth.uid()) THEN ts.invite_code
       ELSE NULL END AS invite_code
FROM public.teams t LEFT JOIN public.team_secrets ts ON ts.team_id = t.id;
GRANT SELECT ON public.public_teams TO anon, authenticated;

-- tg_init_team_secret
CREATE OR REPLACE FUNCTION public.tg_init_team_secret()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.team_secrets (team_id, invite_code)
  VALUES (NEW.id, 'team-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)) ON CONFLICT (team_id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS init_team_secret ON public.teams;
CREATE TRIGGER init_team_secret AFTER INSERT ON public.teams FOR EACH ROW EXECUTE FUNCTION public.tg_init_team_secret();

-- tg_init_zone_secret
CREATE OR REPLACE FUNCTION public.tg_init_zone_secret()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.zone_secrets (zone_id, calendar_feed_token) VALUES (NEW.id, encode(gen_random_bytes(24), 'hex')) ON CONFLICT (zone_id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS init_zone_secret ON public.zones;
CREATE TRIGGER init_zone_secret AFTER INSERT ON public.zones FOR EACH ROW EXECUTE FUNCTION public.tg_init_zone_secret();

-- get_admin_withdrawals
CREATE OR REPLACE FUNCTION public.get_admin_withdrawals(p_status text DEFAULT NULL)
RETURNS SETOF public.token_withdrawals
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'forbidden: admin role required'; END IF;
  RETURN QUERY SELECT * FROM public.token_withdrawals WHERE p_status IS NULL OR status = p_status ORDER BY created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_withdrawals(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_withdrawals(text) TO authenticated;

-- get_page_search_diagnostics
CREATE OR REPLACE FUNCTION public.get_page_search_diagnostics(p_page_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_page record; v_recent_submissions jsonb; v_child_total integer := 0; v_child_eligible integer := 0; v_child_excluded_thin integer := 0; v_child_removed integer := 0; v_child_details jsonb := '[]'::jsonb; v_entry_key text; v_entry_val jsonb; v_svc_slug text; v_svc_state text; v_svc_title text; v_is_indexable boolean; v_child_last_indexnow timestamptz; v_child_last_status text;
BEGIN
  SELECT id, slug, is_published, is_indexable, quality_score, quality_breakdown, index_exclusion_reasons, last_indexnow_at, service_slugs, city, profession, entity_type, niche, updated_at INTO v_page FROM public.pages WHERE id = p_page_id;
  IF v_page IS NULL THEN RETURN jsonb_build_object('error', 'page_not_found'); END IF;
  v_is_indexable := v_page.is_published AND COALESCE(v_page.is_indexable, true) AND COALESCE(v_page.quality_score, 0) >= 25;
  FOR v_entry_key, v_entry_val IN SELECT * FROM jsonb_each(COALESCE(v_page.service_slugs, '{}'::jsonb)) LOOP
    IF jsonb_typeof(v_entry_val) != 'object' THEN CONTINUE; END IF;
    v_child_total := v_child_total + 1; v_svc_slug := v_entry_val->>'slug'; v_svc_state := v_entry_val->>'state'; v_svc_title := COALESCE(v_entry_val->>'title', v_entry_key);
    SELECT created_at, submission_status INTO v_child_last_indexnow, v_child_last_status FROM public.indexing_submissions WHERE page_id = p_page_id AND child_item_id = v_entry_key ORDER BY created_at DESC LIMIT 1;
    IF v_svc_state = 'removed' THEN v_child_removed := v_child_removed + 1;
    ELSIF v_svc_state = 'thin' THEN v_child_excluded_thin := v_child_excluded_thin + 1;
    ELSIF v_is_indexable THEN v_svc_state := 'eligible'; v_child_eligible := v_child_eligible + 1;
    ELSE v_svc_state := 'parent_not_indexable';
    END IF;
    v_child_details := v_child_details || jsonb_build_array(jsonb_build_object('id', v_entry_key, 'title', v_svc_title, 'slug', v_svc_slug, 'state', v_svc_state, 'url', 'https://lnkmx.my/' || v_page.slug || '/services/' || v_svc_slug, 'last_indexnow_at', v_child_last_indexnow, 'last_submission_status', v_child_last_status));
  END LOOP;
  SELECT COALESCE(jsonb_agg(sub ORDER BY sub_created DESC), '[]'::jsonb) INTO v_recent_submissions FROM (SELECT jsonb_build_object('id', s.id, 'target_url', s.target_url, 'child_type', s.child_type, 'child_item_id', s.child_item_id, 'child_slug', s.child_slug, 'provider', s.provider, 'action_type', s.action_type, 'status', s.submission_status, 'skip_reason', s.skip_reason, 'http_status', s.http_status, 'created_at', s.created_at) AS sub, s.created_at AS sub_created FROM public.indexing_submissions s WHERE s.page_id = p_page_id ORDER BY s.created_at DESC LIMIT 20) t;
  RETURN jsonb_build_object('page_id', v_page.id, 'slug', v_page.slug, 'is_published', v_page.is_published, 'quality_score', COALESCE(v_page.quality_score, 0), 'quality_breakdown', v_page.quality_breakdown, 'index_exclusion_reasons', v_page.index_exclusion_reasons, 'is_indexable', v_is_indexable, 'included_in_sitemap', v_is_indexable, 'last_indexnow_at', v_page.last_indexnow_at, 'service_slugs', v_page.service_slugs, 'canonical_url', 'https://lnkmx.my/' || v_page.slug, 'child_page_count', v_child_total - v_child_removed, 'child_summary', jsonb_build_object('total', v_child_total, 'eligible', v_child_eligible, 'excluded_thin', v_child_excluded_thin, 'removed', v_child_removed, 'parent_not_indexable', v_child_total - v_child_eligible - v_child_excluded_thin - v_child_removed), 'child_details', v_child_details, 'recent_submissions', v_recent_submissions, 'diagnostics_at', now());
END;
$$;

-- ==============================================
-- 12. ADMIN ASSIGNMENT
-- ==============================================

DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ilyasazelkhanov@gmail.com';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

COMMIT;
