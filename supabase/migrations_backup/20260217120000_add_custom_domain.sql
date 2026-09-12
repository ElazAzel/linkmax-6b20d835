-- Add custom_domain column to pages table
ALTER TABLE "public"."pages"
ADD COLUMN "custom_domain" text;

-- Create unique index on custom_domain to ensure uniqueness and fast lookups
CREATE UNIQUE INDEX "pages_custom_domain_idx" ON "public"."pages" ("custom_domain");

-- Add comment
COMMENT ON COLUMN "public"."pages"."custom_domain" IS 'Custom domain for the page (e.g. user.com)';
