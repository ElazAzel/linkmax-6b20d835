import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoRefresh, buildElazartRefresh, buildRefreshSql, demoOwnerEmail, standardizeAvatar } from '../lib/profile-refresh.mjs';

const row = {
  slug: 'english_pro',
  page: { id: '11111111-1111-4111-8111-111111111111', user_id: '22222222-2222-4222-8222-222222222222', slug: 'english_pro', title: 'English Studio', description: 'English lessons', niche: 'education', avatar_url: 'https://example.test/avatar.jpg', published_revision: 2, seo_meta: {} },
  draft: null,
  blocks: [{ id: '33333333-3333-4333-8333-333333333333', type: 'product', position: 0, content: { type: 'product', name: 'IELTS', price: 12000, description: 'Speaking practice' }, style: {} }],
};

test('normalizing legacy avatars changes only the silhouette and retains source media', () => {
  const old = { type: 'profile', avatar: '/my-own.gif', avatarShape: 'sticker', coverImage: '/cover.jpg', customFutureField: 42 };
  assert.deepEqual(standardizeAvatar(old), { ...old, avatarShape: 'circle' });
  assert.equal(old.avatarShape, 'sticker');
  assert.deepEqual(standardizeAvatar({ type: 'avatar', imageUrl: '/old.jpg', shape: 'square' }), { type: 'avatar', imageUrl: '/old.jpg', shape: 'circle' });
});

test('demo targets must match the original seeded owner, including the renamed nails page', () => {
  assert.equal(demoOwnerEmail('demo_nails'), 'demoaccount1@gmail.com');
  assert.equal(demoOwnerEmail('english_pro'), 'demoaccount7@gmail.com');
  assert.equal(demoOwnerEmail('elazart'), null);
  assert.throws(() => buildDemoRefresh({ ...row, slug: 'elazart', page: { ...row.page, slug: 'elazart' } }), /not a seeded demo/);
});

test('refresh fills a missing profile and product media while retaining old block IDs and prices', () => {
  const plan = buildDemoRefresh(row);
  const profile = plan.blocks.find(b => b.type === 'profile');
  assert.equal(profile.avatar, row.page.avatar_url);
  assert.equal(profile.avatarShape, 'circle');
  assert.equal(profile.verified, false);
  assert.ok(profile.coverImage.startsWith('https://'));
  const product = plan.blocks.find(b => b.id === row.blocks[0].id);
  assert.equal(product.price, 12000);
  assert.ok(product.image);
  assert.deepEqual(buildDemoRefresh(row), plan);
  assert.equal(new Set(plan.blocks.map(b => b.id)).size, plan.blocks.length);
  assert.ok(plan.blocks.every(b => /^[a-f0-9-]{36}$/.test(b.id)));
});

test('demo refresh preserves booking configuration and does not publish made-up contact destinations', () => {
  const booking = { id: '44444444-4444-4444-8444-444444444444', type: 'booking', content: { type: 'booking', serviceOfferingIds: ['real-service-id'], requirePrepayment: false } };
  const messenger = { id: '55555555-5555-4555-8555-555555555555', type: 'messenger', content: { type: 'messenger', messengers: [{ platform: 'whatsapp', username: '+77001234567' }] } };
  const plan = buildDemoRefresh({ ...row, slug: 'demo_nails', page: { ...row.page, slug: 'demo_nails', niche: 'beauty' }, blocks: [booking, messenger] });
  assert.deepEqual(plan.blocks.find(b => b.type === 'booking').serviceOfferingIds, ['real-service-id']);
  assert.deepEqual(plan.blocks.find(b => b.type === 'messenger').messengers, []);
  assert.ok(!JSON.stringify(plan.blocks).includes('+77001234567'));
});

test('generated SQL uses existing draft publishing, a strict seeded-owner guard, backups and stale-data checks', () => {
  const sql = buildRefreshSql([buildDemoRefresh(row)]);
  for (const required of ['load_page_draft', 'save_page_draft', 'publish_page_draft', 'auth.users', 'demoaccount7@gmail.com', 'profile_refresh_internal', 'profile_refresh_conflict', 'FOR UPDATE']) assert.ok(sql.includes(required), required);
  assert.ok(!sql.includes('DELETE FROM public.pages'));
  assert.ok(!sql.includes('DELETE FROM public.blocks'));
});

test('a page string cannot close the maintenance SQL dollar-quoted body', () => {
  const plan = buildDemoRefresh(row);
  plan.blocks[0].bio = "Keep $profile_refresh$ and apostrophes like O'Connor as ordinary content";
  const sql = buildRefreshSql([plan]);
  assert.ok(sql.includes('DO $profile_refresh_next$'));
  assert.ok(sql.includes("O''Connor"));
});

test('the personal refresh preserves actual identity, media, contacts and every authored block ID', () => {
  const blocks = [
    { id: 'p', type: 'profile', name: 'Actual Name', avatar: '/actual.gif', coverImage: '/actual-cover.jpg', avatarShape: 'sticker', content: { name: 'Obsolete nested copy' } },
    { id: 's', type: 'socials', platforms: [{ platform: 'telegram', url: 'https://web.telegram.org/#@Elazart' }] },
    { id: 'c', type: 'custom_code', javascript: 'old-autoplay()' },
    { id: 'h', type: 'text', content: 'Old heading' },
    { id: 'l', type: 'image', url: '/linkmax.gif', link: 'https://lnkmx.my/' },
    { id: 'g', type: 'image', url: '/certificates.gif', link: 'https://certificate-generator-tawny.vercel.app/' },
    { id: 't', type: 'image', url: '/threads.webp', link: 'https://threadssmm.vercel.app/login' },
    { id: 'v', type: 'video', url: 'https://youtu.be/vSM-MnCl9QI' },
    { id: 'a', type: 'carousel', images: [{ url: '/actual-article.webp', link: 'https://example.test/article' }], autoPlay: true },
    { id: 'm', type: 'messenger', messengers: [{ platform: 'whatsapp', username: 'existing-contact' }] },
  ];
  const input = { ...row, slug: 'elazart', draft: { revision: 8, snapshot: { blocks } } };
  const plan = buildElazartRefresh(input, { html: '<section>Approved</section>', css: 'section{color:white}' });
  assert.equal(plan.blocks[0].name, 'Actual Name');
  assert.equal(plan.blocks[0].avatar, '/actual.gif');
  assert.equal(plan.blocks[0].coverImage, '/actual-cover.jpg');
  assert.equal(plan.blocks[0].avatarShape, 'circle');
  assert.equal(plan.blocks[0].content, undefined);
  assert.ok(blocks.every(b => plan.blocks.some(next => next.id === b.id)));
  assert.equal(plan.blocks.find(b => b.id === 'l').image, '/linkmax.gif');
  assert.equal(plan.blocks.find(b => b.id === 'c').javascript, '');
  assert.equal(plan.blocks.find(b => b.id === 'a').autoPlay, false);
  assert.equal(plan.blocks.find(b => b.id === 'm').messengers[0].username, 'existing-contact');
  assert.equal(blocks[0].avatarShape, 'sticker');
});
