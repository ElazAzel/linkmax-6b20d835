-- ============================================
-- CRM Enhancements: contact fields, notes, products, invoice items
-- ============================================

-- 1. Extend zone_contacts with CRM fields
ALTER TABLE public.zone_contacts
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_zone_contacts_company ON public.zone_contacts(company);

-- 2. Contact notes / activity timeline
CREATE TABLE IF NOT EXISTS public.zone_contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.zone_contacts(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'note', -- note, call, email, meeting, task
  content text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_zone_contact_notes_contact ON public.zone_contact_notes(contact_id);
CREATE INDEX idx_zone_contact_notes_zone ON public.zone_contact_notes(zone_id);
CREATE INDEX idx_zone_contact_notes_type ON public.zone_contact_notes(type);

ALTER TABLE public.zone_contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members view contact notes"
  ON public.zone_contact_notes FOR SELECT
  USING (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone members create contact notes"
  ON public.zone_contact_notes FOR INSERT
  WITH CHECK (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone members update own notes"
  ON public.zone_contact_notes FOR UPDATE
  USING (created_by = auth.uid() OR public.is_zone_admin(zone_id, auth.uid()));

CREATE POLICY "Zone admins delete notes"
  ON public.zone_contact_notes FOR DELETE
  USING (created_by = auth.uid() OR public.is_zone_admin(zone_id, auth.uid()));

-- 3. Products / Services catalog
CREATE TABLE IF NOT EXISTS public.zone_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  unit_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KZT',
  unit text DEFAULT 'шт', -- шт, час, услуга
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_zone_products_zone ON public.zone_products(zone_id);

ALTER TABLE public.zone_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members view products"
  ON public.zone_products FOR SELECT
  USING (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone admins manage products"
  ON public.zone_products FOR ALL
  USING (public.is_zone_admin(zone_id, auth.uid()));

CREATE TRIGGER update_zone_products_updated_at
  BEFORE UPDATE ON public.zone_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Invoice line items
CREATE TABLE IF NOT EXISTS public.zone_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.zone_invoices(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.zone_products(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_zone_invoice_items_invoice ON public.zone_invoice_items(invoice_id);
CREATE INDEX idx_zone_invoice_items_zone ON public.zone_invoice_items(zone_id);

ALTER TABLE public.zone_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members view invoice items"
  ON public.zone_invoice_items FOR SELECT
  USING (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone admins manage invoice items"
  ON public.zone_invoice_items FOR ALL
  USING (public.is_zone_admin(zone_id, auth.uid()));

-- 5. Add invoice_number to zone_invoices (auto-increment per zone)
ALTER TABLE public.zone_invoices
  ADD COLUMN IF NOT EXISTS invoice_number integer;

-- Function to auto-generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_next integer;
BEGIN
  SELECT COALESCE(MAX(invoice_number), 0) + 1
  INTO v_next
  FROM public.zone_invoices
  WHERE zone_id = NEW.zone_id;

  NEW.invoice_number := v_next;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_zone_invoice_number
  BEFORE INSERT ON public.zone_invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION public.generate_invoice_number();

-- 6. Deal products (line items for deals)
CREATE TABLE IF NOT EXISTS public.zone_deal_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.zone_deals(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.zone_products(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_zone_deal_products_deal ON public.zone_deal_products(deal_id);
CREATE INDEX idx_zone_deal_products_zone ON public.zone_deal_products(zone_id);

ALTER TABLE public.zone_deal_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members view deal products"
  ON public.zone_deal_products FOR SELECT
  USING (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone members manage deal products"
  ON public.zone_deal_products FOR ALL
  USING (public.is_zone_member(zone_id, auth.uid()));

-- 7. Task checklists
CREATE TABLE IF NOT EXISTS public.zone_task_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.zone_tasks(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_zone_task_checklist_task ON public.zone_task_checklist(task_id);

ALTER TABLE public.zone_task_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members view task checklist"
  ON public.zone_task_checklist FOR SELECT
  USING (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone members manage task checklist"
  ON public.zone_task_checklist FOR ALL
  USING (public.is_zone_member(zone_id, auth.uid()));
