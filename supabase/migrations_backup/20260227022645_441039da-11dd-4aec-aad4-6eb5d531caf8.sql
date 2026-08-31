
-- Zone Tasks
CREATE TABLE public.zone_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to UUID,
  created_by UUID NOT NULL,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deal_id UUID REFERENCES public.zone_deals(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.zone_contacts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zone_tasks_zone ON public.zone_tasks(zone_id);
CREATE INDEX idx_zone_tasks_assigned ON public.zone_tasks(assigned_to);
CREATE INDEX idx_zone_tasks_status ON public.zone_tasks(zone_id, status);

ALTER TABLE public.zone_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members can view tasks"
  ON public.zone_tasks FOR SELECT
  USING (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone members can create tasks"
  ON public.zone_tasks FOR INSERT
  WITH CHECK (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone members can update tasks"
  ON public.zone_tasks FOR UPDATE
  USING (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone admins can delete tasks"
  ON public.zone_tasks FOR DELETE
  USING (public.is_zone_admin(zone_id, auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_zone_tasks_updated_at
  BEFORE UPDATE ON public.zone_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
