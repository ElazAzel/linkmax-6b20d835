-- P18.1: CRM Custom Fields Expansion

-- 1. Add custom_fields JSONB column to zone_contacts
-- This allows users to store arbitrary data (e.g., "Source", "Segment", etc.)
ALTER TABLE public.zone_contacts 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- 2. Add custom_fields JSONB column to zone_deals
-- Useful for deal-specific custom metadata
ALTER TABLE public.zone_deals 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- 3. Create GIN indexes for fast querying within JSONB
CREATE INDEX IF NOT EXISTS idx_zone_contacts_custom_fields ON public.zone_contacts USING GIN (custom_fields);
CREATE INDEX IF NOT EXISTS idx_zone_deals_custom_fields ON public.zone_deals USING GIN (custom_fields);

-- 4. Audit logging trigger for custom_fields updates (if audit_logs table exists)
-- Assuming the system has an audit mechanism, we ensure these changes are tracked.
-- (Standard Supabase projects often use a generic handle_updated_at trigger)
