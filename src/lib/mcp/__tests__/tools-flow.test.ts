import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ToolContext } from '@lovable.dev/mcp-js';

/** In-memory stand-in for the draft RPCs and the pages table, enough to drive the tools end to end. */
const db = vi.hoisted(() => ({
  draft: null as null | Record<string, any>,
  calls: [] as Array<{ name: string; args: Record<string, unknown> }>,
  published: false,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => {
      const chain: any = {
        select: () => chain, eq: () => chain,
        maybeSingle: async () => ({ data: { id: 'page-1', slug: 'aigerim', is_published: db.published }, error: null }),
      };
      return chain;
    },
    rpc: async (name: string, args: Record<string, unknown>) => {
      db.calls.push({ name, args });
      if (name === 'mcp_create_user_page') return { data: [{ id: 'page-1', slug: 'aigerim' }], error: null };
      if (name === 'load_page_draft') {
        db.draft ??= { page_id: 'page-1', snapshot: { id: 'page-1', blocks: [] }, revision: 0, base_published_revision: 0, published_draft_revision: 0, chatbot_context: 'secret bot context' };
        return { data: db.draft, error: null };
      }
      if (name === 'save_page_draft') {
        if (args.p_expected_revision !== db.draft!.revision) return { data: null, error: { code: '40001', message: 'draft_conflict' } };
        db.draft = { ...db.draft!, snapshot: args.p_snapshot, revision: db.draft!.revision + 1, chatbot_context: args.p_chatbot_context };
        return { data: db.draft, error: null };
      }
      if (name === 'publish_page_draft') {
        if (!(db.draft!.snapshot.blocks as any[]).some((b) => b.type === 'profile')) return { data: null, error: { code: '22023', message: 'draft_profile_required' } };
        db.published = true;
        db.draft = { ...db.draft!, published_draft_revision: db.draft!.revision, slug: 'aigerim' };
        return { data: db.draft, error: null };
      }
      return { data: null, error: { code: 'PGRST202', message: 'unknown rpc' } };
    },
  }),
}));

import mcp from '../index';

const ctx = {
  isAuthenticated: () => true,
  getUserId: () => 'user-1',
  getToken: () => 'token',
} as unknown as ToolContext;

function tool(name: string) {
  const found = mcp.tools.find((t) => t.name === name);
  if (!found) throw new Error(name);
  return (args: Record<string, unknown>) => found.handler(args as never, ctx) as Promise<{ structuredContent?: any; isError?: boolean }>;
}

describe('MCP tool flow', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon';
    db.draft = null; db.calls = []; db.published = false;
  });

  it('creates a page, fills it, translates it and publishes without touching the chatbot context', async () => {
    const created = await tool('create_page')({ slug: 'aigerim', name: 'Айгерим', bio: 'Маникюр в Алматы' });
    expect(created.structuredContent).toMatchObject({ page: { id: 'page-1', url: 'https://lnkmx.my/aigerim' }, profile_block_created: true });

    const edited = await tool('edit_page')({ page_id: 'page-1', operations: [
      { op: 'add_block', block: { type: 'messenger', messengers: [{ platform: 'whatsapp', username: '77001234567' }] } },
      { op: 'add_block', block: { type: 'faq', items: [{ question: 'Сколько стоит?', answer: '8000 ₸' }] } },
    ] });
    expect(edited.isError).toBeFalsy();
    expect(edited.structuredContent.blocks.map((b: any) => b.type)).toEqual(['profile', 'messenger', 'faq']);

    const gaps = await tool('get_translation_gaps')({ page_id: 'page-1', languages: ['en'] });
    const faqGap = gaps.structuredContent.gaps.find((g: any) => g.path === 'items[0].question');
    const applied = await tool('apply_translations')({ page_id: 'page-1', translations: [
      { block_id: faqGap.block_id, path: faqGap.path, language: 'en', text: 'How much is it?' },
    ] });
    expect(applied.structuredContent).toMatchObject({ applied: 1 });

    const published = await tool('publish_page')({ page_id: 'page-1' });
    expect(published.structuredContent).toMatchObject({ published: true, url: 'https://lnkmx.my/aigerim' });

    const saves = db.calls.filter((c) => c.name === 'save_page_draft');
    expect(saves.every((c) => c.args.p_chatbot_context === 'secret bot context')).toBe(true);
  });

  it('rejects a reserved slug and reports bad operations without saving', async () => {
    const reserved = await tool('create_page')({ slug: 'pricing', name: 'X' });
    expect(reserved.structuredContent).toMatchObject({ error: 'slug_reserved' });

    const bad = await tool('edit_page')({ page_id: 'page-1', operations: [{ op: 'remove_block', block_id: 'nope' }] });
    expect(bad.structuredContent).toMatchObject({ error: 'invalid_operation' });
    expect(db.calls.some((c) => c.name === 'save_page_draft')).toBe(false);
  });

  it('explains how to publish a page that has no profile yet', async () => {
    const result = await tool('publish_page')({ page_id: 'page-1' });
    expect(result.structuredContent).toMatchObject({ error: 'profile_required' });
  });
});
