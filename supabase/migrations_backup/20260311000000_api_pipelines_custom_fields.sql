-- Migration: Multiple Pipelines & Custom Fields + Public API Keys
-- Adds support for multiple deal pipelines, JSONB custom fields, and API authentication.

--------------------------------------------------------------------------------
-- 1. PUBLIC API KEYS (For external Zapier/Make integrations)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g. "Zapier Integration"
  key_hint text NOT NULL, -- e.g. "key_...a1b2" (last 4 chars) for display
  hashed_key text NOT NULL UNIQUE, -- SHA256 of the actual secret key
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- ensure a user doesn't have 1000 keys
  CONSTRAINT max_keys_per_user_check CHECK (
    (SELECT count(*) FROM user_api_keys WHERE user_id = auth.uid()) <= 10
  )
);

-- RLS: Only the owner can see their own API keys (and only the hints, not hashes)
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own API keys" ON user_api_keys
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own API keys" ON user_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own API keys" ON user_api_keys
  FOR DELETE USING (auth.uid() = user_id);


--------------------------------------------------------------------------------
-- 2. MULTIPLE PIPELINES ( zone_pipelines )
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zone_pipelines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  "order" integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add pipeline_id to stages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zone_deal_stages' AND column_name = 'pipeline_id'
    ) THEN
        ALTER TABLE public.zone_deal_stages ADD COLUMN pipeline_id uuid REFERENCES public.zone_pipelines(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add pipeline_id to deals
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zone_deals' AND column_name = 'pipeline_id'
    ) THEN
        ALTER TABLE public.zone_deals ADD COLUMN pipeline_id uuid REFERENCES public.zone_pipelines(id) ON DELETE CASCADE;
    END IF;
END $$;


-- Forward Migration: Ensure all existing zones have a Default Pipeline
DO $$
DECLARE
  v_zone RECORD;
  v_pipeline_id uuid;
BEGIN
  FOR v_zone IN SELECT id FROM public.zones
  LOOP
    -- Check if it already has a pipeline
    IF NOT EXISTS (SELECT 1 FROM public.zone_pipelines WHERE zone_id = v_zone.id) THEN
      -- Insert a default pipeline
      INSERT INTO public.zone_pipelines (zone_id, name)
      VALUES (v_zone.id, 'Default Pipeline')
      RETURNING id INTO v_pipeline_id;

      -- Update all existing stages for this zone to belong to the new default pipeline
      UPDATE public.zone_deal_stages
      SET pipeline_id = v_pipeline_id
      WHERE zone_id = v_zone.id AND pipeline_id IS NULL;

      -- Update all existing deals
      UPDATE public.zone_deals
      SET pipeline_id = v_pipeline_id
      WHERE zone_id = v_zone.id AND pipeline_id IS NULL;
    END IF;
  END LOOP;
END $$;

-- Now that data is migrated, make pipeline_id NOT NULL where applicable (optional, but good for data integrity)
-- Leaving it nullable for backward compatibility during rollout if needed, but best practice is NOT NULL.
-- ALTER TABLE public.zone_deal_stages ALTER COLUMN pipeline_id SET NOT NULL;
-- ALTER TABLE public.zone_deals ALTER COLUMN pipeline_id SET NOT NULL;

-- RLS for Pipelines
ALTER TABLE zone_pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zone members can view pipelines" ON zone_pipelines
  FOR SELECT USING (public.is_zone_member(zone_id));
CREATE POLICY "Zone admins can insert pipelines" ON zone_pipelines
  FOR INSERT WITH CHECK (public.is_zone_admin(zone_id));
CREATE POLICY "Zone admins can update pipelines" ON zone_pipelines
  FOR UPDATE USING (public.is_zone_admin(zone_id));
CREATE POLICY "Zone admins can delete pipelines" ON zone_pipelines
  FOR DELETE USING (public.is_zone_admin(zone_id));


--------------------------------------------------------------------------------
-- 3. CUSTOM FIELDS (JSONB schemas)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zone_custom_fields (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('deal', 'contact')),
  name text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'boolean')),
  options jsonb, -- e.g. ["Option A", "Option B"] for select fields
  is_required boolean DEFAULT false,
  "order" integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS for Custom Fields Definition
ALTER TABLE zone_custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zone members can view custom fields" ON zone_custom_fields
  FOR SELECT USING (public.is_zone_member(zone_id));
CREATE POLICY "Zone admins can manage custom fields" ON zone_custom_fields
  FOR ALL USING (public.is_zone_admin(zone_id));

-- Add JSONB columns for actual data storage to Deals and Contacts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zone_deals' AND column_name = 'custom_fields'
    ) THEN
        ALTER TABLE public.zone_deals ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zone_contacts' AND column_name = 'custom_fields'
    ) THEN
        ALTER TABLE public.zone_contacts ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create an index to query the JSONB fields efficiently
CREATE INDEX IF NOT EXISTS idx_zone_deals_custom_fields ON public.zone_deals USING GIN (custom_fields);
CREATE INDEX IF NOT EXISTS idx_zone_contacts_custom_fields ON public.zone_contacts USING GIN (custom_fields);
