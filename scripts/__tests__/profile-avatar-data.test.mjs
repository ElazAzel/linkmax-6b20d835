import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('avatar repair changes shapes in publications and drafts, preserves media, and is repeatable', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE pages(id uuid PRIMARY KEY,avatar_style jsonb,published_revision bigint DEFAULT 3,updated_at timestamptz DEFAULT now());
      CREATE TABLE blocks(id uuid PRIMARY KEY,page_id uuid,type text,content jsonb,deleted_at timestamptz);
      CREATE TABLE page_drafts(page_id uuid PRIMARY KEY,snapshot jsonb,revision bigint,published_draft_revision bigint,base_published_revision bigint,updated_at timestamptz DEFAULT now());
      INSERT INTO pages(id,avatar_style) VALUES('11111111-1111-4111-8111-111111111111','{"shape":"square","color":"red"}');
      INSERT INTO blocks VALUES('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','profile','{"type":"profile","avatarShape":"sticker","avatar":"/mine.gif","coverImage":"/cover.jpg","name":"Original","extra":42}',NULL),
        ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','avatar','{"type":"avatar","shape":"square","imageUrl":"/other.png"}',NULL);
      INSERT INTO page_drafts VALUES('11111111-1111-4111-8111-111111111111','{"otherPrivateField":"keep","blocks":[{"type":"profile","avatarShape":"blob","avatar":"/private.jpg"},{"type":"text","content":"Draft text"}]}',7,5,3,now());`);
    const sql = await readFile(new URL('../sql/normalize-profile-avatars.sql', import.meta.url), 'utf8');
    await db.exec(sql);
    const profile = (await db.query("SELECT content FROM blocks WHERE type='profile'")).rows[0].content;
    assert.deepEqual(profile, { type: 'profile', avatarShape: 'circle', avatar: '/mine.gif', coverImage: '/cover.jpg', name: 'Original', extra: 42 });
    assert.equal((await db.query("SELECT content->>'shape' AS shape FROM blocks WHERE type='avatar'")).rows[0].shape, 'circle');
    assert.deepEqual((await db.query('SELECT avatar_style FROM pages')).rows[0].avatar_style, { shape: 'circle', color: 'red' });
    const draft = (await db.query('SELECT * FROM page_drafts')).rows[0];
    assert.equal(draft.revision, 8);
    assert.equal(draft.base_published_revision, 4);
    assert.equal(draft.published_draft_revision, 5);
    assert.equal(draft.snapshot.otherPrivateField, 'keep');
    assert.equal(draft.snapshot.blocks[0].avatar, '/private.jpg');
    assert.equal(draft.snapshot.blocks[0].avatarShape, 'circle');
    assert.deepEqual(draft.snapshot.blocks[1], { type: 'text', content: 'Draft text' });
    await db.exec(sql);
    assert.equal((await db.query('SELECT revision FROM page_drafts')).rows[0].revision, 8);
    await db.exec(`UPDATE blocks SET content=jsonb_set(content,'{content}','{"avatarShape":"square"}') WHERE type='profile'`);
    await db.exec(sql);
    assert.equal((await db.query("SELECT content->'content'->>'avatarShape' AS shape FROM blocks WHERE type='profile'")).rows[0].shape, 'circle');
    const repairedRevision = (await db.query('SELECT revision FROM page_drafts')).rows[0].revision;
    await db.exec(sql);
    assert.equal((await db.query('SELECT revision FROM page_drafts')).rows[0].revision, repairedRevision);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM profile_refresh_internal.avatar_backups')).rows[0].n, 4);
    await db.exec('SET ROLE anon');
    await assert.rejects(db.query('SELECT * FROM profile_refresh_internal.avatar_backups'), /permission denied/);
  } finally { await db.close(); }
});
