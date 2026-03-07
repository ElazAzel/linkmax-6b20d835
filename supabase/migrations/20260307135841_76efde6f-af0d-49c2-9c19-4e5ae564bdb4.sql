-- Create table for zone document templates
CREATE TABLE IF NOT EXISTS public.zone_document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  content_html text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create table for generated zone documents
CREATE TABLE IF NOT EXISTS public.zone_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.zone_document_templates(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.zone_contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.zone_deals(id) ON DELETE SET NULL,
  title text NOT NULL,
  document_number text,
  file_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','signed','cancelled')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_zone_document_templates_zone_id ON public.zone_document_templates(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_document_templates_name ON public.zone_document_templates(zone_id, name);
CREATE INDEX IF NOT EXISTS idx_zone_documents_zone_id_created_at ON public.zone_documents(zone_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zone_documents_template_id ON public.zone_documents(template_id);
CREATE INDEX IF NOT EXISTS idx_zone_documents_contact_id ON public.zone_documents(contact_id);
CREATE INDEX IF NOT EXISTS idx_zone_documents_deal_id ON public.zone_documents(deal_id);

-- Enable RLS
ALTER TABLE public.zone_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies: templates
DROP POLICY IF EXISTS "Members can view zone document templates" ON public.zone_document_templates;
CREATE POLICY "Members can view zone document templates"
ON public.zone_document_templates
FOR SELECT
USING (public.is_zone_member(zone_id, auth.uid()));

DROP POLICY IF EXISTS "Admins can insert zone document templates" ON public.zone_document_templates;
CREATE POLICY "Admins can insert zone document templates"
ON public.zone_document_templates
FOR INSERT
WITH CHECK (public.is_zone_admin(zone_id, auth.uid()));

DROP POLICY IF EXISTS "Admins can update zone document templates" ON public.zone_document_templates;
CREATE POLICY "Admins can update zone document templates"
ON public.zone_document_templates
FOR UPDATE
USING (public.is_zone_admin(zone_id, auth.uid()))
WITH CHECK (public.is_zone_admin(zone_id, auth.uid()));

DROP POLICY IF EXISTS "Admins can delete zone document templates" ON public.zone_document_templates;
CREATE POLICY "Admins can delete zone document templates"
ON public.zone_document_templates
FOR DELETE
USING (public.is_zone_admin(zone_id, auth.uid()));

-- RLS policies: documents
DROP POLICY IF EXISTS "Members can view zone documents" ON public.zone_documents;
CREATE POLICY "Members can view zone documents"
ON public.zone_documents
FOR SELECT
USING (public.is_zone_member(zone_id, auth.uid()));

DROP POLICY IF EXISTS "Members can insert zone documents" ON public.zone_documents;
CREATE POLICY "Members can insert zone documents"
ON public.zone_documents
FOR INSERT
WITH CHECK (
  public.is_zone_member(zone_id, auth.uid())
  AND (created_by IS NULL OR created_by = auth.uid())
);

DROP POLICY IF EXISTS "Members can update zone documents" ON public.zone_documents;
CREATE POLICY "Members can update zone documents"
ON public.zone_documents
FOR UPDATE
USING (public.is_zone_member(zone_id, auth.uid()))
WITH CHECK (public.is_zone_member(zone_id, auth.uid()));

DROP POLICY IF EXISTS "Members can delete zone documents" ON public.zone_documents;
CREATE POLICY "Members can delete zone documents"
ON public.zone_documents
FOR DELETE
USING (public.is_zone_member(zone_id, auth.uid()));