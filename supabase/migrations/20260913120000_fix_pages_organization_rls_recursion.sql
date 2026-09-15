-- Keep page access organization-aware without querying organization_members
-- directly from a policy on a table that is also protected by organization RLS.
CREATE OR REPLACE FUNCTION public.can_manage_organization_pages(
  p_org_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members AS member
    WHERE member.org_id = p_org_id
      AND member.user_id = p_user_id
      AND member.role IN (
        'owner'::public.org_role,
        'admin'::public.org_role,
        'editor'::public.org_role
      )
  );
$$;

DROP POLICY IF EXISTS "Users can view pages in their organizations"
  ON public.pages;
CREATE POLICY "Users can view pages in their organizations"
  ON public.pages
  FOR SELECT
  USING (
    organization_id IN (
      SELECT public.get_user_org_ids_for_members(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update pages in their organizations"
  ON public.pages;
CREATE POLICY "Users can update pages in their organizations"
  ON public.pages
  FOR UPDATE
  USING (
    public.can_manage_organization_pages(organization_id, auth.uid())
  );
