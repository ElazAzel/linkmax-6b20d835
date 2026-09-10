
-- Fix infinite recursion in organizations RLS policies
-- Drop the recursive policy
DROP POLICY IF EXISTS "Members can view orgs they belong to" ON public.organizations;

-- Create a security definer function to check membership
CREATE OR REPLACE FUNCTION public.get_user_org_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.organization_members WHERE user_id = p_user_id;
$$;

-- Recreate policy using the function
CREATE POLICY "Members can view orgs they belong to"
  ON public.organizations FOR SELECT
  USING (id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Create user_integrations_status table
CREATE TABLE IF NOT EXISTS public.user_integrations_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Google Calendar creates this relation as a view first. Apply table-only RLS
-- when a table is present; the later hardening migration converts the view to
-- a table and installs the final policy set.
DO $$
DECLARE
  relation_kind "char";
BEGIN
  SELECT c.relkind
    INTO relation_kind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'user_integrations_status';

  IF relation_kind IN ('r', 'p') THEN
    EXECUTE 'ALTER TABLE public.user_integrations_status ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own integrations" ON public.user_integrations_status';
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage own integrations" ON public.user_integrations_status';
    EXECUTE $policy$
      CREATE POLICY "Users can view own integrations"
        ON public.user_integrations_status FOR SELECT
        USING (user_id = auth.uid())
    $policy$;
    EXECUTE $policy$
      CREATE POLICY "Users can manage own integrations"
        ON public.user_integrations_status FOR ALL
        USING (user_id = auth.uid())
    $policy$;
  END IF;
END $$;
