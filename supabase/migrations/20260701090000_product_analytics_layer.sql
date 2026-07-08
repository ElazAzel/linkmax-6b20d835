-- Phase 46: Product Analytics Layer
-- Adds creator-owned product event tracking and activation health state.

CREATE OR REPLACE FUNCTION public.is_allowed_product_event_name(p_event_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_event_name = ANY (ARRAY[
    'signup_completed',
    'onboarding_started',
    'onboarding_step_completed',
    'onboarding_completed',
    'ai_page_generated',
    'block_added',
    'block_edited',
    'page_published',
    'telegram_connected',
    'first_lead_received',
    'lead_viewed',
    'lead_status_changed',
    'booking_created',
    'invoice_created',
    'payment_completed',
    'upgrade_clicked',
    'upgrade_completed',
    'dashboard_returned'
  ]::text[]);
$$;

CREATE TABLE IF NOT EXISTS public.product_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  source text NOT NULL DEFAULT 'client' CHECK (source IN ('client', 'edge', 'system')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_events_event_name_check CHECK (public.is_allowed_product_event_name(event_name))
);

CREATE INDEX IF NOT EXISTS idx_product_events_user_time
  ON public.product_events (user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_events_name_time
  ON public.product_events (event_name, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_events_page_time
  ON public.product_events (page_id, occurred_at DESC)
  WHERE page_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.creator_activation_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  signup_completed_at timestamptz,
  onboarding_started_at timestamptz,
  onboarding_completed_at timestamptz,
  page_generated_at timestamptz,
  first_edit_at timestamptz,
  page_published_at timestamptz,
  conversion_block_added_at timestamptz,
  telegram_connected_at timestamptz,
  first_lead_received_at timestamptz,
  first_lead_processed_at timestamptz,
  first_booking_created_at timestamptz,
  first_invoice_created_at timestamptz,
  first_payment_completed_at timestamptz,
  upgrade_clicked_at timestamptz,
  upgrade_completed_at timestamptz,
  dashboard_returned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_health_scores (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  page_published_points integer NOT NULL DEFAULT 0,
  conversion_block_points integer NOT NULL DEFAULT 0,
  telegram_points integer NOT NULL DEFAULT 0,
  first_lead_points integer NOT NULL DEFAULT 0,
  lead_processed_points integer NOT NULL DEFAULT 0,
  dashboard_return_points integer NOT NULL DEFAULT 0,
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_activation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_health_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own product events" ON public.product_events;
CREATE POLICY "Users can insert own product events"
ON public.product_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own product events" ON public.product_events;
CREATE POLICY "Users can view own product events"
ON public.product_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own activation state" ON public.creator_activation_state;
CREATE POLICY "Users can manage own activation state"
ON public.creator_activation_state
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own health score" ON public.creator_health_scores;
CREATE POLICY "Users can manage own health score"
ON public.creator_health_scores
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.product_events IS 'Authenticated creator product analytics events for activation, retention, and monetization funnels.';
COMMENT ON TABLE public.creator_activation_state IS 'Current creator activation milestones used by dashboards and health score calculations.';
COMMENT ON TABLE public.creator_health_scores IS 'Materialized creator health score based on activation milestones.';
