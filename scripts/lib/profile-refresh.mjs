import { createHash } from 'node:crypto';
import { DEMO_ACCOUNTS } from '../../supabase/functions/seed-demo-accounts/demo-data.ts';

const RUN_KEY = 'profile-refresh-2026-10-21-v1';
const palette = {
  beauty: ['#fff2f7', '#351c30', '#a52b66', 'blush-lavender'],
  fitness: ['#101b18', '#f5fff7', '#96d89b', 'graphite'],
  food: ['#fff8eb', '#3b2416', '#bd541f', 'warm-paper'],
  education: ['#f0f6f1', '#173021', '#366c4c', 'matcha'],
  art: ['#15151d', '#f7f5ff', '#b4a4ff', 'graphite'],
  music: ['#0c101b', '#f3f7ff', '#88a5ff', 'graphite'],
  tech: ['#0c121b', '#f4f7ff', '#87acff', 'graphite'],
  business: ['#f5f4f0', '#1d2529', '#285e68', 'warm-paper'],
  health: ['#f5f5ee', '#25322d', '#46715b', 'matcha'],
  fashion: ['#191319', '#f8eff6', '#de97c3', 'graphite'],
  travel: ['#eef7f4', '#163831', '#217b71', 'matcha'],
  realty: ['#f1f4f8', '#152b3b', '#2955a6', 'sky-clean'],
  events: ['#fff4ed', '#3f2737', '#bb4275', 'warm-paper'],
  services: ['#f1f5f9', '#18283b', '#2d5bc7', 'classic'],
};
const introductions = {
  beauty: 'Уход, детали и выразительные образы. Выберите формат, который подходит именно вам.',
  fitness: 'Движение в вашем темпе. Персональные занятия, понятная программа и последовательная работа.',
  food: 'Вкус, который объединяет. Авторские блюда и десерты для ваших особенных моментов.',
  education: 'Знания, которые превращаются в навык. Понятная программа, практика и внимание к вашим целям.',
  art: 'Идеи, которые обретают форму. Творческие проекты, визуальные истории и внимание к деталям.',
  music: 'Найдите своё звучание. Музыка, работа с голосом и атмосфера, которую хочется запомнить.',
  tech: 'От задачи к работающему решению. Цифровые продукты и обучение современным технологиям.',
  business: 'Больше ясности в делах. Практичные решения для бизнеса и внимание к вашей задаче.',
  health: 'Время для себя. Спокойное пространство, бережный подход и удобный формат встречи.',
  fashion: 'Стиль с вашим характером. Продуманные образы, интересные сочетания и внимание к деталям.',
  travel: 'Новые места и впечатления. Выберите направление, формат и свой темп путешествия.',
  realty: 'Пространство для нового этапа. Подбор недвижимости и понятные шаги на пути к решению.',
  events: 'События, которые хочется вспоминать. Идея, организация и внимание к каждому моменту.',
  services: 'Задачи решаются проще, когда рядом специалист. Выберите услугу и удобный формат работы.',
};

function stableId(pageId, key) {
  const hash = createHash('sha256').update(`linkmax/profile-refresh/${pageId}/${key}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}
function text(value) {
  if (value && typeof value === 'object') return String(value.ru || value.en || value.kk || '');
  if (typeof value !== 'string') return '';
  if (value.startsWith('{')) { try { return text(JSON.parse(value)); } catch { /* ordinary text */ } }
  return value;
}
function photo(url, width = 1000) {
  if (!url || !/^https:\/\//.test(url)) return '';
  const parsed = new URL(url);
  if (parsed.hostname === 'images.unsplash.com') {
    parsed.searchParams.set('w', String(width));
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', 'crop');
    parsed.searchParams.set('q', '82');
  }
  return parsed.href;
}
export function standardizeAvatar(block) {
  if (block.type === 'profile') return { ...block, avatarShape: 'circle' };
  if (block.type === 'avatar') return { ...block, shape: 'circle' };
  return { ...block };
}
function accountFor(slug) {
  return DEMO_ACCOUNTS.find(account => account.slug === (['demo_nails', 'demo-nails'].includes(slug) ? 'anna_beauty' : slug));
}
export function demoOwnerEmail(slug) {
  const account = accountFor(slug);
  return account ? `demoaccount${DEMO_ACCOUNTS.indexOf(account) + 1}@gmail.com` : null;
}
export function makeTheme(niche, overrides = {}) {
  const [canvas, ink, primary, themePreset] = palette[niche] || palette.business;
  const dark = ['fitness', 'art', 'music', 'tech', 'fashion'].includes(niche);
  return {
    themePreset, appearanceMode: 'v2', schemaVersion: 2,
    backgroundColor: canvas, textColor: ink, accentColor: primary,
    accentButton: primary, accentLink: primary, accentActive: primary,
    buttonStyle: 'rounded', fontFamily: 'sans', fontPair: 'space-dm',
    blockShape: 'rounded', blockShadow: 'none', blockHover: 'lift', divider: 'none',
    animationStyle: 'gentle', iconStyle: 'rounded', darkMode: dark,
    colors: { canvas, surface: dark ? '#171e29' : '#ffffff', text: ink, mutedText: dark ? '#b2bbcd' : '#58636b', primary, primaryText: dark ? '#111621' : '#ffffff', secondary: primary, border: dark ? '#323b4b' : '#d5ddd9', focus: primary, success: '#21825c', warning: '#b76b10', danger: '#c73f4c' },
    radii: { block: 16, card: 16, control: 12, image: 12 },
    spacing: { pagePadding: 20, blockGap: 18, sectionGap: 36, density: 'comfortable' },
    typography: { headingFamily: 'Onest', bodyFamily: 'Golos Text', monoFamily: 'JetBrains Mono', headingWeight: 700, bodyWeight: 400, scale: 'balanced' },
    motionLevel: 'standard', imageTreatment: 'natural', ...overrides,
  };
}
function basePlan(row, kind) {
  return {
    kind, slug: row.slug, pageId: row.page.id, userId: row.page.user_id,
    expectedPublishedRevision: row.page.published_revision ?? 0,
    expectedIsPublished: Boolean(row.page.is_published),
    expectedDraftRevision: row.draft?.revision ?? null,
    expectedBlocks: row.blocks.map(b => ({ id: b.id, content: b.content })),
  };
}
export function buildDemoRefresh(row) {
  const account = accountFor(row.slug);
  if (!account) throw new Error(`${row.slug} is not a seeded demo`);
  if (row.draft && row.draft.revision !== row.draft.published_draft_revision) throw new Error(`${row.slug} has unpublished edits; review its draft before refreshing`);
  const niche = row.page.niche || account.niche;
  const peers = DEMO_ACCOUNTS.filter(a => a.niche === account.niche);
  const photos = [peers.find(a => a !== account)?.defaultAvatar || account.defaultAvatar, account.defaultAvatar].map(url => photo(url));
  const name = text(row.page.title) || account.title;
  let blocks = row.blocks.map(b => standardizeAvatar({ ...b.content, id: b.content?.id || b.id, type: b.type }));
  let profile = blocks.find(b => b.type === 'profile');
  const hasProfile = Boolean(profile);
  profile = {
    ...profile, id: profile?.id || stableId(row.page.id, 'profile'), type: 'profile',
    name, bio: introductions[niche] || introductions.business,
    avatar: profile?.avatar || row.page.avatar_url || photo(account.defaultAvatar, 480),
    avatarShape: 'circle', avatarPosition: 'left', avatarSize: 'medium', avatarFrame: 'default',
    shadowStyle: 'none', nameAnimation: 'none', verified: false, autoVerifyPremium: false,
    coverImage: profile?.coverImage || photos[0], coverHeight: 'medium', coverGradient: 'none',
    coverPosition: { x: 50, y: 35 },
    badges: [{ id: 'demo-label', kind: 'custom', label: 'Демо-страница' }], blockSize: 'full',
  };
  let mediaIndex = 0;
  blocks = blocks.map(block => {
    if (block.type === 'profile') return profile;
    if (block.type === 'product') return { ...block, image: block.image || photos[mediaIndex++ % photos.length], blockSize: 'half' };
    if (block.type === 'pricing') return { ...block, items: block.items.map(item => ({ ...item, price: typeof item.price === 'string' && /^[\d\s]+\s*₸$/.test(item.price) ? Number(item.price.replace(/[^\d]/g, '')) : item.price })) };
    if (block.type === 'text') return { ...block, alignment: 'left', content: /отзыв|говорят.*клиент/i.test(text(block.content)) ? 'Примеры отзывов' : block.content, blockStyle: { padding: 'md', animation: 'fade-in' } };
    if (block.type === 'testimonial') return { ...block, title: 'Примеры отзывов', blockSize: 'full' };
    // Seeded identities are fictional. Do not route visitors to guessed people.
    if (block.type === 'messenger') return { ...block, messengers: [] };
    if (block.type === 'socials') return { ...block, platforms: [] };
    if (block.type === 'link' || block.type === 'button') return { ...block, title: 'Создать такую страницу', url: 'https://lnkmx.my/auth' };
    return block;
  });
  if (!hasProfile) blocks.unshift(profile);
  const offers = blocks.filter(b => b.type === 'product');
  if (!offers.length && !blocks.some(b => b.type === 'pricing')) {
    blocks.splice(1, 0, { id: stableId(row.page.id, 'service-summary'), type: 'card', title: 'Форматы работы', text: introductions[niche] || introductions.business, image: photos[1], imagePosition: 'top', blockSize: 'full' });
  }
  if (!blocks.some(b => b.type === 'tiles' || b.type === 'carousel')) blocks.push({ id: stableId(row.page.id, 'gallery'), type: 'tiles', columns: 2, aspect: 'square', items: photos.map((image, index) => ({ id: `photo-${index + 1}`, image, title: index ? 'Детали и атмосфера' : 'Вдохновение' })), blockSize: 'full' });
  if (!blocks.some(b => b.type === 'faq')) blocks.push({ id: stableId(row.page.id, 'faq'), type: 'faq', items: [{ question: 'Можно ли изменить оформление?', answer: 'Да. На своей странице можно менять тему, фотографии, тексты и порядок блоков.' }, { question: 'Это настоящая компания?', answer: 'Это демонстрационная страница LinkMAX. Она показывает, как может выглядеть страница в этой сфере.' }], blockSize: 'full' });
  blocks.push({ id: stableId(row.page.id, 'demo-note'), type: 'text', content: 'Демонстрационная страница LinkMAX. Услуги, цены и отзывы приведены для примера.', style: 'paragraph', alignment: 'left', blockSize: 'full' });
  blocks.push({ id: stableId(row.page.id, 'create-page'), type: 'button', title: 'Создать свою страницу', url: 'https://lnkmx.my/auth', width: 'full', blockSize: 'full' });
  return { ...basePlan(row, 'demo'), ownerEmail: demoOwnerEmail(row.slug), blocks, theme: makeTheme(niche), seo: { ...row.page.seo_meta, title: `${name} — пример страницы LinkMAX`, description: `Демонстрационная страница: ${introductions[niche] || introductions.business}` }, editorMode: 'grid', gridConfig: { columnsDesktop: 2 } };
}

/** Personal redesign uses the owner's existing media and destinations only. */
export function buildElazartRefresh(row, { html, css }) {
  if (row.slug !== 'elazart') throw new Error('Personal redesign is scoped to elazart');
  if (!html || !css) throw new Error('The approved manifesto assets are required');
  const existing = structuredClone(row.draft?.snapshot?.blocks || row.blocks.map(b => ({ ...b.content, id: b.content?.id || b.id, type: b.type })));
  const required = (predicate, label) => {
    const block = existing.find(predicate);
    if (!block) throw new Error(`Missing original ${label}`);
    return block;
  };
  const originalProfile = required(b => b.type === 'profile', 'profile');
  const { content: legacyProfile, style: oldStyle, sectionId: oldSection, composition: oldComposition, designVariant: oldVariant, ...profile } = originalProfile;
  Object.assign(profile, {
    avatarShape: 'circle', avatarFrame: 'default', avatarSize: 'medium', avatarPosition: 'left',
    shadowStyle: 'none', nameAnimation: 'none', coverParallax: false, coverPattern: 'none',
    coverGradient: 'none', coverHeight: 'medium', coverPosition: { x: 72, y: 42 }, blockSize: 'full',
    bio: {
      ru: 'Превращаю идеи в работающие продукты.\n\nAI Product Builder · DevRel в [BCC Hub](https://www.instagram.com/bcchub.kz/)\nАлматы. Технологии, сообщества и эксперименты.',
      en: 'I turn ideas into working products.\n\nAI Product Builder · DevRel at [BCC Hub](https://www.instagram.com/bcchub.kz/)\nAlmaty. Technology, communities and experiments.',
      kk: 'Идеяларды жұмыс істейтін өнімге айналдырамын.\n\nAI Product Builder · [BCC Hub](https://www.instagram.com/bcchub.kz/) DevRel\nАлматы. Технологиялар, қауымдастықтар және тәжірибелер.',
    },
    blockStyle: { padding: 'none', borderRadius: 'lg', shadow: 'none', animation: 'fade-in' },
  });
  const socials = required(b => b.type === 'socials', 'social links');
  delete socials.composition; delete socials.designVariant; delete socials.sectionId;
  socials.platforms = socials.platforms.map(p => ({ ...p, url: p.platform === 'telegram' ? 'https://t.me/Elazart' : p.url }));
  socials.blockStyle = { padding: 'none', shadow: 'none', animation: 'none' };
  const code = required(b => b.type === 'custom_code', 'manifesto block');
  const manifesto = { id: code.id, type: 'custom_code', html, css, javascript: '', js: '', height: 'auto', interactive: true, blockSize: 'full', blockStyle: { padding: 'none', shadow: 'none', animation: 'fade-in' } };
  const oldHeading = required(b => b.type === 'text', 'project heading');
  const heading = (id, title) => ({ id, type: 'text', content: title, style: 'heading', alignment: 'left', blockSize: 'full', blockStyle: { padding: 'sm', animation: 'fade-in' } });
  const card = (original, title, detail, buttonText) => ({ id: original.id, type: 'card', title, text: detail, image: original.url, imagePosition: 'top', buttonText, url: original.link, blockSize: 'full', blockStyle: { padding: 'none', borderRadius: 'lg', shadow: 'none', animation: 'fade-in' } });
  const linkmax = required(b => b.type === 'image' && b.link?.includes('lnkmx.my'), 'LinkMAX project');
  const certificates = required(b => b.type === 'image' && b.link?.includes('certificate-generator'), 'certificate project');
  const threads = required(b => b.type === 'image' && b.link?.includes('threadssmm'), 'ThreadsSMM project');
  const projectImages = [linkmax.id, certificates.id, threads.id];
  const otherImages = existing.filter(b => b.type === 'image' && !projectImages.includes(b.id)).map(b => ({ ...b, caption: b.caption || 'Визуальные эксперименты', alt: b.alt === 'Beautiful workspace' ? 'Проекты и эксперименты Ильяса Азелханова' : b.alt, blockSize: 'full', blockStyle: { padding: 'none', borderRadius: 'lg', shadow: 'none', animation: 'fade-in' } }));
  const video = required(b => b.type === 'video', 'video destination');
  const videoId = String(video.url).match(/(?:youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{11})/)?.[1];
  if (!videoId) throw new Error('Original video URL needs review');
  const videoCard = { id: video.id, type: 'card', title: 'В кадре', text: 'Технологии и идеи — в видеоформате. Открывай и смотри на YouTube.', image: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, imagePosition: 'top', buttonText: 'Смотреть на YouTube', url: video.url, blockSize: 'full', blockStyle: { padding: 'none', borderRadius: 'lg', shadow: 'none', animation: 'fade-in' } };
  const media = required(b => b.type === 'carousel', 'media publications');
  Object.assign(media, { title: 'Публикации и выступления', autoPlay: false, blockSize: 'full', blockStyle: { padding: 'none', borderRadius: 'lg', animation: 'fade-in' } });
  delete media.composition; delete media.designVariant; delete media.sectionId;
  const contact = required(b => b.type === 'messenger', 'contact details');
  contact.title = 'Есть идея? Давай обсудим.';
  if (!contact.messengers.some(m => m.platform === 'telegram')) contact.messengers.push({ platform: 'telegram', username: 'Elazart' });
  contact.blockStyle = { padding: 'md', borderRadius: 'lg', backgroundColor: '#182247', textColor: '#f4f5f7', animation: 'fade-in' };
  delete contact.composition; delete contact.sectionId;
  const theme = makeTheme('tech', { themePreset: 'graphite', backgroundColor: '#0b0d12', textColor: '#f4f5f7', accentColor: '#4468ff', accentButton: '#4468ff', accentLink: '#8da4ff', accentActive: '#4468ff', colors: { ...makeTheme('tech').colors, canvas: '#0b0d12', surface: '#131820', text: '#f4f5f7', mutedText: '#aab3c4', primary: '#4468ff', primaryText: '#ffffff', secondary: '#8da4ff', border: '#293247', focus: '#8da4ff' } });
  return {
    ...basePlan(row, 'personal'),
    blocks: [profile, socials, manifesto, heading(oldHeading.id, 'Избранные проекты'),
      card(linkmax, 'LinkMAX', 'Мой продукт: личная страница, заявки и бизнес-инструменты в одной ссылке.', 'Открыть LinkMAX'),
      card(certificates, 'Certificate Generator', 'Генератор сертификатов для событий и образовательных проектов.', 'Открыть генератор'),
      card(threads, 'ThreadsSMM', 'Мой эксперимент с созданием контента для Threads.', 'Открыть ThreadsSMM'),
      ...otherImages, heading(stableId(row.page.id, 'media-heading'), 'На сцене и в медиа'), videoCard, media, contact],
    theme, seo: { ...row.page.seo_meta, title: 'Ильяс Азелханов / ELAZART — AI Product Builder и DevRel', description: 'Создаю AI- и digital-продукты, развиваю сообщества и объясняю технологии. LinkMAX, проекты, выступления и сотрудничество. Алматы.' },
    editorMode: 'grid', gridConfig: { columnsDesktop: 2 },
  };
}

const literal = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;

/** Produces SQL only. Execution remains in the authenticated project database UI. */
export function buildRefreshSql(plans, runKey = RUN_KEY) {
  if (!/^[a-zA-Z0-9_-]+$/.test(runKey)) throw new Error('Invalid run key');
  if (!plans.length) throw new Error('No page refreshes selected');
  const payload = literal(plans);
  let tag = '$profile_refresh$';
  while (payload.includes(tag)) tag = tag.replace(/\$$/, '_next$');
  return `BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
SET LOCAL standard_conforming_strings = on;
CREATE SCHEMA IF NOT EXISTS profile_refresh_internal;
REVOKE ALL ON SCHEMA profile_refresh_internal FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS profile_refresh_internal.page_backups (
  run_key text NOT NULL, page_id uuid NOT NULL, payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), applied_at timestamptz,
  PRIMARY KEY(run_key,page_id)
);
REVOKE ALL ON TABLE profile_refresh_internal.page_backups FROM PUBLIC, anon, authenticated;
DO ${tag}
DECLARE v jsonb; p public.pages; d public.page_drafts; saved jsonb; current_blocks jsonb;
  previous_sub text := current_setting('request.jwt.claim.sub',true);
BEGIN
  FOR v IN SELECT value FROM jsonb_array_elements(${payload}) LOOP
    IF EXISTS(SELECT 1 FROM profile_refresh_internal.page_backups WHERE run_key='${runKey}' AND page_id=(v->>'pageId')::uuid AND applied_at IS NOT NULL) THEN CONTINUE; END IF;
    SELECT * INTO p FROM public.pages WHERE id=(v->>'pageId')::uuid FOR UPDATE;
    IF p.id IS NULL OR p.slug IS DISTINCT FROM v->>'slug' OR p.user_id::text IS DISTINCT FROM v->>'userId' THEN RAISE EXCEPTION 'profile_refresh_owner_mismatch'; END IF;
    IF v->>'kind'='demo' AND NOT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=p.user_id AND u.email=v->>'ownerEmail') THEN RAISE EXCEPTION 'profile_refresh_not_seeded_demo'; END IF;
    IF v->>'kind' NOT IN ('demo','personal') THEN RAISE EXCEPTION 'profile_refresh_invalid_kind'; END IF;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id',b.id,'content',b.content) ORDER BY b.position),'[]'::jsonb) INTO current_blocks FROM public.blocks b WHERE b.page_id=p.id AND b.deleted_at IS NULL;
    IF p.is_published IS DISTINCT FROM (v->>'expectedIsPublished')::boolean OR p.published_revision IS DISTINCT FROM (v->>'expectedPublishedRevision')::bigint OR current_blocks IS DISTINCT FROM v->'expectedBlocks' THEN RAISE EXCEPTION 'profile_refresh_conflict: published page % changed',p.slug; END IF;
    SELECT * INTO d FROM public.page_drafts WHERE page_id=p.id FOR UPDATE;
    IF v->>'expectedDraftRevision' IS NOT NULL AND d.revision IS DISTINCT FROM (v->>'expectedDraftRevision')::bigint THEN RAISE EXCEPTION 'profile_refresh_conflict: draft % changed',p.slug; END IF;
    IF v->>'expectedDraftRevision' IS NULL AND d.page_id IS NOT NULL AND d.revision<>d.published_draft_revision THEN RAISE EXCEPTION 'profile_refresh_conflict: new unsaved draft %',p.slug; END IF;
    INSERT INTO profile_refresh_internal.page_backups(run_key,page_id,payload)
    VALUES('${runKey}',p.id,jsonb_build_object('page',to_jsonb(p),'blocks',(SELECT COALESCE(jsonb_agg(to_jsonb(b) ORDER BY position),'[]'::jsonb) FROM public.blocks b WHERE b.page_id=p.id),'draft',to_jsonb(d))) ON CONFLICT DO NOTHING;
    -- Maintenance runs as database owner; keep the standard owner-scoped writer,
    -- revisions, validation, snapshots and projections rather than bypassing them.
    PERFORM set_config('request.jwt.claim.sub',p.user_id::text,true);
    -- Old seeds omitted authored IDs. Backfill them before the canonical
    -- publisher matches by content.id, so analytics keep their database IDs.
    PERFORM set_config('linkmax.publishing_draft','on',true);
    UPDATE public.blocks SET content=jsonb_set(content,'{id}',to_jsonb(id::text),true)
      WHERE page_id=p.id AND deleted_at IS NULL AND NULLIF(content->>'id','') IS NULL;
    PERFORM public.load_page_draft(p.id);
    SELECT * INTO d FROM public.page_drafts WHERE page_id=p.id;
    SELECT public.save_page_draft(p.id,d.snapshot || jsonb_build_object('blocks',v->'blocks','theme',v->'theme','seo',v->'seo','editorMode',v->>'editorMode','gridConfig',v->'gridConfig'),d.revision,d.base_published_revision,d.chatbot_context) INTO saved;
    IF p.is_published THEN
      PERFORM public.publish_page_draft(p.id,(saved->>'revision')::bigint,d.base_published_revision);
    END IF;
    UPDATE profile_refresh_internal.page_backups SET applied_at=now() WHERE run_key='${runKey}' AND page_id=p.id;
  END LOOP;
  PERFORM set_config('request.jwt.claim.sub',COALESCE(previous_sub,''),true);
END ${tag};
COMMIT;
SELECT p.slug,p.published_revision,(SELECT count(*) FROM public.blocks b WHERE b.page_id=p.id AND b.deleted_at IS NULL) AS active_blocks
FROM public.pages p JOIN profile_refresh_internal.page_backups x ON x.page_id=p.id WHERE x.run_key='${runKey}' ORDER BY p.slug;
`;
}
