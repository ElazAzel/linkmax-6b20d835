
CREATE TABLE public.zone_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.zone_invoices(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zone_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members view invoice items"
  ON public.zone_invoice_items FOR SELECT
  TO authenticated
  USING (is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone admins manage invoice items"
  ON public.zone_invoice_items FOR ALL
  TO authenticated
  USING (is_zone_admin(zone_id, auth.uid()))
  WITH CHECK (is_zone_admin(zone_id, auth.uid()));

CREATE INDEX idx_zone_invoice_items_invoice ON public.zone_invoice_items(invoice_id);
CREATE INDEX idx_zone_invoice_items_zone ON public.zone_invoice_items(zone_id);
