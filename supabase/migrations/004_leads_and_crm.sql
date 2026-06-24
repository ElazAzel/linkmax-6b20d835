BEGIN;

-- ============================================================================
-- 004_leads_and_crm.sql — Leads, CRM automations, custom fields, pipelines
-- Merged from: 20251206102508, 20260101061143, 20260220053300, 20260222111500,
--              20260303000001, 20260311000000, 20260307190000,
--              20260308010000, 20260403191000, 20260404100000
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source') THEN
    CREATE TYPE public.lead_source AS ENUM ('page_view', 'form', 'messenger', 'manual', 'other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interaction_type') THEN
    CREATE TYPE public.interaction_type AS ENUM ('note', 'call', 'email', 'message', 'meeting');
  END IF;
END $$;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- 2a. leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source lead_source NOT NULL DEFAULT 'manual',
  status lead_status NOT NULL DEFAULT 'new',
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_automation_check TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS automation_sent_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON public.leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_automation_check ON public.leads(last_automation_check) WHERE status = 'new';

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 2b. lead_interactions
CREATE TABLE IF NOT EXISTS public.lead_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type interaction_type NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON public.lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_user_id ON public.lead_interactions(user_id);

ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

-- 2c. crm_automations
CREATE TABLE IF NOT EXISTS public.crm_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_type TEXT NOT NULL CHECK (automation_type IN ('follow_up', 'time_clarification', 'review_request')),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  trigger_hours INTEGER NOT NULL DEFAULT 24,
  template_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_automations_user_id ON public.crm_automations(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_automations_enabled ON public.crm_automations(is_enabled) WHERE is_enabled = true;

ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;

-- 2d. automation_logs
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.crm_automations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_automation_id ON public.automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_lead_id ON public.automation_logs(lead_id);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

-- leads policies
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;

CREATE POLICY "Users can view own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own leads"
  ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads"
  ON public.leads FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- lead_interactions policies
DROP POLICY IF EXISTS "Users can view own lead interactions" ON public.lead_interactions;
DROP POLICY IF EXISTS "Users can create own lead interactions" ON public.lead_interactions;
DROP POLICY IF EXISTS "Users can delete own lead interactions" ON public.lead_interactions;

CREATE POLICY "Users can view own lead interactions"
  ON public.lead_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own lead interactions"
  ON public.lead_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lead interactions"
  ON public.lead_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- crm_automations policies
DROP POLICY IF EXISTS "Users can view own automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Users can create own automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Users can update own automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Users can delete own automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Admins can view all automations" ON public.crm_automations;

CREATE POLICY "Users can view own automations"
  ON public.crm_automations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own automations"
  ON public.crm_automations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automations"
  ON public.crm_automations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own automations"
  ON public.crm_automations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all automations"
  ON public.crm_automations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- automation_logs policies
DROP POLICY IF EXISTS "Users can view own automation logs" ON public.automation_logs;
DROP POLICY IF EXISTS "Admins can view all automation logs" ON public.automation_logs;

CREATE POLICY "Users can view own automation logs"
  ON public.automation_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.crm_automations ca
    WHERE ca.id = automation_logs.automation_id AND ca.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all automation logs"
  ON public.automation_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_automations_updated_at ON public.crm_automations;
CREATE TRIGGER update_crm_automations_updated_at
  BEFORE UPDATE ON public.crm_automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
