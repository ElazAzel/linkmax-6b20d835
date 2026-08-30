
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

ALTER TABLE public.user_integrations_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON public.user_integrations_status FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own integrations"
  ON public.user_integrations_status FOR ALL
  USING (user_id = auth.uid());
