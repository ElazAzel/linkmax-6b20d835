import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('audio migration preserves legacy blocks and restricts storage writes to the owner', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE authenticated; CREATE ROLE anon;
      CREATE SCHEMA auth; CREATE SCHEMA storage;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array($1, '/') $$;
      CREATE TABLE public.blocks (id text, type text CHECK (type IN ('profile', 'search')));
      INSERT INTO public.blocks VALUES ('old', 'search');
      CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      CREATE TABLE storage.objects (bucket_id text, name text);
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      GRANT USAGE ON SCHEMA storage, auth TO authenticated, anon;
      GRANT INSERT, SELECT ON storage.objects TO authenticated;
      GRANT SELECT ON storage.objects TO anon;`);
    await db.exec(await readFile(new URL('../../../supabase/migrations/20261014042612_page_v2_audio.sql', import.meta.url), 'utf8'));
    await db.exec(`INSERT INTO public.blocks VALUES ('new', 'audio');`);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.blocks')).rows[0].n, 2);
    const bucket = (await db.query(`SELECT * FROM storage.buckets WHERE id='page-audio'`)).rows[0];
    assert.equal(Number(bucket.file_size_limit), 50 * 1024 * 1024);
    assert.ok(bucket.allowed_mime_types.includes('audio/mpeg'));
    assert.ok(!bucket.allowed_mime_types.includes('text/html'));
    await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';`);
    await db.exec(`INSERT INTO storage.objects VALUES ('page-audio', '00000000-0000-0000-0000-000000000001/files/song.mp3');`);
    await assert.rejects(db.exec(`INSERT INTO storage.objects VALUES ('page-audio', '00000000-0000-0000-0000-000000000002/files/song.mp3');`), /row-level security/);
    await db.exec('RESET ROLE; SET ROLE anon;');
    assert.equal((await db.query('SELECT * FROM storage.objects')).rows.length, 0);
  } finally { await db.close(); }
});
