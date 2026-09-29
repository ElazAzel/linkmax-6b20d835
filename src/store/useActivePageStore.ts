import { create } from 'zustand';
import { storage } from '@/lib/storage';

/**
 * Single source of truth for the page the dashboard is working on.
 *
 * Previously every `useMultiPage()` / `useCloudPageState()` instance kept its
 * own idea of the active page: the page switcher changed one copy while the
 * editor kept editing another, and settings could write to a third. All of
 * them now read and write this store.
 */
const ACTIVE_PAGE_KEY = 'active_page_id';

interface ActivePageState {
  activePageId: string | null;
  setActivePageId: (pageId: string | null) => void;
}

function readInitial(): string | null {
  try {
    return storage.get<string>(ACTIVE_PAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export const useActivePageStore = create<ActivePageState>((set) => ({
  activePageId: readInitial(),
  setActivePageId: (pageId) => {
    try {
      if (pageId) storage.set(ACTIVE_PAGE_KEY, pageId);
      else storage.remove(ACTIVE_PAGE_KEY);
    } catch {
      // storage can be unavailable (private mode) — the in-memory value still works
    }
    set({ activePageId: pageId });
  },
}));
