import { describe, expect, it, vi } from 'vitest';
import { buildDirectoryHead, loadExpertDirectory } from '../directory-seo';

const fetchProfiles = vi.fn();
vi.mock('@/services/pages', () => ({ fetchExpertDirectoryProfiles: (...args: unknown[]) => fetchProfiles(...args) }));

describe('server directory discovery', () => {
  it('loads profiles before rendering, deduplicates city aliases and supplies the fallback', async () => {
    fetchProfiles.mockImplementation(async ({ city }) => city ? [{ id: 'one', slug: 'alice' }] : [{ id: 'two', slug: 'bob' }]);
    const snapshot = await loadExpertDirectory({ tag: 'beauty', city: 'almaty' }, new URLSearchParams());
    expect(snapshot.experts.map(p => p.slug)).toEqual(['alice']);
    expect(snapshot.fallbackExperts.map(p => p.slug)).toEqual(['bob']);
  });

  it('does not turn backend failures into an indexable empty directory', async () => {
    fetchProfiles.mockRejectedValue(new Error('offline'));
    await expect(loadExpertDirectory({}, new URLSearchParams())).rejects.toThrow('offline');
  });

  it('emits canonical, distinct metadata and safe JSON-LD in the server head', () => {
    const head = buildDirectoryHead('experts', { tag: 'beauty', city: 'almaty' }, new URLSearchParams(), [{ slug: 'alice', title: '</script><script>oops' }]);
    expect(head.meta[0].title).toContain('Алматы');
    expect(head.links).toContainEqual({ rel: 'canonical', href: 'https://lnkmx.my/experts/beauty/almaty' });
    expect(head.scripts[0].children).toContain('https://lnkmx.my/alice');
    expect(head.scripts[0].children).not.toContain('</script>');
    expect(JSON.parse(head.scripts[0].children).mainEntity.itemListElement).toHaveLength(1);
  });

  it('keeps filter variants out of the index and canonicalizes to the clean collection', () => {
    const head = buildDirectoryHead('gallery', {}, new URLSearchParams('q=alice&niche=beauty'), []);
    expect(head.meta).toContainEqual({ name: 'robots', content: 'noindex, follow' });
    expect(head.links).toContainEqual({ rel: 'canonical', href: 'https://lnkmx.my/gallery' });
  });
});
