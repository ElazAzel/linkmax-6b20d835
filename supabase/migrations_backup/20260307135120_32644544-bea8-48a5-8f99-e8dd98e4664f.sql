
-- Create zone_pipelines table
CREATE TABLE IF NOT EXISTS public.zone_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zone_pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members can view pipelines" ON public.zone_pipelines
  FOR SELECT TO authenticated USING (is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone admins can manage pipelines" ON public.zone_pipelines
  FOR ALL TO authenticated
  USING (is_zone_admin(zone_id, auth.uid()))
  WITH CHECK (is_zone_admin(zone_id, auth.uid()));

-- Create zone_deal_fields table
CREATE TABLE IF NOT EXISTS public.zone_deal_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  options text[] NULL,
  is_required boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zone_deal_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members can view deal fields" ON public.zone_deal_fields
  FOR SELECT TO authenticated USING (is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone admins can manage deal fields" ON public.zone_deal_fields
  FOR ALL TO authenticated
  USING (is_zone_admin(zone_id, auth.uid()))
  WITH CHECK (is_zone_admin(zone_id, auth.uid()));

-- Create zone_contact_fields table
CREATE TABLE IF NOT EXISTS public.zone_contact_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  is_required boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zone_contact_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members can view contact fields" ON public.zone_contact_fields
  FOR SELECT TO authenticated USING (is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone admins can manage contact fields" ON public.zone_contact_fields
  FOR ALL TO authenticated
  USING (is_zone_admin(zone_id, auth.uid()))
  WITH CHECK (is_zone_admin(zone_id, auth.uid()));

-- Create zone_products table
CREATE TABLE IF NOT EXISTS public.zone_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KZT',
  unit text NOT NULL DEFAULT 'шт',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zone_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members can view products" ON public.zone_products
  FOR SELECT TO authenticated USING (is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone admins can manage products" ON public.zone_products
  FOR ALL TO authenticated
  USING (is_zone_admin(zone_id, auth.uid()))
  WITH CHECK (is_zone_admin(zone_id, auth.uid()));

-- Add pipeline_id to zone_deals if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'zone_deals' AND column_name = 'pipeline_id') THEN
    ALTER TABLE public.zone_deals ADD COLUMN pipeline_id uuid REFERENCES public.zone_pipelines(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'zone_deals' AND column_name = 'custom_fields') THEN
    ALTER TABLE public.zone_deals ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'zone_contacts' AND column_name = 'custom_fields') THEN
    ALTER TABLE public.zone_contacts ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'zone_contacts' AND column_name = 'company') THEN
    ALTER TABLE public.zone_contacts ADD COLUMN company text NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'zone_contacts' AND column_name = 'position') THEN
    ALTER TABLE public.zone_contacts ADD COLUMN position text NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'zone_contacts' AND column_name = 'address') THEN
    ALTER TABLE public.zone_contacts ADD COLUMN address text NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'zone_contacts' AND column_name = 'source') THEN
    ALTER TABLE public.zone_contacts ADD COLUMN source text NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'zone_contacts' AND column_name = 'notes') THEN
    ALTER TABLE public.zone_contacts ADD COLUMN notes text NULL;
  END IF;
END $$;
