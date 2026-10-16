import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('card/tiles migration keeps existing block types and accepts the new ones', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE TABLE public.blocks (id text, type text CONSTRAINT blocks_type_check CHECK (type IN ('profile', 'search', 'audio')));
      INSERT INTO public.blocks VALUES ('old', 'search'), ('a', 'audio');`);
    await db.exec(await readFile(new URL('../../../supabase/migrations/20261016120000_korner_card_tiles.sql', import.meta.url), 'utf8'));
    await db.exec(`INSERT INTO public.blocks VALUES ('c', 'card'), ('t', 'tiles'), ('l', 'link');`);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.blocks')).rows[0].n, 5);
    await assert.rejects(db.exec(`INSERT INTO public.blocks VALUES ('x', 'not-a-block');`), /blocks_type_check/);
  } finally { await db.close(); }
});
