-- Drop old constraint and add new one with additional event types
ALTER TABLE public.analytics DROP CONSTRAINT IF EXISTS analytics_event_type_check;

ALTER TABLE public.analytics ADD CONSTRAINT analytics_event_type_check 
CHECK (event_type = ANY (ARRAY['view'::text, 'click'::text, 'share'::text, 'heatmap_clicks'::text, 'heatmap_scroll'::text]));