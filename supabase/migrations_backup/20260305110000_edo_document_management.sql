-- ==========================================
-- EDO / Document Management System (Phase 1)
-- ==========================================

-- 1. Create Documents Settings/Templates
CREATE TABLE IF NOT EXISTS public.zone_document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    content_html TEXT NOT NULL, -- HTML template with variables like {{deal.amount}}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Generated Documents Table
CREATE TABLE IF NOT EXISTS public.zone_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.zone_deals(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.zone_contacts(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.zone_document_templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    document_number TEXT,
    file_url TEXT, -- Path to stored PDF in Supabase Storage
    status TEXT NOT NULL DEFAULT 'draft', -- draft, signed, sent, archived
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_zone_document_templates_zone_id ON public.zone_document_templates(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_documents_zone_id ON public.zone_documents(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_documents_deal_id ON public.zone_documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_zone_documents_contact_id ON public.zone_documents(contact_id);

-- RLS Policies for Document Templates
ALTER TABLE public.zone_document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members can view document templates"
    ON public.zone_document_templates FOR SELECT
    USING (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone members can manage document templates"
    ON public.zone_document_templates FOR ALL
    USING (public.is_zone_member(zone_id, auth.uid()))
    WITH CHECK (public.is_zone_member(zone_id, auth.uid()));

-- RLS Policies for Documents
ALTER TABLE public.zone_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members can view documents"
    ON public.zone_documents FOR SELECT
    USING (public.is_zone_member(zone_id, auth.uid()));

CREATE POLICY "Zone members can manage documents"
    ON public.zone_documents FOR ALL
    USING (public.is_zone_member(zone_id, auth.uid()))
    WITH CHECK (public.is_zone_member(zone_id, auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_zone_document_templates_updated_at
    BEFORE UPDATE ON public.zone_document_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_zone_documents_updated_at
    BEFORE UPDATE ON public.zone_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Storage Bucket for PDFs (assuming a bucket named 'documents' exists)
-- We insert a bucket if it doesn't exist.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('zone_documents', 'zone_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Zone members can access their documents" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'zone_documents' AND (select is_zone_member((storage.foldername(name))[1]::uuid, auth.uid())));
    
CREATE POLICY "Zone members can upload documents" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'zone_documents' AND (select is_zone_member((storage.foldername(name))[1]::uuid, auth.uid())));
