import { describe, it, expect } from 'vitest';
import { i18nReady } from '@/i18n/config';
import { buildLandingHead, getLandingFaq } from '../landing-head';
import i18n from '@/i18n/config';
import { siteRobots, requestLanguage } from '../site-policy';

describe('site indexing policy', () => {
  it('chooses a deterministic request locale independently of global i18n state', () => {
    expect(requestLanguage('/')).toBe('ru');
    expect(requestLanguage('/en')).toBe('en');
    expect(requestLanguage('/elazart', '?lang=en')).toBe('en');
    expect(requestLanguage('/ru', '?lang=en')).toBe('ru');
  });
  it('excludes private and capability-token URLs while keeping public profiles indexable', () => {
    for (const path of ['/dashboard', '/admin/users', '/auth', '/purchase/secret', '/booking/manage/secret', '/review/request/secret', '/dev/editor']) expect(siteRobots(path)).toBe('noindex, nofollow');
    expect(siteRobots('/elazart')).toContain('index, follow');
    expect(siteRobots('/experts')).toContain('index, follow');
  });
  it('uses reciprocal language canonicals and exactly the visible FAQ', async () => {
    await i18nReady;
    const head = buildLandingHead('ru', '/ru');
    expect(head.links).toContainEqual({ rel: 'canonical', href: 'https://lnkmx.my/ru' });
    expect(head.links.filter(l => l.rel === 'alternate')).toHaveLength(5);
    const graph = JSON.parse(head.scripts[0].children)['@graph'];
    expect(graph.filter((n: { '@type': string }) => n['@type'] === 'SoftwareApplication')).toHaveLength(1);
    expect(graph.find((n: { '@type': string }) => n['@type'] === 'FAQPage').mainEntity.map((q: { name: string }) => q.name)).toEqual(getLandingFaq(i18n.getFixedT('ru')).map(q => q.q));
  });
});
