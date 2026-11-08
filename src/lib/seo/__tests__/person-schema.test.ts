import { describe, expect, it } from 'vitest';
import { generateGEOSchemas } from '../geo-schemas';
import { generateAnswerBlock } from '../answer-block';
import type { Block } from '@/types/page';

const blocks = [
  { id: 'p', type: 'profile', name: 'Ильяс Азелханов', bio: 'Превращаю идеи в работающие продукты.' },
] as unknown as Block[];

const person = (extra: { profession?: string; city?: string }) => {
  const { graph } = generateGEOSchemas(blocks, {
    slug: 'elazart',
    name: 'Ильяс Азелханов',
    answerBlock: { ...generateAnswerBlock(blocks, 'elazart', 'ru'), entityType: 'Person' },
    sameAs: [],
    language: 'ru',
    ...extra,
  });
  return (graph as Array<Record<string, unknown>>).find((node) => node['@type'] === 'Person');
};

describe('Person schema', () => {
  it('uses the owner-set profession and city', () => {
    const node = person({ profession: 'AI Product Builder, DevRel', city: 'Алматы' });
    expect(node?.jobTitle).toEqual(['AI Product Builder', 'DevRel']);
    expect(node?.homeLocation).toEqual({ '@type': 'Place', name: 'Алматы' });
  });

  it('lists several roles separately', () => {
    expect(person({ profession: 'CEO LinkMAX, DevRel BCC Hub' })?.jobTitle).toEqual(['CEO LinkMAX', 'DevRel BCC Hub']);
  });

  it('omits both when nothing is known', () => {
    const node = person({});
    expect(node?.homeLocation).toBeUndefined();
  });
});
