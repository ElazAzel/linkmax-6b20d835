import { describe, expect, it } from 'vitest';
import { applyOperations, OperationError } from '../page-ops';
import type { DraftSnapshot } from '../draft';

const base = (): DraftSnapshot => ({
  id: 'p1',
  blocks: [
    { id: 'profile-1', type: 'profile', name: 'Айгерим', bio: 'Маникюр' },
    { id: 'link-1', type: 'link', title: 'Instagram', url: 'https://instagram.com/a' },
  ],
});

describe('applyOperations', () => {
  it('adds a block with a generated id, default size and item ids', () => {
    const { snapshot, changes } = applyOperations(base(), [
      { op: 'add_block', block: { type: 'faq', items: [{ question: 'Q?', answer: 'A.' }] }, after_block_id: 'profile-1' },
    ]);
    const faq = snapshot.blocks[1];
    expect(faq.type).toBe('faq');
    expect(faq.id).toMatch(/^faq-/);
    expect(faq.blockSize).toBe('wide');
    expect((faq.items as Array<{ id: string }>)[0].id).toBe(`${faq.id}-1`);
    expect(changes[0]).toContain('added faq');
  });

  it('is atomic: one bad operation rejects the whole batch', () => {
    const original = base();
    expect(() => applyOperations(original, [
      { op: 'update_block', block_id: 'link-1', changes: { title: 'New' } },
      { op: 'remove_block', block_id: 'missing' },
    ])).toThrow(OperationError);
    expect(original.blocks[1].title).toBe('Instagram');
  });

  it('refuses types outside the catalog, missing required fields and a second profile', () => {
    expect(() => applyOperations(base(), [{ op: 'add_block', block: { type: 'custom_code', html: '<script>' } }])).toThrow(/cannot be created/);
    expect(() => applyOperations(base(), [{ op: 'add_block', block: { type: 'button', title: 'Go' } }])).toThrow(/needs url/);
    expect(() => applyOperations(base(), [{ op: 'add_block', block: { type: 'profile', name: 'X' } }])).toThrow(/already has a profile/);
  });

  it('keeps the profile first and protects id/type', () => {
    expect(() => applyOperations(base(), [{ op: 'remove_block', block_id: 'profile-1' }])).toThrow(/cannot be removed/);
    expect(() => applyOperations(base(), [{ op: 'update_block', block_id: 'link-1', changes: { type: 'button' } }])).toThrow(/cannot change/);
    const { snapshot } = applyOperations(base(), [{ op: 'move_block', block_id: 'link-1', position: 0 }]);
    expect(snapshot.blocks[0].type).toBe('profile');
  });

  it('merges updates, removes null fields and warns about unsafe urls', () => {
    const { snapshot, warnings } = applyOperations(base(), [
      { op: 'update_block', block_id: 'link-1', changes: { url: 'instagram.com/a', title: null }, size: 'small' },
    ]);
    expect(snapshot.blocks[1]).toMatchObject({ url: 'instagram.com/a', blockSize: 'small' });
    expect(snapshot.blocks[1]).not.toHaveProperty('title');
    expect(warnings[0]).toContain('https://');
  });

  it('writes SEO and local fields with set_page', () => {
    const { snapshot } = applyOperations(base(), [{ op: 'set_page', fields: { seo_title: 'T', city: 'Алматы', is_indexable: false } }]);
    expect(snapshot.seo).toMatchObject({ title: 'T' });
    expect(snapshot.city).toBe('Алматы');
    expect(snapshot.isIndexable).toBe(false);
  });
});
