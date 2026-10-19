-- A block requires payment only when explicitly enabled and priced above zero.
CREATE OR REPLACE FUNCTION public.block_requires_payment(p_content jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT COALESCE(p_content->'blockStyle'->>'isPaidContent', 'false') = 'true'
    AND CASE WHEN COALESCE(p_content->'blockStyle'->>'paidContentPrice', '') ~ '^-?[0-9]+([.][0-9]+)?$'
      THEN (p_content->'blockStyle'->>'paidContentPrice')::numeric > 0
      ELSE false END;
$$;
REVOKE ALL ON FUNCTION public.block_requires_payment(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.block_requires_payment(jsonb) TO anon, authenticated, service_role;

ALTER POLICY "Anyone can view free blocks of published pages" ON public.blocks
USING (
  deleted_at IS NULL
  AND NOT public.block_requires_payment(content)
  AND EXISTS (SELECT 1 FROM public.pages p WHERE p.id = blocks.page_id AND p.is_published = true)
);

CREATE OR REPLACE FUNCTION public.get_paid_block_stubs(p_page_id uuid)
RETURNS TABLE(id uuid, page_id uuid, "position" integer, deleted_at timestamptz, content jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT b.id, b.page_id, b.position, b.deleted_at,
         jsonb_build_object(
           'id', b.content->'id',
           'type', b.content->'type',
           'title', b.content->'title',
           'blockStyle', jsonb_build_object(
             'isPaidContent', true,
             'paidContentPrice', b.content->'blockStyle'->'paidContentPrice'),
           '__paidLocked', true)
  FROM public.blocks b JOIN public.pages p ON p.id = b.page_id
  WHERE b.page_id = p_page_id AND p.is_published = true
    AND b.deleted_at IS NULL
    AND public.block_requires_payment(b.content)
    AND (auth.uid() IS NULL OR p.user_id <> auth.uid());
$$;
REVOKE ALL ON FUNCTION public.get_paid_block_stubs(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_paid_block_stubs(uuid) TO anon, authenticated;
