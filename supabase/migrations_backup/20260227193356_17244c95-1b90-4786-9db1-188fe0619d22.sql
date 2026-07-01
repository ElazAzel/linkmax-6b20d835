
-- 1. Add missing columns to pages table
ALTER TABLE public.pages 
  ADD COLUMN IF NOT EXISTS favicon_url text,
  ADD COLUMN IF NOT EXISTS hide_branding boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS organization_id uuid;

-- 2. Add foreign key from zone_members.user_id to user_profiles.id
ALTER TABLE public.zone_members
  ADD CONSTRAINT zone_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);

-- 3. Reload schema cache
NOTIFY pgrst, 'reload schema';
