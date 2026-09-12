
-- Fix templates RLS: restrict write access to admins only
DROP POLICY IF EXISTS "Authenticated users can manage templates" ON public.templates;

-- Allow anyone to read public templates
CREATE POLICY "Anyone can view public templates"
  ON public.templates
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete templates
CREATE POLICY "Admins can insert templates"
  ON public.templates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update templates"
  ON public.templates
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete templates"
  ON public.templates
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
