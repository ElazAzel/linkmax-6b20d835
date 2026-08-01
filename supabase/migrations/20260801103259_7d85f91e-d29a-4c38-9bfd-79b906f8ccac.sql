GRANT SELECT ON public.i18n_translations TO anon, authenticated;
GRANT ALL ON public.i18n_translations TO service_role;
DROP POLICY IF EXISTS "i18n_translations_public_read" ON public.i18n_translations;
CREATE POLICY "i18n_translations_public_read"
ON public.i18n_translations
FOR SELECT
TO anon, authenticated
USING (true);