#!/usr/bin/env bash
# Applies schema migrations, then restores data into the NEW database.
# Usage: TARGET_DB_URL=postgres://... ./import-data.sh <dump_dir>
set -euo pipefail
: "${TARGET_DB_URL:?Set TARGET_DB_URL}"
DUMP="${1:?Pass dump directory}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "1/3 schema: applying migrations in order"
for f in $(ls "$ROOT"/supabase/migrations/*.sql | sort); do
  echo "  -> $(basename "$f")"
  psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -q -f "$f"
done

echo "2/3 users and file metadata"
pg_restore -d "$TARGET_DB_URL" --data-only --disable-triggers --no-owner "$DUMP/auth.dump"
pg_restore -d "$TARGET_DB_URL" --data-only --disable-triggers --no-owner "$DUMP/storage.dump"

echo "3/3 app data"
pg_restore -d "$TARGET_DB_URL" --data-only --disable-triggers --no-owner "$DUMP/public.dump"

echo "Resetting sequences"
psql "$TARGET_DB_URL" -q -c "DO \$\$DECLARE r record; BEGIN
FOR r IN SELECT s.relname seq, t.relname tbl, a.attname col FROM pg_class s
 JOIN pg_depend d ON d.objid=s.oid JOIN pg_class t ON t.oid=d.refobjid
 JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=d.refobjsubid
 JOIN pg_namespace n ON n.oid=s.relnamespace WHERE s.relkind='S' AND n.nspname='public'
LOOP EXECUTE format('SELECT setval(%L, COALESCE((SELECT max(%I) FROM public.%I),1))', 'public.'||r.seq, r.col, r.tbl); END LOOP; END\$\$;"
echo "Import complete"
