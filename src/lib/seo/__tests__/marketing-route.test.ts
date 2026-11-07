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

it('loads metadata for every route that renders buildMarketingHead', async () => {
  const { readdirSync, readFileSync, statSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { buildMarketingHead } = await import('../marketing-head');
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? (n === '__tests__' ? [] : walk(p)) : /\.tsx?$/.test(n) ? [p] : [];
  });
  const samples: Record<string, string> = { '$slug': listBlogPosts()[0].slug, '$landingSlug': 'coach', '$competitor': ALTERNATIVE_PROFILES[0].route.split('/')[2] };
  await i18nReady;
  const routes = walk(join(process.cwd(), 'src/routes'))
    .map((file) => readFileSync(file, 'utf8'))
    .filter((src) => src.includes("from '@/lib/seo/marketing-head'"))
    .map((src) => /createFileRoute\("([^"]+)"\)/.exec(src)?.[1] ?? '');
  expect(routes.length).toBeGreaterThan(10);
  for (const route of routes) {
    const path = route.replace(/\/$/, '').replace(/\$\w+/g, (k) => samples[k]) || '/';
    expect({ route, path, ok: needsMarketingMetadata(path) }).toEqual({ route, path, ok: true });
    const marketing = await loadMarketingMetadata(path, 'ru');
    const head = buildMarketingHead({ pathname: path, context: { marketing } });
    expect(head.links?.[0]?.rel, route).toBe('canonical');
  }
});
