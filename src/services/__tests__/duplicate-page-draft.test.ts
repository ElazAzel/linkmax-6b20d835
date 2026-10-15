import { expect, it, vi } from 'vitest';
import { duplicatePageDraft } from '../duplicate-page-draft';
import { loadPageDraft, savePageDraft } from '../page-drafts';
import { createBlock } from '@/lib/blocks/block-factory';
import type { PageDraft } from '../page-drafts';

vi.mock('../page-drafts', () => ({ loadPageDraft: vi.fn(), savePageDraft: vi.fn() }));

it('copies the saved private content into the new identity and awaits its save', async () => {
  const source: PageDraft = { page_id:'source', revision:2, base_published_revision:0, updated_at:'', snapshot: { id: 'source', slug: 'source', blocks: [createBlock('text'), createBlock('event')], theme: { backgroundColor: 'red', textColor:'#1F1F1F', buttonStyle:'rounded', fontFamily:'sans' }, seo: {title:'Private',description:'',keywords:[]} }, chatbot_context: 'private context' };
  const target: PageDraft = { page_id:'target', chatbot_context:'', updated_at:'', snapshot: { id:'target', slug:'target-copy', userId:'owner', organization_id:'org', blocks:[], theme:source.snapshot.theme, seo:source.snapshot.seo }, revision:0, base_published_revision:0 };
  vi.mocked(loadPageDraft).mockImplementation(async id => id === 'source' ? source : target);
  let release!: () => void;
  vi.mocked(savePageDraft).mockImplementation(() => new Promise(resolve => { release = () => resolve(target); }));
  let finished = false;
  const copying = duplicatePageDraft('source', 'target').then(() => { finished = true; });
  await vi.waitFor(() => expect(savePageDraft).toHaveBeenCalled());
  expect(finished).toBe(false);
  const [snapshot, revision, base, context] = vi.mocked(savePageDraft).mock.calls[0];
  expect(snapshot).toMatchObject({ id:'target', slug:'target-copy', userId:'owner', organization_id:'org', theme: {backgroundColor:'red'}, seo:{title:'Private'}, isPublished:false });
  expect(snapshot.blocks.map(block => block.type)).toEqual(['text']);
  expect(snapshot.blocks[0].id).not.toBe(source.snapshot.blocks[0].id);
  expect([revision, base, context]).toEqual([0,0,'private context']);
  release(); await copying;
  expect(finished).toBe(true);
});
