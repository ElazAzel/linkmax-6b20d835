import { expect, it } from 'vitest';
import { marketingMetadata } from '../marketing-metadata';
import { NICHE_LANDINGS } from '@/lib/niche-landing-data';
import { listBlogPosts } from '@/lib/blog-posts';
import { i18nReady } from '@/i18n/config';

it('gives every implemented landing and article its own server metadata', async () => {
  await i18nReady;
  for (const landing of NICHE_LANDINGS) {
    expect(marketingMetadata(landing.canonicalPath)).toEqual({ title: landing.seoTitle, description: landing.seoDescription, canonical: `https://lnkmx.my${landing.canonicalPath}` });
  }
  for (const post of listBlogPosts()) {
    const meta = marketingMetadata(`/blog/${post.slug}`)!;
    expect(meta.title).toBe(post.metaTitle || post.title);
    expect(meta.canonical).toBe(`https://lnkmx.my/blog/${post.slug}`);
  }
  expect(marketingMetadata('/dlya/not-implemented')).toBeNull();
  expect(marketingMetadata('/elazart')).toBeNull();
  expect(marketingMetadata('/pricing')?.title).not.toBe('pricing.seo.title');
});
