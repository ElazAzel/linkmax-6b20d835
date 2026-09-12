-- EPIC: Team Collaboration & Organizations (RBAC)
-- Migration for Organizations and multi-user access

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Organization Members (RBAC)
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.org_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, user_id)
);

-- 3. Update Pages table
ALTER TABLE public.pages 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 4. Initial Migration: Create Personal Organizations for existing users
DO $$
DECLARE
    u RECORD;
    new_org_id UUID;
BEGIN
    FOR u IN SELECT id FROM auth.users LOOP
        -- Create a personal org for each user
        INSERT INTO public.organizations (name, owner_id)
        VALUES ('Personal Organization', u.id)
        RETURNING id INTO new_org_id;

        -- Add user as owner of their personal org
        INSERT INTO public.organization_members (org_id, user_id, role)
        VALUES (new_org_id, u.id, 'owner');

        -- Link existing pages to this new org
        UPDATE public.pages
        SET organization_id = new_org_id
        WHERE user_id = u.id;
    END LOOP;
END $$;

-- 5. RLS Policies

-- Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organizations they are members of"
ON public.organizations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.org_id = public.organizations.id
        AND organization_members.user_id = auth.uid()
    )
);

CREATE POLICY "Owners can update their organizations"
ON public.organizations FOR UPDATE
USING (owner_id = auth.uid());

-- Organization Members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view other members in the same org"
ON public.organization_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members as sub
        WHERE sub.org_id = public.organization_members.org_id
        AND sub.user_id = auth.uid()
    )
);

-- 6. Updated Pages RLS (Crucial Change)
-- We need to allow access based on organization membership instead of just user_id

DROP POLICY IF EXISTS "Users can view their own pages" ON public.pages;
CREATE POLICY "Users can view pages in their organizations"
ON public.pages FOR SELECT
USING (
    organization_id IN (
        SELECT org_id FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update their own pages" ON public.pages;
CREATE POLICY "Users can update pages in their organizations"
ON public.pages FOR UPDATE
USING (
    organization_id IN (
        SELECT org_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'editor')
    )
);
