import { expect, it } from 'vitest';
import { NICHE_LANDINGS } from '@/lib/niche-landing-data';
import { listBlogPosts } from '@/lib/blog-posts';
import { ALTERNATIVE_PROFILES } from '@/lib/alternatives-data';
import { i18nReady } from '@/i18n/config';
import { loadMarketingMetadata, needsMarketingMetadata, NICHE_ROOT_PATHS } from '../marketing-route';
import { marketingMetadata } from '../marketing-metadata';

it('keeps the single-segment niche list in sync with the landing data', () => {
  const rootPaths = NICHE_LANDINGS.map((l) => l.canonicalPath).filter((p) => p.split('/').length === 2);
  expect([...NICHE_ROOT_PATHS].filter((p) => p !== '/for-masters').sort()).toEqual([...rootPaths].sort());
});

it('loads metadata for every marketing path and skips profiles', async () => {
  await i18nReady;
  const paths = [
    ...NICHE_LANDINGS.map((l) => l.canonicalPath),
    ...listBlogPosts().map((p) => `/blog/${p.slug}`),
    ...ALTERNATIVE_PROFILES.map((p) => p.route),
    '/for-masters', '/pricing', '/blog', '/terms',
  ];
  for (const path of paths) {
    expect(needsMarketingMetadata(path), path).toBe(true);
    expect(await loadMarketingMetadata(path, 'ru')).toEqual(marketingMetadata(path, 'ru'));
  }
  expect(needsMarketingMetadata(encodeURI('/для-репетиторов'))).toBe(true);
  for (const path of ['/', '/elazart', '/dashboard', '/elazart/llms.txt', '/%E0%A4%A']) {
    expect(needsMarketingMetadata(path), path).toBe(false);
  }
  expect(await loadMarketingMetadata('/elazart', 'ru')).toBeNull();
});
