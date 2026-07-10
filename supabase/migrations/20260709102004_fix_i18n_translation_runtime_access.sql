ALTER TABLE public.i18n_translations ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.i18n_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.i18n_translations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.i18n_translations TO service_role;

DROP POLICY IF EXISTS "Public read access to translations" ON public.i18n_translations;
DROP POLICY IF EXISTS "Anyone can read translations" ON public.i18n_translations;
DROP POLICY IF EXISTS "Authenticated users can manage translations" ON public.i18n_translations;
DROP POLICY IF EXISTS "Admins can manage translations" ON public.i18n_translations;

CREATE POLICY "Public read access to translations"
  ON public.i18n_translations
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage translations"
  ON public.i18n_translations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
