import { describe, expect, it } from 'vitest';
import { buildCloneTemplatePayload, sanitizeBlocksForTemplate } from '@/lib/growth/clone-template';

describe('cloneable page templates', () => {
  it('removes personal data and keeps reusable structure', () => {
    const blocks = sanitizeBlocksForTemplate([
      { id: 'profile-1', type: 'profile', name: 'Alice', bio: 'Private bio', avatar: 'secret.jpg' },
      { id: 'link-1', type: 'link', title: 'DM me', url: 'https://example.com/private' },
      { id: 'form-1', type: 'form', title: 'Contact', submitEmail: 'alice@example.com', fields: [] },
    ] as any);

    expect(blocks[0]).toMatchObject({ type: 'profile', name: 'Your name', bio: 'Describe your offer' });
    expect(blocks[0]).not.toHaveProperty('avatar');
    expect(blocks[1]).toMatchObject({ type: 'link', url: '#' });
    expect(blocks[2]).toMatchObject({ type: 'form', submitEmail: '' });
    expect(blocks.every((block) => !block.id)).toBe(true);
  });

  it('builds a reusable payload from page metadata', () => {
    const payload = buildCloneTemplatePayload({
      id: 'page-1',
      blocks: [],
      theme: { backgroundColor: '#fff', textColor: '#111', buttonStyle: 'rounded', fontFamily: 'sans' },
      seo: { title: 'Coach page', description: '', keywords: [] },
      niche: 'coach',
    });
    expect(payload.name).toBe('Coach page template');
    expect(payload.category).toBe('coach');
    expect(payload.sourcePageId).toBe('page-1');
  });
});
