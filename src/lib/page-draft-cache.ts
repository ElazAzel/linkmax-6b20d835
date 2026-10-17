import type { PageData } from '@/types/page';
import { session } from '@/lib/storage';
export interface LocalPageDraft { pageData: PageData; chatbotContext: string; revision: number; base: number; dirty: boolean; publishedDraftRevision?: number }
// A second tab must not overwrite a first tab's unacknowledged recovery copy.
// The id is read once per page load: the cache-version check clears
// sessionStorage on a first visit, and a new id mid-session changed the draft
// key, so autosave skipped the first edit and the server copy replaced it.
let tabId: string | null = null;
export function pageDraftCacheKey(userId: string, pageId: string): string {
  let tab = tabId ?? 'local';
  try {
    tabId ??= session.get<string>('draft-tab') || crypto.randomUUID();
    tab = tabId;
    session.set('draft-tab', tab);
  } catch { /* SSR or restricted storage; remote CAS still protects edits. */ }
  return `${userId}:${pageId}:${tab}`;
}
