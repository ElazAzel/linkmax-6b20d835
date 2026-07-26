-- Add pipeline_id to zone_deal_stages so stages can belong to a specific pipeline
ALTER TABLE public.zone_deal_stages
  ADD COLUMN IF NOT EXISTS pipeline_id uuid REFERENCES public.zone_pipelines(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_zone_deal_stages_pipeline ON public.zone_deal_stages(pipeline_id);

-- Backfill: for zones that have a default pipeline, attach orphan stages to it
UPDATE public.zone_deal_stages s
SET pipeline_id = p.id
FROM public.zone_pipelines p
WHERE s.pipeline_id IS NULL
  AND p.zone_id = s.zone_id
  AND p.is_default = true;