import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('anonymous reads preserve zero/unset-price content and expose only stubs for positive paid prices', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT null::uuid $$;
      CREATE TYPE public.app_role AS ENUM ('admin');
      CREATE FUNCTION public.has_role(uuid, public.app_role) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
      CREATE TABLE public.pages (id uuid PRIMARY KEY, user_id uuid, is_published boolean);
      CREATE TABLE public.blocks (id uuid PRIMARY KEY, page_id uuid, position integer, deleted_at timestamptz, content jsonb);
      CREATE TABLE public.token_transactions (buyer_id uuid, item_type text, item_id text);
      ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
      GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
      GRANT SELECT ON public.pages, public.blocks TO anon, authenticated;
      INSERT INTO public.pages VALUES ('00000000-0000-0000-0000-000000000001', null, true),
        ('00000000-0000-0000-0000-000000000002', null, false);`);
    await db.exec(await readFile(new URL('../../../drizzle/migrations/0007_paid_blocks_server_gating.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../../drizzle/migrations/0008_paid_blocks_positive_price.sql', import.meta.url), 'utf8'));
    const cases = [
      ['zero', { isPaidContent: true, paidContentPrice: 0 }],
      ['unset', { isPaidContent: true }],
      ['negative', { isPaidContent: true, paidContentPrice: -1 }],
      ['paid', { isPaidContent: true, paidContentPrice: 100 }],
      ['disabled', { isPaidContent: false, paidContentPrice: 100 }],
    ];
    for (const [index, [id, blockStyle]] of cases.entries()) {
      await db.query(`INSERT INTO public.blocks VALUES ($1, '00000000-0000-0000-0000-000000000001', $2, null, $3)`,
        [`00000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`, index, JSON.stringify({ id, type: 'link', url: 'https://example.invalid/full-content', blockStyle })]);
    }
    await db.exec(`INSERT INTO public.blocks VALUES
      ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 0, null, '{"id":"private"}'),
      ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 9, now(), '{"id":"deleted"}');
      SET ROLE anon;`);
    const full = (await db.query('SELECT content FROM public.blocks ORDER BY position')).rows.map(r => r.content);
    assert.deepEqual(full.map(b => b.id), ['zero', 'unset', 'negative', 'disabled']);
    for (const block of full) assert.equal(block.url, 'https://example.invalid/full-content');
    const stubs = (await db.query(`SELECT content FROM public.get_paid_block_stubs('00000000-0000-0000-0000-000000000001')`)).rows;
    assert.equal(stubs.length, 1);
    assert.equal(stubs[0].content.id, 'paid');
    assert.equal(stubs[0].content.blockStyle.paidContentPrice, 100);
    assert.equal(stubs[0].content.__paidLocked, true);
    assert.equal(stubs[0].content.url, undefined);
    assert.equal((await db.query(`SELECT * FROM public.get_paid_block_stubs('00000000-0000-0000-0000-000000000002')`)).rows.length, 0);
    await assert.rejects(db.query(`SELECT public.get_paid_block_content('00000000-0000-0000-0000-000000000001', 'paid')`), /permission denied/);
  } finally { await db.close(); }
});