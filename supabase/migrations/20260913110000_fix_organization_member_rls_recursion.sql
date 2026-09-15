-- The legacy same-organization policy queried organization_members from its
-- own predicate, which causes PostgreSQL 42P17 recursion for authenticated
-- reads of pages and blocks. The security-definer helper-backed policy below
-- remains the canonical access path.
DROP POLICY IF EXISTS "Members can view other members in the same org"
  ON public.organization_members;
