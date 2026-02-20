---
description: Manage Supabase database
---
# Database Commands

## Migrate
Run `supabase db diff -f <migration_name>` to generate a new migration file based on local changes.

## Reset
Run `supabase db reset` to wipe local database and re-apply all migrations.

## Push (Remote)
Run `supabase db push` to apply local migrations to the remote linked project.
