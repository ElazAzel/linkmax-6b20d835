-- Migration for multiple pipelines support in business zones

-- 1. Create zone_pipelines table
CREATE TABLE IF NOT EXISTS public.zone_pipelines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for zone_pipelines
ALTER TABLE public.zone_pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pipelines in their zones" 
ON public.zone_pipelines FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.zone_members
        WHERE zone_id = public.zone_pipelines.zone_id
        AND user_id = auth.uid()
    )
    OR zone_id IN (
        SELECT id FROM public.zones WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage pipelines in their zones" 
ON public.zone_pipelines FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.zone_members
        WHERE zone_id = public.zone_pipelines.zone_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    OR zone_id IN (
        SELECT id FROM public.zones WHERE owner_id = auth.uid()
    )
);

-- 2. Update zone_deal_stages
ALTER TABLE public.zone_deal_stages 
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.zone_pipelines(id) ON DELETE CASCADE;

-- Insert a default pipeline for existing zones and link stages
DO $$
DECLARE
    z RECORD;
    new_pipeline_id UUID;
BEGIN
    FOR z IN SELECT id FROM public.zones LOOP
        -- Check if zone already has stages
        IF EXISTS (SELECT 1 FROM public.zone_deal_stages WHERE zone_id = z.id) THEN
            -- Check if we already created a default pipeline for this zone
            SELECT id INTO new_pipeline_id FROM public.zone_pipelines WHERE zone_id = z.id AND is_default = true LIMIT 1;
            
            IF new_pipeline_id IS NULL THEN
                INSERT INTO public.zone_pipelines (zone_id, name, is_default)
                VALUES (z.id, 'Main Pipeline', true)
                RETURNING id INTO new_pipeline_id;
            END IF;

            -- Update stages that don't have a pipeline_id
            UPDATE public.zone_deal_stages 
            SET pipeline_id = new_pipeline_id 
            WHERE zone_id = z.id AND pipeline_id IS NULL;
        END IF;
    END LOOP;
END $$;

-- Now it's safe to enforce that stages belong to a pipeline (mostly) but for backward compatibility and transition we'll just index it.
CREATE INDEX IF NOT EXISTS idx_zone_deal_stages_pipeline_id ON public.zone_deal_stages(pipeline_id);

-- 3. Update zone_deals
ALTER TABLE public.zone_deals
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.zone_pipelines(id) ON DELETE SET NULL;

-- Link existing deals to the default pipeline of their zone
DO $$
DECLARE
    z RECORD;
    def_pipeline_id UUID;
BEGIN
    FOR z IN SELECT id FROM public.zones LOOP
        SELECT id INTO def_pipeline_id FROM public.zone_pipelines WHERE zone_id = z.id AND is_default = true LIMIT 1;
        
        IF def_pipeline_id IS NOT NULL THEN
            UPDATE public.zone_deals 
            SET pipeline_id = def_pipeline_id 
            WHERE zone_id = z.id AND pipeline_id IS NULL;
        END IF;
    END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_zone_deals_pipeline_id ON public.zone_deals(pipeline_id);

-- 4. Automatically create a default pipeline for new zones
CREATE OR REPLACE FUNCTION public.handle_new_zone_pipeline()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.zone_pipelines (zone_id, name, is_default)
    VALUES (NEW.id, 'Main Pipeline', true);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger (if it doesn't already exist we need to be careful)
DROP TRIGGER IF EXISTS on_zone_created_create_pipeline ON public.zones;
CREATE TRIGGER on_zone_created_create_pipeline
    AFTER INSERT ON public.zones
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_zone_pipeline();

-- Also ensure that we create default stages for the new pipeline when a new zone is created
-- (This requires updating the existing trigger handle_new_zone array, or doing it here)
-- For now, the application logic usually creates default stages, so we just supply the pipeline_id. 
