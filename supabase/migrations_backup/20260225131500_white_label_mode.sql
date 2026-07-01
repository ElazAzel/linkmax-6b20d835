-- Migration to add White-label fields to the pages table
-- Description: Adds favicon_url and hide_branding to support the white-label feature for Pro/Premium users

ALTER TABLE pages ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS hide_branding BOOLEAN DEFAULT FALSE;

-- Ensure RLS is updated (though it usually inherits page ownership)
-- For existing data, we don't need to do anything as defaults are set.
