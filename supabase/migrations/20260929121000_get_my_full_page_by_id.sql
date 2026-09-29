-- Multi-page editor support.
--
-- get_my_full_page returned `LIMIT 1` without ORDER BY, so a user with
-- several pages got an arbitrary one. It now returns the oldest (primary)
-- page, and get_my_full_page_by_id returns a specific page of the caller,
-- including owner-only columns (webhook_*, contact_*), so settings of a
-- secondary page show — and do not overwrite — its real values.

CREATE OR REPLACE FUNCTION public.get_my_full_page(p_user_id uuid DEFAULT auth.uid())
RETURNS SETOF public.pages
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.pages
  WHERE user_id = p_user_id
    AND auth.uid() = p_user_id
  ORDER BY created_at ASC, id ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_full_page_by_id(p_page_id uuid)
RETURNS SETOF public.pages
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.pages
  WHERE id = p_page_id
    AND user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_full_page_by_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_full_page_by_id(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_my_full_page_by_id(uuid) IS
  'Returns one of the caller''s own pages including owner-only columns.';
