
-- Create i18n_translations table
CREATE TABLE IF NOT EXISTS public.i18n_translations (
  lang_code TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.i18n_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translations"
  ON public.i18n_translations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage translations"
  ON public.i18n_translations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organizations"
  ON public.organizations FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their org members"
  ON public.organization_members FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.organization_members om WHERE om.org_id = organization_members.org_id AND om.user_id = auth.uid()
  ));

CREATE POLICY "Org owners can manage members"
  ON public.organization_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.organizations o WHERE o.id = organization_members.org_id AND o.owner_id = auth.uid()
  ));

-- Also allow users who are members to see orgs they belong to
CREATE POLICY "Members can view orgs they belong to"
  ON public.organizations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om WHERE om.org_id = organizations.id AND om.user_id = auth.uid()
  ));
