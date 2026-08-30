-- ============================================================
-- Telegram Mini App Data Model
-- Phase P0: Foundation tables for Mini App integration
-- Works with the SAME Supabase database as the web platform
-- ============================================================

-- 1. telegram_accounts — Links Telegram identity to auth.users
-- This is the primary identity table for Telegram-first auth
CREATE TABLE IF NOT EXISTS public.telegram_accounts (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_user_id bigint UNIQUE NOT NULL,
  username text,
  first_name text,
  last_name text,
  language_code text DEFAULT 'ru',
  photo_url text,
  allows_write_to_pm boolean DEFAULT true,
  is_premium boolean DEFAULT false,
  last_auth_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for telegram_accounts
ALTER TABLE public.telegram_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own telegram account"
  ON public.telegram_accounts FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own telegram account"
  ON public.telegram_accounts FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Service role has full access to telegram_accounts"
  ON public.telegram_accounts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Index (unique already creates index on telegram_user_id)
CREATE INDEX IF NOT EXISTS idx_telegram_accounts_updated
  ON public.telegram_accounts(updated_at DESC);


-- 2. telegram_miniapp_sessions — Analytics for Mini App sessions
CREATE TABLE IF NOT EXISTS public.telegram_miniapp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id bigint NOT NULL REFERENCES public.telegram_accounts(telegram_user_id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  query_id text,
  chat_instance text,
  chat_type text CHECK (chat_type IS NULL OR chat_type IN ('private', 'group', 'supergroup', 'channel', 'sender')),
  start_param text,
  launch_source text CHECK (launch_source IS NULL OR launch_source IN ('main_app', 'menu_button', 'direct_link', 'inline', 'attachment_menu')),
  platform text,
  is_fullscreen boolean DEFAULT false,
  auth_date timestamptz,
  validated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- RLS for telegram_miniapp_sessions
ALTER TABLE public.telegram_miniapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own miniapp sessions"
  ON public.telegram_miniapp_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to miniapp_sessions"
  ON public.telegram_miniapp_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tg_sessions_user_created
  ON public.telegram_miniapp_sessions(telegram_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tg_sessions_start_param
  ON public.telegram_miniapp_sessions(start_param)
  WHERE start_param IS NOT NULL;


-- 3. telegram_deep_links — Mapping startapp slugs to platform entities
CREATE TABLE IF NOT EXISTS public.telegram_deep_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('page', 'lead', 'contact', 'deal', 'booking', 'zone', 'product', 'onboarding', 'referral')),
  entity_id uuid,
  start_param text UNIQUE NOT NULL,
  campaign_id text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for telegram_deep_links
ALTER TABLE public.telegram_deep_links ENABLE ROW LEVEL SECURITY;

-- Anyone can read deep links (needed for public resolution)
CREATE POLICY "Anyone can view deep links"
  ON public.telegram_deep_links FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own deep links"
  ON public.telegram_deep_links FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own deep links"
  ON public.telegram_deep_links FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own deep links"
  ON public.telegram_deep_links FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Service role has full access to deep_links"
  ON public.telegram_deep_links FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tg_deep_links_start_param
  ON public.telegram_deep_links(start_param);

CREATE INDEX IF NOT EXISTS idx_tg_deep_links_entity
  ON public.telegram_deep_links(entity_type, entity_id);


-- 4. telegram_notification_events — Track notification delivery & engagement
CREATE TABLE IF NOT EXISTS public.telegram_notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_user_id bigint,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  clicked_at timestamptz,
  open_entity_type text,
  open_entity_id uuid
);

-- RLS for telegram_notification_events
ALTER TABLE public.telegram_notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification events"
  ON public.telegram_notification_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to notification_events"
  ON public.telegram_notification_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tg_notif_events_user_sent
  ON public.telegram_notification_events(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_tg_notif_events_type
  ON public.telegram_notification_events(event_type);


-- 5. Helper function: upsert telegram account from Mini App auth
CREATE OR REPLACE FUNCTION public.upsert_telegram_account(
  p_user_id uuid,
  p_telegram_user_id bigint,
  p_username text DEFAULT NULL,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_language_code text DEFAULT 'ru',
  p_photo_url text DEFAULT NULL,
  p_allows_write_to_pm boolean DEFAULT true,
  p_is_premium boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.telegram_accounts (
    id, telegram_user_id, username, first_name, last_name,
    language_code, photo_url, allows_write_to_pm, is_premium,
    last_auth_date, updated_at
  )
  VALUES (
    p_user_id, p_telegram_user_id, p_username, p_first_name, p_last_name,
    p_language_code, p_photo_url, p_allows_write_to_pm, p_is_premium,
    now(), now()
  )
  ON CONFLICT (telegram_user_id)
  DO UPDATE SET
    username = COALESCE(EXCLUDED.username, telegram_accounts.username),
    first_name = COALESCE(EXCLUDED.first_name, telegram_accounts.first_name),
    last_name = COALESCE(EXCLUDED.last_name, telegram_accounts.last_name),
    language_code = COALESCE(EXCLUDED.language_code, telegram_accounts.language_code),
    photo_url = COALESCE(EXCLUDED.photo_url, telegram_accounts.photo_url),
    allows_write_to_pm = EXCLUDED.allows_write_to_pm,
    is_premium = EXCLUDED.is_premium,
    last_auth_date = now(),
    updated_at = now();
END;
$$;


-- 6. Helper function: record a Mini App session
CREATE OR REPLACE FUNCTION public.record_miniapp_session(
  p_telegram_user_id bigint,
  p_user_id uuid DEFAULT NULL,
  p_query_id text DEFAULT NULL,
  p_chat_instance text DEFAULT NULL,
  p_chat_type text DEFAULT NULL,
  p_start_param text DEFAULT NULL,
  p_launch_source text DEFAULT NULL,
  p_platform text DEFAULT NULL,
  p_is_fullscreen boolean DEFAULT false,
  p_auth_date timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  INSERT INTO public.telegram_miniapp_sessions (
    telegram_user_id, user_id, query_id, chat_instance,
    chat_type, start_param, launch_source, platform,
    is_fullscreen, auth_date
  )
  VALUES (
    p_telegram_user_id, p_user_id, p_query_id, p_chat_instance,
    p_chat_type, p_start_param, p_launch_source, p_platform,
    p_is_fullscreen, p_auth_date
  )
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$;


-- 7. Helper function: increment deep link click count
CREATE OR REPLACE FUNCTION public.increment_deep_link_clicks(p_start_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.telegram_deep_links
  SET clicks = clicks + 1, updated_at = now()
  WHERE start_param = p_start_param;
END;
$$;
