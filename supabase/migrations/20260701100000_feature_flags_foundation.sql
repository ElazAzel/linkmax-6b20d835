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
  ('ai_copilot_enabled', 'AI Copilot', 'Dashboard recommendations and next-best-action assistant rollout.', false, false, 0)
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.feature_flags IS 'Native LinkMAX product feature flags for controlled rollout by segment, tier, role, geography, language, beta list, or percentage.';
COMMENT ON TABLE public.feature_flag_rules IS 'Targeting rules for native product feature flags.';
COMMENT ON TABLE public.feature_flag_audit_log IS 'Admin audit trail for feature flag and rule changes.';
