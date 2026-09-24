-- Utility widgets are part of the seeded catalog.
ALTER TABLE public.widget_templates
  DROP CONSTRAINT IF EXISTS widget_templates_category_check;

ALTER TABLE public.widget_templates
  ADD CONSTRAINT widget_templates_category_check
  CHECK (category IN ('games', 'calculators', 'timers', 'engagement', 'business', 'social', 'utility'));
