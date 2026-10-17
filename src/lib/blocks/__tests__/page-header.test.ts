import { describe, expect, it } from 'vitest';
import type { Block } from '@/types/page';
import { withPageHeader } from '../page-header';

describe('withPageHeader', () => {
  const text = { id: 't', type: 'text', content: 'Мои услуги' } as unknown as Block;

  it('adds a header from the page title when a page has no profile block', () => {
    const blocks = withPageHeader([text], { id: 'p1', seo: { title: 'Айгуль Муканова', description: 'Психолог' } });
    expect(blocks[0]).toMatchObject({ type: 'profile', name: 'Айгуль Муканова', bio: 'Психолог' });
    expect(blocks[1]).toBe(text);
  });

  it('keeps pages that already have a profile, or no title, as they are', () => {
    const profile = { id: 'pr', type: 'profile', name: 'X' } as unknown as Block;
    const withProfile = [profile, text];
    expect(withPageHeader(withProfile, { seo: { title: 'Y' } })).toBe(withProfile);
    expect(withPageHeader([text], { seo: { title: ' ' } })).toEqual([text]);
  });
});
