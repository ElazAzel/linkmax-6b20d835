import { assertStringIncludes } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { buildGalleryHtml, buildLandingHtml } from './ssr-templates.ts';

Deno.test('buildLandingHtml contains canonical and FAQ', () => {
  const html = buildLandingHtml('ru', 'https://lnkmx.my');
  assertStringIncludes(html, '<link rel="canonical" href="https://lnkmx.my/">');
  assertStringIncludes(html, 'FAQ');
});

Deno.test('buildGalleryHtml renders ItemList and cards', () => {
  const html = buildGalleryHtml('en', 'https://lnkmx.my', [
    { slug: 'demo', title: 'Demo Page', description: 'Demo description', avatar_url: null, niche: 'business' },
  ]);
  assertStringIncludes(html, 'ItemList');
  assertStringIncludes(html, 'Demo Page');
});
