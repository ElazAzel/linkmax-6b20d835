-- Paid block content is no longer readable through the public block policy
DROP POLICY IF EXISTS "Anyone can view blocks of published pages" ON public.blocks;
CREATE POLICY "Anyone can view free blocks of published pages" ON public.blocks
FOR SELECT USING (
  deleted_at IS NULL
  AND COALESCE((content->'blockStyle'->>'isPaidContent')::boolean, false) = false
  AND EXISTS (SELECT 1 FROM public.pages p WHERE p.id = blocks.page_id AND p.is_published = true)
);

-- Public stubs for paid blocks: id, type, position, price and title only
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
  FROM public.blocks b
  JOIN public.pages p ON p.id = b.page_id
  WHERE b.page_id = p_page_id
    AND p.is_published = true
    AND b.deleted_at IS NULL
    AND COALESCE((b.content->'blockStyle'->>'isPaidContent')::boolean, false) = true
    AND (auth.uid() IS NULL OR p.user_id <> auth.uid());
$$;
REVOKE ALL ON FUNCTION public.get_paid_block_stubs(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_paid_block_stubs(uuid) TO anon, authenticated;

-- Full content only for the owner, admins, or buyers of the block
CREATE OR REPLACE FUNCTION public.get_paid_block_content(p_page_id uuid, p_block_key text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_uid uuid := auth.uid(); v_owner uuid; v_content jsonb;
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;
  SELECT p.user_id, b.content INTO v_owner, v_content
  FROM public.blocks b JOIN public.pages p ON p.id = b.page_id
  WHERE b.page_id = p_page_id AND b.content->>'id' = p_block_key AND b.deleted_at IS NULL
  LIMIT 1;
  IF v_content IS NULL THEN RETURN NULL; END IF;
  IF v_owner = v_uid OR public.has_role(v_uid, 'admin'::app_role) OR EXISTS (
    SELECT 1 FROM public.token_transactions t
    WHERE t.buyer_id = v_uid AND t.item_type = 'block_access' AND t.item_id = p_block_key) THEN
    RETURN v_content;
  END IF;
  RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.get_paid_block_content(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_paid_block_content(uuid, text) TO authenticated;