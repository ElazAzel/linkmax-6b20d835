DROP POLICY IF EXISTS "Public read active smart links" ON public.smart_links;
DROP POLICY IF EXISTS "Users read own smart links" ON public.smart_links;
CREATE POLICY "Users read own smart links" ON public.smart_links FOR SELECT TO authenticated USING (auth.uid() = user_id);