import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Since 20260929022101 `authenticated` may SELECT only an explicit list of
 * public.pages columns (webhook_url / webhook_secret are withheld). A column
 * added later is invisible to the dashboard until a migration grants it, and
 * any client query that names it fails with "permission denied" — the editor
 * would break without a single code change. Every later migration that adds a
 * pages column must grant it (or list it here as owner-only).
 */
const COLUMN_GRANT_CUTOFF = '20260929022101';
const OWNER_ONLY_COLUMNS = new Set(['webhook_url', 'webhook_secret']);

const migrationsDir = resolve(process.cwd(), 'supabase/migrations');

function addedPageColumns(sql: string): string[] {
  const columns: string[] = [];
  const alterPages = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?(?:public\.)?"?pages"?\s+([\s\S]*?);/gi;
  for (const statement of sql.matchAll(alterPages)) {
    const addColumn = /ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi;
    for (const match of statement[1].matchAll(addColumn)) columns.push(match[1].toLowerCase());
  }
  return columns;
}

function grantedPageColumns(sql: string): Set<string> {
  const granted = new Set<string>();
  const grants = /GRANT\s+SELECT\s*\(([^)]*)\)\s*ON\s+(?:TABLE\s+)?(?:public\.)?"?pages"?\s+TO\s+[^;]*\bauthenticated\b/gi;
  for (const match of sql.matchAll(grants)) {
    for (const column of match[1].split(',')) granted.add(column.trim().replace(/"/g, '').toLowerCase());
  }
  return granted;
}

describe('public.pages column grants', () => {
  it('detects added columns and column grants', () => {
    const sql = `ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS brand_kit jsonb;
      GRANT SELECT (id, brand_kit) ON public.pages TO authenticated;`;
    expect(addedPageColumns(sql)).toEqual(['brand_kit']);
    expect(grantedPageColumns(sql).has('brand_kit')).toBe(true);
  });

  it('every pages column added after the column-level grant is granted to authenticated', () => {
    const later = readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql') && name.slice(0, 14) > COLUMN_GRANT_CUTOFF)
      .sort();

    const missing: string[] = [];
    for (const name of later) {
      const sql = readFileSync(resolve(migrationsDir, name), 'utf8');
      const granted = grantedPageColumns(sql);
      for (const column of addedPageColumns(sql)) {
        if (!OWNER_ONLY_COLUMNS.has(column) && !granted.has(column)) missing.push(`${name}: ${column}`);
      }
    }

    expect(missing, 'add GRANT SELECT (<column>) ON public.pages TO authenticated').toEqual([]);
  });
});
