import { describe, expect, it, vi } from 'vitest';
import type { Block, PageData } from '@/types/page';
import { buildMissingPageHead, buildPublicPageHead, computePublicPageSeo, normalizeSameAs, safeJsonLd, toPlainText } from '../public-page-seo';
import { fetchPublicPageSnapshot, snapshotBlocks } from '../public-page-snapshot';
import { buildProfileMarkdown } from '../profile-markdown';

const blocks = [
  {
    id: 'profile-1',
    type: 'profile',
    name: { ru: 'Ильяс Азелханов', en: 'Ilyas Azelkhanov' },
    bio: { ru: 'DevRel в [BCC Hub](https://bcchub.kz), AI-product builder из Алматы.' },
    avatar: 'https://cdn.example.com/a.png',
  },
  {
    id: 'socials-1',
    type: 'socials',
    platforms: [
      { id: '1', url: 'https://instagram.com/elazart', name: 'Instagram' },
      { id: '2', url: 'https://web.telegram.org/#@Elazart', name: { ru: 'Телеграм', en: 'Telegram' } },
      { id: '3', url: 'https://instagram.com/elazart/', name: 'dup' },
    ],
  },
  { id: 'text-1', type: 'text', style: 'heading', content: { ru: 'Мои проекты' } },
  { id: 'image-1', type: 'image', url: 'https://cdn.example.com/p.png', alt: 'Beautiful workspace', link: 'https://certs.example.com/' },
] as unknown as Block[];

const page = {
  id: 'p1',
  slug: 'elazart',
  blocks,
  theme: {} as PageData['theme'],
  seo: { title: '', description: '', keywords: [] },
  isIndexable: true,
  updatedAt: '2026-10-15T17:12:11.000Z',
  createdAt: '2026-01-27T10:00:00.000Z',
} as PageData;

describe('public page SEO', () => {
  it('strips markdown for meta text', () => {
    expect(toPlainText('DevRel в [BCC Hub](https://x.y) **сейчас**')).toBe('DevRel в BCC Hub сейчас');
  });

  it('normalizes sameAs: canonical Telegram, no duplicates, http(s) only', () => {
    expect(normalizeSameAs([
      'https://web.telegram.org/#@Elazart',
      'https://instagram.com/elazart',
      'https://instagram.com/elazart/',
      'mailto:a@b.c',
    ])).toEqual(['https://t.me/Elazart', 'https://instagram.com/elazart']);
  });

  it('builds a Person graph with sameAs, real dates and the canonical URL', () => {
    const seo = computePublicPageSeo(page, { language: 'ru' });
    expect(seo.meta.canonical).toBe('https://lnkmx.my/elazart');
    expect(seo.meta.robots).toMatch(/^index, follow/);
    expect(seo.meta.description).not.toContain('](');
    const graph = JSON.parse(seo.jsonLd)['@graph'] as Array<Record<string, unknown>>;
    const person = graph.find((n) => n['@type'] === 'Person');
    const profilePage = graph.find((n) => n['@type'] === 'ProfilePage');
    expect(person?.sameAs).toEqual(['https://instagram.com/elazart', 'https://t.me/Elazart']);
    expect(String(person?.description)).toContain('DevRel в BCC Hub');
    expect(profilePage?.dateModified).toBe('2026-10-15T17:12:11.000Z');
    expect(profilePage?.dateCreated).toBe('2026-01-27T10:00:00.000Z');
    expect(JSON.stringify(profilePage)).toContain('LinkMAX');
  });

  it('respects the owner opting out of indexing', () => {
    const head = buildPublicPageHead({ ...page, isIndexable: false });
    expect(head.meta).toContainEqual({ name: 'robots', content: 'noindex, follow' });
  });

  it('emits canonical, llms.txt link and escaped JSON-LD in the route head', () => {
    const head = buildPublicPageHead(page);
    expect(head.links).toContainEqual({ rel: 'canonical', href: 'https://lnkmx.my/elazart' });
    expect(head.links.some((l) => l.href === 'https://lnkmx.my/elazart/llms.txt')).toBe(true);
    expect(head.meta.find((m) => 'title' in m)?.title).toContain('Ильяс Азелханов');
    expect(head.scripts[0].children).not.toContain('</');
    expect(buildMissingPageHead().meta).toContainEqual({ name: 'robots', content: 'noindex, follow' });
  });

  it('shares an avatar-only page as a compact card with the author as tab icon', () => {
    const head = buildPublicPageHead(page);
    const meta = (key: string) => head.meta.find((m) => m.property === key || m.name === key)?.content;
    expect(meta('og:image')).toBe('https://cdn.example.com/a.png');
    expect(meta('twitter:card')).toBe('summary');
    expect(meta('og:title')).toBe('Ильяс Азелханов');
    expect(head.links).toContainEqual({ rel: 'icon', href: 'https://cdn.example.com/a.png' });
  });

  it('treats a custom page preview as a wide image', () => {
    const head = buildPublicPageHead({ ...page, blocks: page.blocks.map((b) => (b.type === 'profile' ? { ...b, avatar: undefined } : b)), previewUrl: 'https://cdn.example.com/preview.jpg' } as typeof page);
    const meta = (key: string) => head.meta.find((m) => m.property === key || m.name === key)?.content;
    expect(meta('og:image')).toBe('https://cdn.example.com/preview.jpg');
    expect(meta('twitter:card')).toBe('summary_large_image');
  });

  it('uses the large card when the profile has a cover', () => {
    const withCover = { ...page, blocks: page.blocks.map((b) => (b.type === 'profile' ? { ...b, coverImage: 'https://cdn.example.com/cover.jpg' } : b)) };
    const head = buildPublicPageHead(withCover as typeof page);
    const meta = (key: string) => head.meta.find((m) => m.property === key || m.name === key)?.content;
    expect(meta('og:image')).toBe('https://cdn.example.com/cover.jpg');
    expect(meta('twitter:card')).toBe('summary_large_image');
  });

  it('escapes script-breaking characters in JSON-LD', () => {
    expect(safeJsonLd('{"a":"</script><b>&"}')).toBe('{"a":"\\u003c/script\\u003e\\u003cb\\u003e\\u0026"}');
  });
});

describe('public page snapshot', () => {
  it('orders blocks by position and drops duplicates', () => {
    const result = snapshotBlocks([
      { position: 2, content: { id: 'b', type: 'text' } },
      { position: 1, content: { id: 'a', type: 'text' } },
      { position: 3, content: { id: 'a', type: 'text' } },
    ]);
    expect(result.map((b) => b.id)).toEqual(['a', 'b']);
  });

  it('requests tombstone metadata and excludes removed content from published snapshots', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      id: 'page-1', slug: 'alice', is_published: true, theme_settings: {},
      blocks: [
        { position: 0, deleted_at: null, content: { id: 'visible', type: 'text', content: { ru: 'Visible text' } } },
        { position: 1, deleted_at: '2026-10-15T10:00:00Z', content: { id: 'removed', type: 'text', content: { ru: 'Removed private text' } } },
      ],
    }]), { status: 200 }));
    const snapshot = await fetchPublicPageSnapshot('alice', { fetchImpl });
    const requestUrl = new URL(String(fetchImpl.mock.calls[0][0]));
    expect(requestUrl.searchParams.get('select')).toContain('blocks(position,deleted_at,content)');
    expect(snapshot.status).toBe('ok');
    if (snapshot.status !== 'ok') throw new Error('Expected a public page');
    expect(snapshot.page.blocks.map(block => block.id)).toEqual(['visible']);
    expect(buildProfileMarkdown(snapshot.page)).not.toContain('Removed private text');
  });

  it('reports missing pages and rejects impossible slugs without a request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }));
    expect(await fetchPublicPageSnapshot('../etc', { fetchImpl })).toEqual({ status: 'missing' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(await fetchPublicPageSnapshot('nobody', { fetchImpl })).toEqual({ status: 'missing' });
  });

  it('treats server errors as errors (never as a missing page)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 500 }));
    expect(await fetchPublicPageSnapshot('elazart', { fetchImpl })).toEqual({ status: 'error' });
  });
});

describe('profile markdown (llms.txt)', () => {
  it('lists card and tile links for crawlers', () => {
    const md = buildProfileMarkdown({ ...page, blocks: [
      ...page.blocks,
      { id: 'card-1', type: 'card', title: { ru: 'Шоурум' }, text: 'Алматы, Аль-Фараби 116', url: 'https://example.com/book' },
      { id: 'tiles-1', type: 'tiles', title: 'Пресса', items: [{ id: '1', title: 'ELLE', url: 'https://elle.kz/a' }, { id: '2', title: 'Bad', url: 'javascript:alert(1)' }] },
    ] as unknown as Block[] });
    expect(md).toContain('- [Шоурум](https://example.com/book)');
    expect(md).toContain('  Алматы, Аль-Фараби 116');
    expect(md).toContain('### Пресса');
    expect(md).toContain('- [ELLE](https://elle.kz/a)');
    expect(md).not.toContain('javascript:');
  });

  it('contains only owner-published facts', () => {
    const md = buildProfileMarkdown(page);
    expect(md).toContain('# Ильяс Азелханов');
    expect(md).toContain('- https://t.me/Elazart');
    expect(md).toContain('### Мои проекты');
    expect(md).toContain('[certs.example.com](https://certs.example.com/)');
    expect(md).toContain('Source: https://lnkmx.my/elazart');
    expect(md).not.toMatch(/Вопросы и ответы|FAQ/);
  });
});
