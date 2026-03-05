
-- =====================================================
-- Phase 1: Fix analytics functions + experiments tables
-- =====================================================

-- 1. Fix increment_block_clicks (was no-op)
CREATE OR REPLACE FUNCTION public.increment_block_clicks(block_uuid text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.blocks
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = block_uuid::uuid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_block_clicks(text) TO anon, authenticated, service_role;

-- 2. Fix increment_view_count (param mismatch: was page_id uuid, code sends page_slug text)
DROP FUNCTION IF EXISTS public.increment_view_count(uuid);
DROP FUNCTION IF EXISTS public.increment_view_count(text);

CREATE OR REPLACE FUNCTION public.increment_view_count(page_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.pages
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE slug = page_slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_view_count(text) TO anon, authenticated, service_role;

-- 3. Create experiments table (missing from DB)
CREATE TABLE IF NOT EXISTS public.experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  block_id uuid NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'A/B Test',
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'ended')),
  traffic_split integer NOT NULL DEFAULT 50,
  winning_variant_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own experiments"
ON public.experiments FOR ALL TO authenticated
USING (page_id IN (SELECT id FROM public.pages WHERE user_id = auth.uid()))
WITH CHECK (page_id IN (SELECT id FROM public.pages WHERE user_id = auth.uid()));

-- 4. Create experiment_variants table
CREATE TABLE IF NOT EXISTS public.experiment_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  variant_key text NOT NULL DEFAULT 'B',
  block_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.experiment_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own experiment variants"
ON public.experiment_variants FOR ALL TO authenticated
USING (experiment_id IN (
  SELECT e.id FROM public.experiments e
  JOIN public.pages p ON p.id = e.page_id
  WHERE p.user_id = auth.uid()
))
WITH CHECK (experiment_id IN (
  SELECT e.id FROM public.experiments e
  JOIN public.pages p ON p.id = e.page_id
  WHERE p.user_id = auth.uid()
));

-- Allow anon to read experiments for public page rendering
CREATE POLICY "Anon can read experiments for published pages"
ON public.experiments FOR SELECT TO anon
USING (page_id IN (SELECT id FROM public.pages WHERE is_published = true));

CREATE POLICY "Anon can read experiment variants"
ON public.experiment_variants FOR SELECT TO anon
USING (experiment_id IN (
  SELECT e.id FROM public.experiments e
  JOIN public.pages p ON p.id = e.page_id
  WHERE p.is_published = true
));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_experiments_page_id ON public.experiments(page_id);
CREATE INDEX IF NOT EXISTS idx_experiment_variants_experiment_id ON public.experiment_variants(experiment_id);

-- =====================================================
-- Phase 3: Zone notifications table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.zone_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  entity_type text,
  entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zone_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read own notifications"
ON public.zone_notifications FOR SELECT TO authenticated
USING (user_id = auth.uid() AND public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Members can update own notifications"
ON public.zone_notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_zone_notifications_user ON public.zone_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_zone_notifications_zone ON public.zone_notifications(zone_id);

-- =====================================================
-- Phase 4: Zone contact notes table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.zone_contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.zone_contacts(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'note' CHECK (type IN ('note', 'call', 'email', 'meeting', 'task')),
  content text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zone_contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members can manage contact notes"
ON public.zone_contact_notes FOR ALL TO authenticated
USING (public.is_zone_member(zone_id, auth.uid()))
WITH CHECK (public.is_zone_member(zone_id, auth.uid()));

CREATE INDEX IF NOT EXISTS idx_zone_contact_notes_contact ON public.zone_contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_zone_contact_notes_zone ON public.zone_contact_notes(zone_id);

-- =====================================================
-- Notification triggers
-- =====================================================

-- Notify zone members on new contact
CREATE OR REPLACE FUNCTION public.trigger_zone_contact_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member RECORD;
BEGIN
  FOR v_member IN
    SELECT user_id FROM public.zone_members
    WHERE zone_id = NEW.zone_id AND status = 'active'
  LOOP
    INSERT INTO public.zone_notifications (zone_id, user_id, type, title, body, entity_type, entity_id)
    VALUES (
      NEW.zone_id, v_member.user_id, 'new_contact',
      'Новый контакт: ' || NEW.name,
      COALESCE(NEW.email, NEW.phone, ''),
      'contact', NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_zone_contact_notification
AFTER INSERT ON public.zone_contacts
FOR EACH ROW EXECUTE FUNCTION public.trigger_zone_contact_notification();

-- Notify zone members on new deal
CREATE OR REPLACE FUNCTION public.trigger_zone_deal_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member RECORD;
BEGIN
  FOR v_member IN
    SELECT user_id FROM public.zone_members
    WHERE zone_id = NEW.zone_id AND status = 'active'
  LOOP
    INSERT INTO public.zone_notifications (zone_id, user_id, type, title, body, entity_type, entity_id)
    VALUES (
      NEW.zone_id, v_member.user_id, 'new_deal',
      'Новая сделка: ' || NEW.title,
      COALESCE(NEW.value_amount::text || ' ₸', ''),
      'deal', NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_zone_deal_notification
AFTER INSERT ON public.zone_deals
FOR EACH ROW EXECUTE FUNCTION public.trigger_zone_deal_notification();
