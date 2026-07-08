
DO $$
DECLARE
  r RECORD;
  has_public_select BOOLEAN;
BEGIN
  FOR r IN
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.role_table_grants g
        WHERE g.table_schema = 'public'
          AND g.table_name   = c.relname
          AND g.grantee IN ('authenticated','anon','service_role')
      )
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', r.table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', r.table_name);

    -- Grant SELECT to anon only when the table has at least one SELECT policy that permits anon (no auth.uid() reference).
    SELECT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public'
        AND p.tablename  = r.table_name
        AND p.cmd = 'SELECT'
        AND (p.qual IS NULL OR p.qual NOT LIKE '%auth.uid()%')
    ) INTO has_public_select;

    IF has_public_select THEN
      EXECUTE format('GRANT SELECT ON public.%I TO anon', r.table_name);
    END IF;
  END LOOP;
END $$;
