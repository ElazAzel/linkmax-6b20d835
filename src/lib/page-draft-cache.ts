import type { PageData } from '@/types/page';
import { session } from '@/lib/storage';
export interface LocalPageDraft { pageData: PageData; chatbotContext: string; revision: number; base: number; dirty: boolean; publishedDraftRevision?: number }
// A second tab must not overwrite a first tab's unacknowledged recovery copy.
export function pageDraftCacheKey(userId: string, pageId: string): string {
  let tab = 'local';
  try {
    tab = session.get<string>('draft-tab') || crypto.randomUUID();
    session.set('draft-tab', tab);
  } catch { /* SSR or restricted storage; remote CAS still protects edits. */ }
  return `${userId}:${pageId}:${tab}`;
}
