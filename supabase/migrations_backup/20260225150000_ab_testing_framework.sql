-- Migration: A/B Testing Framework
-- Description: Adds tables for experiments and block variations to support A/B testing features.

-- Experiments table
CREATE TABLE IF NOT EXISTS public.experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'ended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    winning_variant_id UUID,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Variant / Variation table
CREATE TABLE IF NOT EXISTS public.experiment_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE CASCADE NOT NULL,
    base_block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE NOT NULL,
    variant_label TEXT NOT NULL, -- 'A', 'B', etc.
    block_data JSONB NOT NULL, -- stores the full block properties for this variation
    traffic_weight INTEGER DEFAULT 50 CHECK (traffic_weight >= 0 AND traffic_weight <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_experiments_page_id ON public.experiments(page_id);
CREATE INDEX IF NOT EXISTS idx_experiment_variants_experiment_id ON public.experiment_variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_variants_base_block_id ON public.experiment_variants(base_block_id);

-- Enable RLS
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experiments
CREATE POLICY "Users can manage their own experiments"
    ON public.experiments FOR ALL
    USING (EXISTS (SELECT 1 FROM public.pages WHERE id = experiments.page_id AND user_id = auth.uid()));

CREATE POLICY "Public can view active experiments"
    ON public.experiments FOR SELECT
    USING (status = 'running');

-- RLS Policies for experiment_variants
CREATE POLICY "Users can manage their own experiment variants"
    ON public.experiment_variants FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.experiments e 
        JOIN public.pages p ON e.page_id = p.id 
        WHERE e.id = experiment_variants.experiment_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Public can view active experiment variants"
    ON public.experiment_variants FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.experiments e 
        WHERE e.id = experiment_variants.experiment_id AND e.status = 'running'
    ));

-- Triggers for updated_at
CREATE TRIGGER update_experiments_updated_at
    BEFORE UPDATE ON public.experiments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
