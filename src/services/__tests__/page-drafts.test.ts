import { describe, expect, it, vi } from 'vitest';
import { loadPageDraft, savePageDraft, publishPageDraft } from '../page-drafts';
import type { PageData } from '@/types/page';
const { rpc, from } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock('@/platform/supabase/client', () => ({ supabase: { rpc, from } }));
describe('private draft transport', () => {
  it.each(['42703', 'PGRST204', 'PGRST205'])('recognises incomplete migrations (%s) without a public write fallback', async code => {
    rpc.mockResolvedValue({ data: null, error: { code, message: 'missing schema' } });
    await expect(publishPageDraft('page', 3, 2)).rejects.toMatchObject({ kind: 'unavailable' });
    expect(from).not.toHaveBeenCalled();
  });
  it('never falls back to a public write when deployed RPC is missing', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'not found' } });
    await expect(loadPageDraft('page')).rejects.toMatchObject({ kind: 'unavailable' });
    await expect(savePageDraft({ id: 'page', blocks: [] } as unknown as PageData, 3, 2)).rejects.toMatchObject({ kind: 'unavailable' });
    await expect(publishPageDraft('page', 3, 2)).rejects.toMatchObject({ kind: 'unavailable' });
    expect(from).not.toHaveBeenCalled();
    expect(rpc.mock.calls.every(([name]) => ['load_page_draft', 'save_page_draft', 'publish_page_draft'].includes(name))).toBe(true);
  });
  it('sends both CAS tokens and keeps server conflicts actionable', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '40001', message: 'draft_conflict' } });
    await expect(publishPageDraft('page', 3, 2)).rejects.toMatchObject({ kind: 'conflict' });
    expect(rpc).toHaveBeenLastCalledWith('publish_page_draft', { p_page_id: 'page', p_expected_revision: 3, p_base_published_revision: 2 });
  });
});
