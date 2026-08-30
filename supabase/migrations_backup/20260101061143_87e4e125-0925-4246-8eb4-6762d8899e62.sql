-- CRM Automations table for storing automation scenarios
CREATE TABLE public.crm_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_type TEXT NOT NULL CHECK (automation_type IN ('follow_up', 'time_clarification', 'review_request')),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  trigger_hours INTEGER NOT NULL DEFAULT 24,
  template_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Automation execution log
CREATE TABLE public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.crm_automations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for logs
CREATE POLICY "Users can view own automation logs"
ON public.automation_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.crm_automations ca
  WHERE ca.id = automation_logs.automation_id AND ca.user_id = auth.uid()
));

CREATE POLICY "Admins can view all automation logs"
ON public.automation_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add last_automation_check column to leads for tracking
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS last_automation_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS automation_sent_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX idx_crm_automations_user_id ON public.crm_automations(user_id);
CREATE INDEX idx_crm_automations_enabled ON public.crm_automations(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_automation_logs_automation_id ON public.automation_logs(automation_id);
CREATE INDEX idx_automation_logs_lead_id ON public.automation_logs(lead_id);
CREATE INDEX idx_leads_automation_check ON public.leads(last_automation_check) WHERE status = 'new';

-- Trigger for updated_at
CREATE TRIGGER update_crm_automations_updated_at
BEFORE UPDATE ON public.crm_automations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();