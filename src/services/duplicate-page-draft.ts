import { loadPageDraft, savePageDraft } from './page-drafts';

/** Initialize the private copy before the editor is allowed to load it. */
export async function duplicatePageDraft(sourcePageId: string, targetPageId: string) {
  const source = await loadPageDraft(sourcePageId);
  const target = await loadPageDraft(targetPageId);
  const snapshot = {
    ...target.snapshot,
    blocks: source.snapshot.blocks
      // Events have independent backend records and cannot share their identity.
      .filter(block => block.type !== 'event')
      .map(block => ({ ...block, id: crypto.randomUUID() })),
    theme: source.snapshot.theme,
    seo: source.snapshot.seo,
    editorMode: source.snapshot.editorMode,
    gridConfig: source.snapshot.gridConfig,
    niche: source.snapshot.niche,
    favicon_url: source.snapshot.favicon_url,
    hideBranding: source.snapshot.hideBranding,
    isPublished: false,
  };
  return savePageDraft(snapshot, target.revision, target.base_published_revision, source.chatbot_context);
}
