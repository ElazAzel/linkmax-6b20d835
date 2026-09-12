-- ============================================================
-- BUSINESS ZONES: SCHEMA FIX & MISSING TABLES
-- ============================================================

-- 1) Soft-delete columns on existing tables -------------------
ALTER TABLE public.zone_deals     ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;
ALTER TABLE public.zone_tasks     ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;
ALTER TABLE public.zone_invoices  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;
ALTER TABLE public.zone_documents ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;
ALTER TABLE public.zone_contacts  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_zone_deals_active     ON public.zone_deals     (zone_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_zone_tasks_active     ON public.zone_tasks     (zone_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_zone_invoices_active  ON public.zone_invoices  (zone_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_zone_documents_active ON public.zone_documents (zone_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_zone_contacts_active  ON public.zone_contacts  (zone_id, created_at DESC) WHERE deleted_at IS NULL;

-- 2) zone_task_checklist --------------------------------------
CREATE TABLE IF NOT EXISTS public.zone_task_checklist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES public.zone_tasks(id) ON DELETE CASCADE,
  zone_id     uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  title       text NOT NULL,
  is_done     boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_zone_task_checklist_task ON public.zone_task_checklist (task_id, order_index);
CREATE INDEX IF NOT EXISTS idx_zone_task_checklist_zone ON public.zone_task_checklist (zone_id);

ALTER TABLE public.zone_task_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Zone members view checklist" ON public.zone_task_checklist;
CREATE POLICY "Zone members view checklist"
  ON public.zone_task_checklist FOR SELECT
  USING (public.is_zone_member(zone_id, auth.uid()));

DROP POLICY IF EXISTS "Zone members insert checklist" ON public.zone_task_checklist;
CREATE POLICY "Zone members insert checklist"
  ON public.zone_task_checklist FOR INSERT
  WITH CHECK (public.is_zone_member(zone_id, auth.uid()));

DROP POLICY IF EXISTS "Zone members update checklist" ON public.zone_task_checklist;
CREATE POLICY "Zone members update checklist"
  ON public.zone_task_checklist FOR UPDATE
  USING (public.is_zone_member(zone_id, auth.uid()));

DROP POLICY IF EXISTS "Zone members delete checklist" ON public.zone_task_checklist;
CREATE POLICY "Zone members delete checklist"
  ON public.zone_task_checklist FOR DELETE
  USING (public.is_zone_member(zone_id, auth.uid()));

-- 3) zone_task_comments ---------------------------------------
CREATE TABLE IF NOT EXISTS public.zone_task_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES public.zone_tasks(id) ON DELETE CASCADE,
  zone_id    uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_zone_task_comments_task ON public.zone_task_comments (task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_zone_task_comments_zone ON public.zone_task_comments (zone_id);

ALTER TABLE public.zone_task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Zone members view task comments" ON public.zone_task_comments;
CREATE POLICY "Zone members view task comments"
  ON public.zone_task_comments FOR SELECT
  USING (public.is_zone_member(zone_id, auth.uid()));

DROP POLICY IF EXISTS "Zone members insert task comments" ON public.zone_task_comments;
CREATE POLICY "Zone members insert task comments"
  ON public.zone_task_comments FOR INSERT
  WITH CHECK (public.is_zone_member(zone_id, auth.uid()) AND user_id = auth.uid());

DROP POLICY IF EXISTS "Authors update own task comments" ON public.zone_task_comments;
CREATE POLICY "Authors update own task comments"
  ON public.zone_task_comments FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authors or admins delete task comments" ON public.zone_task_comments;
CREATE POLICY "Authors or admins delete task comments"
  ON public.zone_task_comments FOR DELETE
  USING (user_id = auth.uid() OR public.is_zone_admin(zone_id, auth.uid()));

DROP TRIGGER IF EXISTS update_zone_task_comments_updated_at ON public.zone_task_comments;
CREATE TRIGGER update_zone_task_comments_updated_at
  BEFORE UPDATE ON public.zone_task_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) zone_deal_products ---------------------------------------
CREATE TABLE IF NOT EXISTS public.zone_deal_products (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id    uuid NOT NULL REFERENCES public.zone_deals(id) ON DELETE CASCADE,
  zone_id    uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.zone_products(id) ON DELETE SET NULL,
  quantity   numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  subtotal   numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_zone_deal_products_deal ON public.zone_deal_products (deal_id);
CREATE INDEX IF NOT EXISTS idx_zone_deal_products_zone ON public.zone_deal_products (zone_id);

ALTER TABLE public.zone_deal_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Zone members view deal products" ON public.zone_deal_products;
CREATE POLICY "Zone members view deal products"
  ON public.zone_deal_products FOR SELECT
  USING (public.is_zone_member(zone_id, auth.uid()));

DROP POLICY IF EXISTS "Zone members manage deal products" ON public.zone_deal_products;
CREATE POLICY "Zone members manage deal products"
  ON public.zone_deal_products FOR ALL
  USING (public.is_zone_member(zone_id, auth.uid()))
  WITH CHECK (public.is_zone_member(zone_id, auth.uid()));

-- 5) zone_resources -------------------------------------------
CREATE TABLE IF NOT EXISTS public.zone_resources (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id    uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  name       text NOT NULL,
  type       text NOT NULL DEFAULT 'general',
  color      text,
  capacity   integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_zone_resources_zone ON public.zone_resources (zone_id);

ALTER TABLE public.zone_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Zone members view resources" ON public.zone_resources;
CREATE POLICY "Zone members view resources"
  ON public.zone_resources FOR SELECT
  USING (public.is_zone_member(zone_id, auth.uid()));

DROP POLICY IF EXISTS "Zone admins manage resources" ON public.zone_resources;
CREATE POLICY "Zone admins manage resources"
  ON public.zone_resources FOR ALL
  USING (public.is_zone_admin(zone_id, auth.uid()))
  WITH CHECK (public.is_zone_admin(zone_id, auth.uid()));

DROP TRIGGER IF EXISTS update_zone_resources_updated_at ON public.zone_resources;
CREATE TRIGGER update_zone_resources_updated_at
  BEFORE UPDATE ON public.zone_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
