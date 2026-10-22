import { describe, expect, it } from 'vitest';
import { resolvePublicService, buildServiceHead } from '../service-page';
import type { PublicPageData } from '../public-page-snapshot';

const page = {
  slug: 'alice', title: 'Алиса', isIndexable: true,
  serviceSlugs: { one: { slug: 'manicure', state: 'active', title: 'Маникюр' } },
  blocks: [{ id: 'p', type: 'pricing', items: [{ id: 'one', name: 'Маникюр', description: 'Покрытие и уход', price: 7000, currency: 'KZT' }] }],
} as unknown as PublicPageData;

describe('server service pages', () => {
  it('resolves published pricing by stable mapping and produces its own canonical and Service schema', () => {
    const result = resolvePublicService(page, 'manicure');
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') throw new Error('Expected service');
    expect(result.service.name).toBe('Маникюр');
    const head = buildServiceHead(result);
    expect(head.links[0].href).toBe('https://lnkmx.my/alice/services/manicure');
    expect(head.meta[0].title).toContain('Маникюр');
    expect(JSON.parse(head.scripts[0].children)['@type']).toBe('Service');
  });
  it('keeps thin and opted-out pages out of the index and hides scheduled pricing', () => {
    const result = resolvePublicService({ ...page, isIndexable: false }, 'manicure');
    if (result.status !== 'ok') throw new Error('Expected service');
    expect(buildServiceHead(result).meta).toContainEqual({ name: 'robots', content: 'noindex, follow' });
    expect(resolvePublicService({ ...page, blocks: page.blocks.map(b => ({ ...b, schedule: { startDate: '2099-01-01' } })) }, 'manicure').status).toBe('redirect');
  });
  it('redirects removed mappings and reports unknown services as missing', () => {
    expect(resolvePublicService({ ...page, blocks: [] }, 'manicure').status).toBe('redirect');
    expect(resolvePublicService(page, 'missing').status).toBe('missing');
  });
});
