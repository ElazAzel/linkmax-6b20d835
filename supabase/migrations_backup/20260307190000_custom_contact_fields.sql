-- Migration: Custom Fields for Contacts

-- 1. Create zone_contact_fields table
CREATE TABLE IF NOT EXISTS public.zone_contact_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    zone_id TEXT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'boolean')),
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_zone_contact_fields_zone_id ON public.zone_contact_fields(zone_id);

-- Add custom_fields to zone_contacts
ALTER TABLE public.zone_contacts
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- RLS for zone_contact_fields
ALTER TABLE public.zone_contact_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zone members can view contact fields"
    ON public.zone_contact_fields FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM zone_members
            WHERE zone_members.zone_id = zone_contact_fields.zone_id
            AND zone_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Zone admins can insert contact fields"
    ON public.zone_contact_fields FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM zone_members
            WHERE zone_members.zone_id = zone_contact_fields.zone_id
            AND zone_members.user_id = auth.uid()
            AND zone_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Zone admins can update contact fields"
    ON public.zone_contact_fields FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM zone_members
            WHERE zone_members.zone_id = zone_contact_fields.zone_id
            AND zone_members.user_id = auth.uid()
            AND zone_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Zone admins can delete contact fields"
    ON public.zone_contact_fields FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM zone_members
            WHERE zone_members.zone_id = zone_contact_fields.zone_id
            AND zone_members.user_id = auth.uid()
            AND zone_members.role IN ('owner', 'admin')
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_zone_contact_fields_updated_at
    BEFORE UPDATE ON public.zone_contact_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
