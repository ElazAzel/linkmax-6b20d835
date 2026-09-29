DO $$
DECLARE safe_cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO safe_cols
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='pages'
    AND column_name NOT IN ('webhook_url','webhook_secret');
  EXECUTE 'REVOKE SELECT ON public.pages FROM authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.pages TO authenticated', safe_cols);
END$$;