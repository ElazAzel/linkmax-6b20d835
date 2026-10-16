import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const migration = name => readFileSync(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8');

/** Prepare a transaction for older Cloud schemas. This script never connects to a database. */
export function preparePageV2CloudSql() {
  const canonical = migration('20260402150000_platform_hardening.sql');
  const writerStart = canonical.indexOf('CREATE OR REPLACE FUNCTION public.save_page_blocks(');
  if (writerStart < 0) throw new Error('Canonical block writer not found');
  return [
    `BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $$ BEGIN
 IF to_regclass('public.page_drafts') IS NOT NULL THEN RAISE EXCEPTION 'Draft migration already present: inspect before reapplying'; END IF;
 IF to_regclass('public.page_snapshots') IS NULL OR to_regclass('public.events') IS NULL THEN RAISE EXCEPTION 'Missing required Cloud tables'; END IF;
END $$;
-- Cloud prerequisites verified against the existing schema. No user rows are changed.
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE OR REPLACE FUNCTION public.can_manage_organization_pages(p_org_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.org_id = p_org_id AND m.user_id = p_user_id AND m.role::text IN ('owner','admin','editor')
  )
$$;
REVOKE ALL ON FUNCTION public.can_manage_organization_pages(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_organization_pages(uuid,uuid) TO authenticated;
`,
    canonical.slice(writerStart),
    migration('20261013114410_page_v2_drafts.sql'),
    migration('20261014042612_page_v2_audio.sql'),
    migration('20261016090113_page_v2_write_guards.sql'),
    `NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT 'page-v2 schema ready' AS result;`,
  ].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] !== '--output' || !process.argv[3]) throw new Error('Usage: node scripts/prepare-page-v2-cloud.mjs --output path.sql');
  writeFileSync(process.argv[3], preparePageV2CloudSql());
}
