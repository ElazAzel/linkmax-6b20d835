-- Keep the public demo on the canonical hyphenated URL used by GTM and SEO.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.pages
    WHERE slug = 'demo-nails'
      AND id <> '3229befa-752c-4032-9eac-4e4f63e7ade0'::uuid
  ) THEN
    RAISE EXCEPTION 'Cannot canonicalize demo slug: demo-nails is already owned by another page';
  END IF;

  UPDATE public.pages
  SET slug = 'demo-nails', updated_at = now()
  WHERE id = '3229befa-752c-4032-9eac-4e4f63e7ade0'::uuid
    AND slug = 'demo_nails';
END;
$$;
