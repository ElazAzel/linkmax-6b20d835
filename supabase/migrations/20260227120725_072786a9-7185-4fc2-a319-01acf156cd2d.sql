
-- Create zone_automations table for CRM automation rules
CREATE TABLE public.zone_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL, -- 'deal_stage_change', 'overdue_next_step', 'new_contact'
  action_type TEXT NOT NULL,  -- 'create_task', 'notify_owner', 'create_deal'
  config JSONB NOT NULL DEFAULT '{}'::jsonb, -- trigger/action specific config
  is_active BOOLEAN NOT NULL DEFAULT true,
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.zone_automations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Zone admins manage automations"
  ON public.zone_automations FOR ALL
  USING (is_zone_admin(zone_id, auth.uid()));

CREATE POLICY "Zone members view automations"
  ON public.zone_automations FOR SELECT
  USING (is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Platform admins view all automations"
  ON public.zone_automations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index
CREATE INDEX idx_zone_automations_zone_id ON public.zone_automations(zone_id);

-- Enable realtime for zone_invoices (already exists but not in realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE public.zone_automations;
