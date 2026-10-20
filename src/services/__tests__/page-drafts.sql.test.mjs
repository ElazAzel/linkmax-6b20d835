import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { preparePageV2CloudSql } from '../../../scripts/prepare-page-v2-cloud.mjs';

// Real PostgreSQL execution, with a deliberately minimal Cloud surrogate schema.
const db = new PGlite();
const owner = '11111111-1111-4111-8111-111111111111';
const editor = '22222222-2222-4222-8222-222222222222';
const other = '33333333-3333-4333-8333-333333333333';
const page = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const org = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const snapshot = { id: page, slug: 'original', blocks: [{ id: 'profile-one', type: 'profile', name: 'Private' },
  { id: 'event-one', type: 'event', eventId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', title: { en: 'Private event' }, status: 'published' },
  { id: 'audio-one', type: 'audio', audioUrl: 'https://example.test/preserved.mp3', customFutureField: { keep: true } }], theme: { backgroundColor: 'blue' }, seo: { title: 'Private SEO' } };
const as = async (user, role = 'authenticated') => { await db.exec(`reset role; select set_config('request.jwt.claim.sub','${user || ''}',false); set role ${role}`); };
const call = async (name, args) => (await db.query(`select public.${name}(${args.map((_, i) => `$${i+1}`).join(',')}) as result`, args)).rows[0].result;
before(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated, anon; grant execute on function auth.uid() to authenticated, anon;
    create table pages(id uuid primary key, user_id uuid, organization_id uuid, slug text, title text, description text, avatar_url text, theme_settings jsonb, seo_meta jsonb, is_published boolean default true, updated_at timestamptz default now(), editor_mode text, grid_config jsonb, integrations jsonb, favicon_url text, hide_branding boolean, is_indexable boolean, niche text, city text, profession text, entity_type text, contact_email text, contact_phone text, contact_whatsapp text, country_code text, webhook_url text, webhook_secret text);
    create table organization_members(org_id uuid,user_id uuid,role text);
    create function can_manage_organization_pages(uuid,uuid) returns boolean language sql security definer set search_path=public as $$select exists(select 1 from organization_members where org_id=$1 and user_id=$2 and role in ('owner','admin','editor'))$$;
    create table blocks(id uuid primary key default gen_random_uuid(),page_id uuid,content jsonb,position integer,type text,title text,style jsonb,deleted_at timestamptz);
    create table private_page_data(page_id uuid primary key, chatbot_context text);
    create table page_snapshots(id uuid primary key default gen_random_uuid(),page_id uuid,version_id text,content_hash text,blocks_json jsonb,theme_json jsonb,seo_json jsonb,published_at timestamptz default now(),unique(page_id,version_id));
    insert into pages(id,user_id,organization_id,slug,title,theme_settings,seo_meta) values('${page}','${owner}','${org}','original','Public','{}','{}');
    insert into organization_members values('${org}','${editor}','editor'),('${org}','${other}','viewer');
    create function save_page_blocks(p_page_id uuid,p_blocks jsonb,p_is_premium boolean default false) returns void language plpgsql security definer set search_path=public as $$begin
      IF NOT EXISTS (SELECT 1 FROM public.pages WHERE id = p_page_id AND user_id = auth.uid()) THEN RAISE EXCEPTION 'Access denied: you do not own this page'; END IF;
      update blocks set deleted_at=now() where page_id=p_page_id;
      insert into blocks(id,page_id,content,position,type) select (b->>'id')::uuid,p_page_id,b->'content',(b->>'position')::int,b->>'type' from jsonb_array_elements(p_blocks)b on conflict(id) do update set content=excluded.content,deleted_at=null;
    end$$;
    create function create_page_snapshot() returns trigger language plpgsql as $$begin return NEW; end$$;
    grant select on pages to authenticated;`);
  // Execute the real canonical block writer, including quality/service URL logic.
  await db.exec(`alter table pages add column quality_score int, add column quality_breakdown jsonb, add column index_exclusion_reasons text[], add column service_slugs jsonb;
    alter table blocks add column is_premium boolean, add column schedule jsonb, add column click_count int;`);
  const canonical = readFileSync(new URL('../../../supabase/migrations/20260402150000_platform_hardening.sql', import.meta.url),'utf8');
  await db.exec(canonical.slice(canonical.indexOf('CREATE OR REPLACE FUNCTION public.save_page_blocks(')));
  const events = readFileSync(new URL('../../../supabase/migrations/20260123115026_97ee7680-fb9b-4057-a2d1-c7023e11faf8.sql', import.meta.url),'utf8');
  const eventStart = events.indexOf('CREATE TABLE IF NOT EXISTS public.events');
  await db.exec(events.slice(eventStart, events.indexOf(');',eventStart)+2));

  await db.exec(`grant select on pages, blocks to anon, authenticated; alter table blocks enable row level security;
    create policy "Anyone can view blocks of published pages" on blocks for select using (true);
    create policy "Users can view own blocks" on blocks for select to authenticated using (exists(select 1 from pages where pages.id=blocks.page_id and pages.user_id=auth.uid()));`);
  await db.exec(`create schema storage;
    create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(bucket_id text,name text);`);
  await db.exec(preparePageV2CloudSql());
  await db.exec(readFileSync(new URL('../../../supabase/migrations/20261016120000_korner_card_tiles.sql', import.meta.url),'utf8'));
});
after(async () => db.close());
test('private saves enforce CAS and do not change public content', async () => {
  await as(owner);
  const initial = await call('load_page_draft',[page]);
  assert.equal(initial.revision,0);
  const saved = await call('save_page_draft',[page,snapshot,0,0,'private context']);
  assert.equal(saved.revision,1);
  assert.equal((await db.query('select title from pages')).rows[0].title,'Public');
  await db.exec('reset role');
  assert.equal((await db.query('select * from events')).rows.length,0);
  await as(owner);
  await assert.rejects(call('save_page_draft',[page,snapshot,0,0,'']), /draft_conflict/);
});
test('anonymous and unrelated/viewer users cannot read or write drafts; editor can', async () => {
  await as(null,'anon');
  await assert.rejects(call('load_page_draft',[page]), /permission denied/);
  await assert.rejects(db.query('select * from page_drafts'), /permission denied/);
  await as(other);
  await assert.rejects(call('load_page_draft',[page]), /draft_access_denied/);
  assert.equal((await db.query('select * from page_drafts')).rows.length,0);
  await as(editor);
  assert.equal((await call('load_page_draft',[page])).revision,1);
  await assert.rejects(db.query('update page_drafts set revision=999'), /permission denied/);
});
test('publish is atomic, checks both revisions and preserves history', async () => {
  await as(editor);
  await assert.rejects(call('publish_page_draft',[page,0,0]), /draft_conflict/);
  const published = await call('publish_page_draft',[page,1,0]);
  assert.equal(published.base_published_revision,1);
  await db.exec('reset role');
  assert.equal((await db.query('select title from pages')).rows[0].title,'Private');
  assert.deepEqual((await db.query('select blocks_json from page_snapshots')).rows[0].blocks_json,snapshot.blocks);
  assert.equal((await db.query('select title_i18n_json from events')).rows[0].title_i18n_json.en,'Private event');
  assert.equal((await db.query("select content from blocks where type='audio'")).rows[0].content.customFutureField.keep,true);
  await db.exec(`create function fail_history() returns trigger language plpgsql as $$begin raise exception 'history_failure'; end$$; create trigger fail_history before insert on page_snapshots for each row execute function fail_history()`);
  await as(owner);
  await call('save_page_draft',[page,{...snapshot,theme:{backgroundColor:'red'}},1,1,'']);
  await assert.rejects(call('publish_page_draft',[page,2,1]), /history_failure/);
  await db.exec('reset role');
  assert.equal((await db.query('select theme_settings from pages')).rows[0].theme_settings.backgroundColor,'blue');
  assert.equal((await db.query('select published_revision from pages')).rows[0].published_revision,1);
});
test('legacy external edits invalidate the editor publication base', async () => {
  await db.exec(`reset role; update pages set title='External edit',theme_settings='{"backgroundColor":"purple"}' where id='${page}'`);
  await as(owner);
  await assert.rejects(call('save_page_draft',[page,snapshot,2,1,'']), /draft_conflict/);
  await assert.rejects(call('publish_page_draft',[page,2,1]), /draft_conflict/);
});


test('explicit recovery preserves unpublished edits and permits save and publish', async () => {
 await db.exec('reset role; drop trigger fail_history on page_snapshots'); await as(owner);
 const stale=await call('load_page_draft',[page]);
 const fresh=await call('reload_page_draft',[page,stale.revision,stale.base_published_revision]);
 assert.equal(fresh.base_published_revision,2); assert.equal(fresh.revision,stale.revision+1);
 assert.equal(fresh.snapshot.theme.backgroundColor,'purple');
 await db.exec('reset role');
 assert.equal((await db.query('select draft from page_draft_internal.recovery_backups')).rows[0].draft.snapshot.theme.backgroundColor,'red');
 await as(owner);
 await assert.rejects(call('reload_page_draft',[page,stale.revision,stale.base_published_revision]),/draft_conflict/);
 const saved=await call('save_page_draft',[page,fresh.snapshot,fresh.revision,fresh.base_published_revision,'']);
 await call('publish_page_draft',[page,saved.revision,saved.base_published_revision]);
});

test('recovery rejects unauthorized callers and keeps backups private',async()=>{
 await as(null,'anon');
 await assert.rejects(call('reload_page_draft',[page,0,0]),/permission denied/);
 await as(other);
 await assert.rejects(call('reload_page_draft',[page,0,0]),/draft_access_denied/);
 await as(owner);
 await assert.rejects(db.query('select * from page_draft_internal.recovery_backups'),/permission denied/);
 const latest=await call('load_page_draft',[page]);
 const unchanged=await call('reload_page_draft',[page,latest.revision,latest.base_published_revision]);
 assert.deepEqual(unchanged,latest);
});

test('publish rejects null revisions without changing the publication', async () => {
  await as(owner);
  const current = await call('load_page_draft',[page]);
  for (const [revision, base] of [[null,null],[null,current.base_published_revision],[current.revision,null]]) {
    await assert.rejects(call('publish_page_draft',[page,revision,base]), /draft_conflict/);
  }
  const after = await call('load_page_draft',[page]);
  assert.equal(after.base_published_revision,current.base_published_revision);
});

test('a page owner cannot overwrite another page block through its UUID', async () => {
  const foreignPage='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const foreignBlock='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  await db.exec('reset role');
  await db.query('insert into pages(id,user_id,slug) values($1,$2,$3)',[foreignPage,other,'other-page']);
  await db.query('insert into blocks(id,page_id,type,position,content) values($1,$2,$3,0,$4)',[foreignBlock,foreignPage,'text',{id:'foreign-authored',type:'text',content:'Preserved'}]);
  await as(owner);
  await assert.rejects(call('save_page_blocks',[page,[{id:foreignBlock,type:'text',position:0,content:{type:'text',content:'Overwritten'}}],false]), /block_page_mismatch/);
  await db.exec('reset role');
  const stored=(await db.query('select page_id,content from blocks where id=$1',[foreignBlock])).rows[0];
  assert.equal(stored.page_id,foreignPage);
  assert.equal(stored.content.content,'Preserved');
});

test('soft-deleted content stays private while the owner retains recovery access', async () => {
  const removed='ffffffff-ffff-4fff-8fff-ffffffffffff';
  await db.exec('reset role');
  await db.query('insert into blocks(id,page_id,type,position,content,deleted_at) values($1,$2,$3,99,$4,now())',[removed,page,'text',{content:'Removed'}]);
  await as(null,'anon');
  assert.equal((await db.query('select id from blocks where id=$1',[removed])).rows.length,0);
  await as(other);
  assert.equal((await db.query('select id from blocks where id=$1',[removed])).rows.length,0);
  await as(owner);
  assert.equal((await db.query('select id from blocks where id=$1',[removed])).rows.length,1);
});

for (const type of ['card', 'tiles']) {
  test(`${type} survives draft save, reload and publication with content intact`, async () => {
    await as(owner);
    const current = await call('load_page_draft', [page]);
    const block = type === 'card'
      ? { id: 'card-test', type, title: { ru: 'Talqy Like [2026]' }, text: { ru: 'Details' }, url: 'https://example.test/card' }
      : { id: 'tiles-test', type, items: [{ id: 'tile-test', image: 'https://example.test/image.jpg', url: 'https://example.test/tile' }] };
    const next = { ...current.snapshot, blocks: [...current.snapshot.blocks.filter(b => b.type !== type), block] };
    const saved = await call('save_page_draft', [page, next, current.revision, current.base_published_revision, current.chatbot_context]);
    const reloaded = await call('load_page_draft', [page]);
    assert.deepEqual(reloaded.snapshot.blocks.find(b => b.id === block.id), block);
    const published = await call('publish_page_draft', [page, saved.revision, saved.base_published_revision]);
    assert.equal(published.base_published_revision, current.base_published_revision + 1);
    await as(null, 'anon');
    const result = await db.query('select content from blocks where page_id=$1 and type=$2 and deleted_at is null', [page, type]);
    assert.equal(result.rows.length, 1);
    assert.deepEqual(result.rows[0].content, block);
  });
}

test('the block type constraint still rejects unknown types', async () => {
  await db.exec('reset role');
  await assert.rejects(db.query('insert into blocks(page_id,type,content) values($1,$2,$3)', [page, 'unsupported-type', {}]), /blocks_type_check/);
});
