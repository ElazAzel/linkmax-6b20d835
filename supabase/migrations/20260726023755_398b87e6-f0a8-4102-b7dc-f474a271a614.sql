
DROP POLICY IF EXISTS "Users can view public templates" ON public.user_templates;

CREATE POLICY "Users can view free public templates"
ON public.user_templates FOR SELECT
USING (
  is_public = true
  AND is_for_sale = false
);

CREATE POLICY "Buyers can view purchased paid templates"
ON public.user_templates FOR SELECT
TO authenticated
USING (
  is_public = true
  AND is_for_sale = true
  AND EXISTS (
    SELECT 1 FROM public.template_purchases tp
    WHERE tp.template_id = user_templates.id
      AND tp.buyer_id = auth.uid()
  )
);
