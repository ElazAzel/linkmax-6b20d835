#!/usr/bin/env bash
# Dumps app data + users + file metadata from the OLD database.
# Usage: SOURCE_DB_URL=postgres://... ./export-data.sh [out_dir]
set -euo pipefail
: "${SOURCE_DB_URL:?Set SOURCE_DB_URL}"
OUT="${1:-./dump-$(date +%Y%m%d-%H%M)}"
mkdir -p "$OUT"

# Schema comes from supabase/migrations, so only data is dumped.
pg_dump "$SOURCE_DB_URL" --data-only --no-owner --no-privileges \
  --schema=public --disable-triggers -Fc -f "$OUT/public.dump"
pg_dump "$SOURCE_DB_URL" --data-only --no-owner --no-privileges \
  --table=auth.users --table=auth.identities -Fc -f "$OUT/auth.dump"
pg_dump "$SOURCE_DB_URL" --data-only --no-owner --no-privileges \
  --table=storage.buckets --table=storage.objects -Fc -f "$OUT/storage.dump"

echo "Done: $OUT"
