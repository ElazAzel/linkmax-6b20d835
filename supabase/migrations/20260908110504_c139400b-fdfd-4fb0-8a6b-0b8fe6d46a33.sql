-- Phase 46: Feature Flags Foundation
-- Native rollout controls for product modules without embedding GrowthBook/Unleash.

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE CHECK (key ~ '^[a-z][a-z0-9_]*$'),
  name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  default_enabled boolean NOT NULL DEFAULT false,
  rollout_percentage integer NOT NULL DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feature_flags_window_check CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.feature_flag_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id uuid NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
  rule_type text NOT NULL CHECK (rule_type IN ('user_id', 'tier', 'niche', 'country', 'language', 'role', 'percentage', 'beta_list')),
  operator text NOT NULL DEFAULT 'in' CHECK (operator IN ('in', 'not_in', 'equals', 'not_equals')),
  values jsonb NOT NULL DEFAULT '[]'::jsonb,
  rollout_percentage integer CHECK (rollout_percentage IS NULL OR rollout_percentage BETWEEN 0 AND 100),
  priority integer NOT NULL DEFAULT 100,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key
  ON public.feature_flags (key);

CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled
  ON public.feature_flags (is_enabled)
  WHERE is_enabled = true;

CREATE INDEX IF NOT EXISTS idx_feature_flag_rules_flag_priority
  ON public.feature_flag_rules (flag_id, priority, is_enabled);

CREATE TABLE IF NOT EXISTS public.feature_flag_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id uuid REFERENCES public.feature_flags(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'enabled', 'disabled', 'rule_created', 'rule_updated', 'rule_deleted')),
  previous_value jsonb,
  next_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_flag_time
  ON public.feature_flag_audit_log (flag_id, created_at DESC);

GRANT SELECT ON public.feature_flags TO authenticated;
GRANT SELECT ON public.feature_flag_rules TO authenticated;
GRANT SELECT, INSERT ON public.feature_flag_audit_log TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.feature_flags TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.feature_flag_rules TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
GRANT ALL ON public.feature_flag_rules TO service_role;
GRANT ALL ON public.feature_flag_audit_log TO service_role;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read feature flags" ON public.feature_flags;
CREATE POLICY "Authenticated users can read feature flags"
ON public.feature_flags
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage feature flags" ON public.feature_flags;
CREATE POLICY "Admins can manage feature flags"
ON public.feature_flags
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can read feature flag rules" ON public.feature_flag_rules;
CREATE POLICY "Authenticated users can read feature flag rules"
ON public.feature_flag_rules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.feature_flags flags
    WHERE flags.id = feature_flag_rules.flag_id
  )
);

DROP POLICY IF EXISTS "Admins can manage feature flag rules" ON public.feature_flag_rules;
CREATE POLICY "Admins can manage feature flag rules"
ON public.feature_flag_rules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can read feature flag audit log" ON public.feature_flag_audit_log;
CREATE POLICY "Admins can read feature flag audit log"
ON public.feature_flag_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert feature flag audit log" ON public.feature_flag_audit_log;
CREATE POLICY "Admins can insert feature flag audit log"
ON public.feature_flag_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.feature_flags (key, name, description, is_enabled, default_enabled, rollout_percentage)
VALUES
  ('booking_v2_enabled', 'Booking V2', 'Services, staff, availability, reschedule/cancel, and deposit-ready booking rollout.', false, false, 0),
  ('form_builder_v2_enabled', 'Form Builder V2', 'Schema-driven forms, conditional logic, survey templates, and lead qualification rollout.', false, false, 0),
  ('automation_builder_enabled', 'Automation Builder', 'Template-first automation builder for CRM, bookings, invoices, events, Telegram, email, tasks, and webhooks.', false, false, 0),
  ('developer_portal_v2_enabled', 'Developer Portal V2', 'Webhook delivery logs, retries, HMAC testing, scopes, and operational reliability rollout.', false, false, 0),
  ('marketplace_enabled', 'Marketplace', 'Native commerce and digital product marketplace rollout.', false, false, 0),
  ('native_push_enabled', 'Native Push', 'Capacitor/Firebase native push notification rollout.', false, false, 0),
  ('ai_copilot_enabled', 'AI Copilot', 'Dashboard recommendations and next-best-action assistant rollout.', false, false, 0),
  ('revenue_core_v1', 'Revenue Core', 'Revenue core services, offerings and outcome tracking.', true, true, 100),
  ('beauty_revenue_kit_v1', 'Beauty Revenue Kit', 'Beauty niche revenue kit rollout.', true, true, 100),
  ('outcome_home_v1', 'Outcome Home', 'Outcome-oriented dashboard home rollout.', true, true, 100),
  ('booking_self_service_v1', 'Booking Self Service', 'Client self-service reschedule and cancel.', true, true, 100)
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.feature_flags IS 'Native LinkMAX product feature flags for controlled rollout by segment, tier, role, geography, language, beta list, or percentage.';
COMMENT ON TABLE public.feature_flag_rules IS 'Targeting rules for native product feature flags.';
COMMENT ON TABLE public.feature_flag_audit_log IS 'Admin audit trail for feature flag and rule changes.';

-- Fix: page save must not rename a page onto a slug already used by another page
CREATE OR REPLACE FUNCTION public.upsert_user_page(
  p_user_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_avatar_url text,
  p_avatar_style jsonb,
  p_theme_settings jsonb,
  p_seo_meta jsonb,
  p_editor_mode text DEFAULT 'linear'::text,
  p_grid_config jsonb DEFAULT NULL::jsonb,
  p_integrations jsonb DEFAULT NULL::jsonb,
  p_favicon_url text DEFAULT NULL::text,
  p_hide_branding boolean DEFAULT false,
  p_organization_id uuid DEFAULT NULL::uuid,
  p_webhook_url text DEFAULT NULL::text,
  p_webhook_secret text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_page_id uuid;
  v_slug text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: p_user_id does not match authenticated user';
  END IF;

  IF p_organization_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.zone_members
      WHERE zone_id = p_organization_id AND user_id = auth.uid() AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Unauthorized: User is not a member of this organization';
    END IF;
  END IF;

  -- Prefer the page that already owns this slug
  SELECT id INTO v_page_id FROM public.pages
  WHERE user_id = p_user_id AND slug = p_slug
  LIMIT 1;

  IF v_page_id IS NULL THEN
    SELECT id INTO v_page_id FROM public.pages
    WHERE user_id = p_user_id AND organization_id IS NOT DISTINCT FROM p_organization_id
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_page_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.pages WHERE slug = p_slug) THEN
      RAISE EXCEPTION 'Slug already taken';
    END IF;

    INSERT INTO public.pages (
      user_id, slug, title, description, avatar_url, avatar_style,
      theme_settings, seo_meta, is_published, editor_mode, grid_config,
      integrations, favicon_url, hide_branding, organization_id,
      webhook_url, webhook_secret
    )
    VALUES (
      p_user_id, p_slug, p_title, p_description, p_avatar_url, p_avatar_style,
      p_theme_settings, p_seo_meta, false, COALESCE(p_editor_mode, 'linear'), p_grid_config,
      p_integrations, p_favicon_url, p_hide_branding, p_organization_id,
      p_webhook_url, p_webhook_secret
    )
    RETURNING id INTO v_page_id;
  ELSE
    -- Keep the current slug if the requested one belongs to a different page
    SELECT CASE
      WHEN EXISTS (
        SELECT 1 FROM public.pages
        WHERE slug = p_slug AND id <> v_page_id
      ) THEN pages.slug
      ELSE p_slug
    END
    INTO v_slug
    FROM public.pages WHERE id = v_page_id;

    UPDATE public.pages
    SET
      slug = COALESCE(v_slug, slug),
      title = p_title,
      description = p_description,
      avatar_url = p_avatar_url,
      avatar_style = p_avatar_style,
      theme_settings = p_theme_settings,
      seo_meta = p_seo_meta,
      editor_mode = COALESCE(p_editor_mode, 'linear'),
      grid_config = p_grid_config,
      integrations = p_integrations,
      favicon_url = p_favicon_url,
      hide_branding = p_hide_branding,
      organization_id = COALESCE(p_organization_id, organization_id),
      webhook_url = COALESCE(p_webhook_url, webhook_url),
      webhook_secret = COALESCE(p_webhook_secret, webhook_secret),
      updated_at = now()
    WHERE id = v_page_id;
  END IF;

  RETURN v_page_id;
END;
$function$;