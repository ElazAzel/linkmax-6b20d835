
-- ============================================
-- Business Zones: Phase 1+2 — Tables first, then functions, then RLS
-- ============================================

-- TABLES (no RLS yet, no functions referencing them)

CREATE TABLE public.zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  owner_user_id uuid NOT NULL,
  plan_code text NOT NULL DEFAULT 'business_5_m',
  plan_cycle text NOT NULL DEFAULT 'monthly',
  plan_status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  grace_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.zone_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(zone_id, user_id)
);

CREATE TABLE public.zone_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.zone_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE UNIQUE,
  plan_code text NOT NULL,
  plan_cycle text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  last_payment_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.zone_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  telegram_user_id text,
  telegram_username text,
  tags text[] DEFAULT '{}',
  owner_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.zone_deal_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6366f1',
  order_index integer NOT NULL DEFAULT 0,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.zone_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.zone_contacts(id) ON DELETE SET NULL,
  title text NOT NULL,
  stage_id uuid REFERENCES public.zone_deal_stages(id) ON DELETE SET NULL,
  value_amount numeric DEFAULT 0,
  currency text DEFAULT 'KZT',
  next_step text,
  next_step_at timestamptz,
  assigned_to uuid,
  status text NOT NULL DEFAULT 'open',
  lost_reason text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.zone_deal_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.zone_deals(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'note',
  summary text NOT NULL,
  happened_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.zone_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.zone_deals(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.zone_contacts(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KZT',
  description text,
  status text NOT NULL DEFAULT 'created',
  robokassa_invoice_id text,
  pay_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE TABLE public.zone_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_zone_members_user ON public.zone_members(user_id);
CREATE INDEX idx_zone_members_zone ON public.zone_members(zone_id);
CREATE INDEX idx_zone_invites_zone ON public.zone_invites(zone_id);
CREATE INDEX idx_zone_invites_email ON public.zone_invites(email);
CREATE INDEX idx_zone_contacts_zone ON public.zone_contacts(zone_id);
CREATE INDEX idx_zone_contacts_tags ON public.zone_contacts USING GIN(tags);
CREATE INDEX idx_zone_deals_zone ON public.zone_deals(zone_id);
CREATE INDEX idx_zone_deals_stage ON public.zone_deals(stage_id);
CREATE INDEX idx_zone_deals_assigned ON public.zone_deals(assigned_to);
CREATE INDEX idx_zone_deals_status ON public.zone_deals(status);
CREATE INDEX idx_zone_deals_next_step_at ON public.zone_deals(next_step_at);
CREATE INDEX idx_zone_deal_activities_deal ON public.zone_deal_activities(deal_id);
CREATE INDEX idx_zone_invoices_zone ON public.zone_invoices(zone_id);
CREATE INDEX idx_zone_invoices_deal ON public.zone_invoices(deal_id);
CREATE INDEX idx_zone_audit_log_zone ON public.zone_audit_log(zone_id);
CREATE INDEX idx_zones_owner ON public.zones(owner_user_id);
CREATE INDEX idx_zones_slug ON public.zones(slug);

-- ============================================
-- SECURITY DEFINER FUNCTIONS (tables now exist)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_zone_member(p_zone_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.zone_members
    WHERE zone_id = p_zone_id AND user_id = p_user_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_zone_admin(p_zone_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.zone_members
    WHERE zone_id = p_zone_id AND user_id = p_user_id AND status = 'active' AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_zone_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT zone_id FROM public.zone_members WHERE user_id = p_user_id AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.get_zone_member_limit(p_plan_code text)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE p_plan_code
    WHEN 'business_5_m' THEN 5 WHEN 'business_5_y' THEN 5
    WHEN 'business_50_m' THEN 50 WHEN 'business_50_y' THEN 50
    WHEN 'business_100_m' THEN 100 WHEN 'business_100_y' THEN 100
    WHEN 'business_300_m' THEN 300 WHEN 'business_300_y' THEN 300
    WHEN 'business_700_m' THEN 700 WHEN 'business_700_y' THEN 700
    WHEN 'business_1000_m' THEN 1000 WHEN 'business_1000_y' THEN 1000
    WHEN 'business_unl_m' THEN 999999 WHEN 'business_unl_y' THEN 999999
    ELSE 5
  END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their zones" ON public.zones FOR SELECT USING (id IN (SELECT public.get_user_zone_ids(auth.uid())));
CREATE POLICY "Owner can update zone" ON public.zones FOR UPDATE USING (public.is_zone_admin(id, auth.uid()));
CREATE POLICY "Auth users can create zones" ON public.zones FOR INSERT WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Platform admins view all zones" ON public.zones FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.zone_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view zone members" ON public.zone_members FOR SELECT USING (public.is_zone_member(zone_id, auth.uid()));
CREATE POLICY "Zone admins manage members" ON public.zone_members FOR ALL USING (public.is_zone_admin(zone_id, auth.uid()));
CREATE POLICY "Users view own membership" ON public.zone_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Platform admins view all members" ON public.zone_members FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.zone_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zone admins manage invites" ON public.zone_invites FOR ALL USING (public.is_zone_admin(zone_id, auth.uid()));
CREATE POLICY "Anyone can read invites by token" ON public.zone_invites FOR SELECT USING (true);
CREATE POLICY "Platform admins view all invites" ON public.zone_invites FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.zone_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zone admins view subscription" ON public.zone_subscriptions FOR SELECT USING (public.is_zone_admin(zone_id, auth.uid()));
CREATE POLICY "Zone admins manage subscription" ON public.zone_subscriptions FOR ALL USING (public.is_zone_admin(zone_id, auth.uid()));
CREATE POLICY "Platform admins view all subs" ON public.zone_subscriptions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.zone_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zone members view contacts" ON public.zone_contacts FOR SELECT USING (public.is_zone_member(zone_id, auth.uid()));
CREATE POLICY "Zone members create contacts" ON public.zone_contacts FOR INSERT WITH CHECK (public.is_zone_member(zone_id, auth.uid()));
CREATE POLICY "Zone members update contacts" ON public.zone_contacts FOR UPDATE USING (public.is_zone_member(zone_id, auth.uid()));
CREATE POLICY "Zone admins delete contacts" ON public.zone_contacts FOR DELETE USING (public.is_zone_admin(zone_id, auth.uid()));
CREATE POLICY "Platform admins view all contacts" ON public.zone_contacts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.zone_deal_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zone members view stages" ON public.zone_deal_stages FOR SELECT USING (public.is_zone_member(zone_id, auth.uid()));
CREATE POLICY "Zone admins manage stages" ON public.zone_deal_stages FOR ALL USING (public.is_zone_admin(zone_id, auth.uid()));
CREATE POLICY "Platform admins view all stages" ON public.zone_deal_stages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.zone_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zone members view deals" ON public.zone_deals FOR SELECT USING (public.is_zone_member(zone_id, auth.uid()));
CREATE POLICY "Zone members create deals" ON public.zone_deals FOR INSERT WITH CHECK (public.is_zone_member(zone_id, auth.uid()));
CREATE POLICY "Zone members update deals" ON public.zone_deals FOR UPDATE USING (public.is_zone_member(zone_id, auth.uid()));
CREATE POLICY "Zone admins delete deals" ON public.zone_deals FOR DELETE USING (public.is_zone_admin(zone_id, auth.uid()));
CREATE POLICY "Platform admins view all deals" ON public.zone_deals FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.zone_deal_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zone members view activities" ON public.zone_deal_activities FOR SELECT USING (public.is_zone_member(zone_id, auth.uid()));
CREATE POLICY "Zone members create activities" ON public.zone_deal_activities FOR INSERT WITH CHECK (public.is_zone_member(zone_id, auth.uid()));
CREATE POLICY "Platform admins view all activities" ON public.zone_deal_activities FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.zone_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zone members view invoices" ON public.zone_invoices FOR SELECT USING (public.is_zone_member(zone_id, auth.uid()));
CREATE POLICY "Zone admins manage invoices" ON public.zone_invoices FOR ALL USING (public.is_zone_admin(zone_id, auth.uid()));
CREATE POLICY "Platform admins view all invoices" ON public.zone_invoices FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.zone_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zone members view audit log" ON public.zone_audit_log FOR SELECT USING (public.is_zone_member(zone_id, auth.uid()));
CREATE POLICY "Platform admins view all audit" ON public.zone_audit_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.create_zone(
  p_name text, p_slug text,
  p_plan_code text DEFAULT 'business_5_m',
  p_plan_cycle text DEFAULT 'monthly'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_zone_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  INSERT INTO public.zones (name, slug, owner_user_id, plan_code, plan_cycle, current_period_end)
  VALUES (p_name, p_slug, v_user_id, p_plan_code, p_plan_cycle, now() + interval '30 days')
  RETURNING id INTO v_zone_id;

  INSERT INTO public.zone_members (zone_id, user_id, role, status)
  VALUES (v_zone_id, v_user_id, 'owner', 'active');

  INSERT INTO public.zone_deal_stages (zone_id, name, color, order_index, is_default) VALUES
    (v_zone_id, 'Новый', '#6366f1', 0, true),
    (v_zone_id, 'В работе', '#f59e0b', 1, false),
    (v_zone_id, 'Предложение', '#3b82f6', 2, false),
    (v_zone_id, 'Согласование', '#8b5cf6', 3, false),
    (v_zone_id, 'Оплачен', '#10b981', 4, false),
    (v_zone_id, 'Закрыт', '#6b7280', 5, false);

  INSERT INTO public.zone_subscriptions (zone_id, plan_code, plan_cycle, status, current_period_end)
  VALUES (v_zone_id, p_plan_code, p_plan_cycle, 'active', now() + interval '30 days');

  INSERT INTO public.zone_audit_log (zone_id, actor_user_id, action, entity_type, entity_id)
  VALUES (v_zone_id, v_user_id, 'zone_created', 'zone', v_zone_id);

  RETURN v_zone_id;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON public.zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_zone_contacts_updated_at BEFORE UPDATE ON public.zone_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_zone_deals_updated_at BEFORE UPDATE ON public.zone_deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_zone_subs_updated_at BEFORE UPDATE ON public.zone_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
