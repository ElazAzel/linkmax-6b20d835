import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/user/useAuth';
import { useUserPage, useSavePageMutation, usePublishPageMutation, pageQueryKeys, synchronizeDraftCache } from '@/hooks/page/usePageCache';
import { draftError, loadPageDraft, reloadPageDraft, type PageDraftError } from '@/services/page-drafts';
import type { PageData, Block, EditorMode } from '@/types/page';
import type { Niche } from '@/lib/niches';
import type { SaveStatus } from '@/components/editor/AutoSaveIndicator';
import { saveDraft, loadDraft } from '@/pwa/offlineDraftCache';
import { useActivePageStore } from '@/store/useActivePageStore';
import { pageDraftCacheKey, type LocalPageDraft } from '@/lib/page-draft-cache';

type LocalDraft = LocalPageDraft;
interface Session extends LocalDraft {
  sequence: number; queue: Promise<unknown>; timer?: ReturnType<typeof setTimeout>; error?: PageDraftError;
}
interface UseCloudPageStateOptions { onPublish?: (pageData: PageData) => void; pageId?: string | null }

export function useCloudPageState(options?: UseCloudPageStateOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [chatbotContext, setChatbotContext] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<PageDraftError | null>(null);
  const [dirty, setDirty] = useState(false);
  const sessions = useRef(new Map<string, Session>());
  const active = useRef<string | null>(null);
  const storeActivePageId = useActivePageStore(state => state.activePageId);
  const setActivePageId = useActivePageStore(state => state.setActivePageId);
  const requestedPageId = options?.pageId !== undefined ? options.pageId : storeActivePageId;
  const { data: userData, isLoading: loading, error: queryError, refetch } = useUserPage(user?.id, requestedPageId);
  const savePageMutation = useSavePageMutation(user?.id);
  const publishPageMutation = usePublishPageMutation(user?.id);
  const keyFor = useCallback((id: string) => pageDraftCacheKey(user?.id ?? '', id), [user?.id]);
  // A render for a new selection must never expose or act on the prior page,
  // even before the session-switch effect runs or when the new query fails.
  const selectedDataId = !queryError && userData?.pageData?.id;
  const selectedKey = user && selectedDataId && (!requestedPageId || requestedPageId === selectedDataId)
    ? keyFor(selectedDataId) : null;
  const selected = useRef<string | null>(null);
  selected.current = selectedKey;
  const queryProblem = useMemo(() => queryError ? draftError(queryError) : null, [queryError]);
  const visiblePageData = selectedKey && pageData?.id && keyFor(pageData.id) === selectedKey ? pageData : null;
  const persistLocal = useCallback((key: string, session: Session) => {
    const { pageData: data, chatbotContext: context, revision, base, dirty: unsaved, publishedDraftRevision } = session;
    saveDraft<LocalDraft>(key, { pageData: data, chatbotContext: context, revision, base, dirty: unsaved, publishedDraftRevision });
  }, []);

  // Serialize within a page, but never share counters or queues between tabs/pages.
  // Each queued operation uses the revision acknowledged by the prior operation.
  const persist = useCallback((key: string, session: Session, data: PageData, context: string, sequence: number) => {
    const task = session.queue.catch(() => undefined).then(async () => {
      if (session.error?.kind === 'conflict' || session.error?.kind === 'access') throw session.error;
      if (active.current === key) { setSaveStatus('saving'); setError(null); }
      const result = await savePageMutation.mutateAsync({ pageData: data, chatbotContext: context, revision: session.revision, basePublishedRevision: session.base });
      session.revision = result.draft.revision;
      session.base = result.draft.base_published_revision;
      session.error = undefined;
      if (sequence === session.sequence) session.dirty = false;
      persistLocal(key, session);
      if (active.current === key && sequence === session.sequence) { setSaveStatus('saved'); setError(null); }
      return result;
    }).catch(problem => {
      session.error = draftError(problem);
      if (active.current === key) { setError(session.error); setSaveStatus('error'); }
      throw session.error;
    });
    session.queue = task;
    return task;
  }, [savePageMutation, persistLocal]);

  const autoSaveAndPublish = useCallback((data: PageData, context: string) => {
    if (!user || !data.id) return;
    const key = keyFor(data.id);
    const session = sessions.current.get(key);
    if (!session || selected.current !== key) return;
    session.pageData = data; session.chatbotContext = context; session.dirty = true;
    const sequence = ++session.sequence;
    persistLocal(key, session);
    setSaveStatus('pending'); setDirty(true);
    clearTimeout(session.timer);
    session.timer = setTimeout(() => { void persist(key, session, data, context, sequence).catch(() => undefined); }, 1000);
  }, [user, keyFor, persist, persistLocal]);

  useEffect(() => {
    if (!selectedKey) {
      active.current = null;
      setPageData(null); setChatbotContext(''); setDirty(false);
      setError(null); setSaveStatus(queryProblem ? 'error' : 'idle');
      return;
    }
    const data = userData?.pageData;
    if (!data?.id || !userData) return;
    const key = keyFor(data.id);
    if (active.current === key) return;
    let session = sessions.current.get(key);
    if (!session) {
      const local = loadDraft<LocalDraft>(key)?.data;
      const remote = userData.draft;
      const recovered = local?.pageData?.id === data.id && (local.dirty || !remote);
      session = { pageData: recovered ? local.pageData : data, chatbotContext: recovered ? local.chatbotContext : userData.chatbotContext || '',
        revision: recovered ? local.revision : remote?.revision ?? 0, base: recovered ? local.base : remote?.base_published_revision ?? 0,
        dirty: recovered ? local.dirty : false, publishedDraftRevision: remote?.published_draft_revision ?? local?.publishedDraftRevision ?? 0,
        sequence: 0, queue: Promise.resolve(), error: userData.draftError ?? undefined };
      if (recovered && remote && (local.revision !== remote.revision || local.base !== remote.base_published_revision)) {
        session.error = draftError({ code: '40001' });
      }
      sessions.current.set(key, session);
    }
    active.current = key;
    setPageData(session.pageData); setChatbotContext(session.chatbotContext);
    setError(session.error ?? null); setSaveStatus(session.error ? 'error' : session.dirty ? 'pending' : 'idle');
    setDirty(session.dirty || session.revision !== (session.publishedDraftRevision ?? 0));
    if (options?.pageId === undefined && storeActivePageId !== data.id) setActivePageId(data.id);
    if (session.dirty && !session.error) {
      const current = session;
      current.timer = setTimeout(() => { void persist(key, current, current.pageData, current.chatbotContext, current.sequence).catch(() => undefined); }, 1000);
    }
  }, [user, userData, selectedKey, queryProblem, keyFor, options?.pageId, storeActivePageId, setActivePageId, persist]);

  useEffect(() => {
    const pending = sessions.current;
    return () => { for (const session of pending.values()) clearTimeout(session.timer); };
  }, []);

  // Reconnect retries never discard the CAS token stored with local recovery.
  useEffect(() => {
    const retry = () => {
      for (const [key, session] of sessions.current) if (session.dirty && session.error?.kind !== 'conflict') {
        clearTimeout(session.timer);
        void persist(key, session, session.pageData, session.chatbotContext, session.sequence).catch(() => undefined);
      }
    };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [persist]);

  const save = useCallback(async () => {
    const key = active.current;
    const session = key ? sessions.current.get(key) : undefined;
    if (!key || !session || selected.current !== key) return;
    clearTimeout(session.timer);
    await persist(key, session, session.pageData, session.chatbotContext, session.sequence);
  }, [persist]);

  const publish = useCallback(async () => {
    const key = active.current;
    const session = key ? sessions.current.get(key) : undefined;
    if (!key || !session || selected.current !== key) return null;
    clearTimeout(session.timer);
    const data = session.pageData;
    const sequence = session.sequence;
    await persist(key, session, data, session.chatbotContext, sequence);
    const task = session.queue.then(async () => {
      if (selected.current !== key) return null;
      // An edit made while saving must not be accidentally included by Publish.
      if (session.sequence !== sequence) throw new Error('The draft changed while publishing. Publish again to include the latest changes.');
      const result = await publishPageMutation.mutateAsync({ pageId: data.id, revision: session.revision, basePublishedRevision: session.base });
      session.base = result.base_published_revision;
      session.publishedDraftRevision = session.revision;
      session.pageData = { ...session.pageData, isPublished: true };
      persistLocal(key, session);
      if (active.current === key) { setSaveStatus(session.sequence === sequence ? 'saved' : 'pending'); setDirty(session.sequence !== sequence); setPageData(session.pageData); }
      options?.onPublish?.(data);
      return result.slug ?? data.slug ?? null;
    }).catch(problem => {
      session.error = draftError(problem);
      if (active.current === key) { setError(session.error); setSaveStatus('error'); }
      throw session.error;
    });
    session.queue = task;
    return task;
  }, [persist, publishPageMutation, persistLocal, options]);

  const updateChatbotContext = useCallback((context: string) => {
    setChatbotContext(context);
    if (pageData) autoSaveAndPublish(pageData, context);
  }, [pageData, autoSaveAndPublish]);

  const reloadServerDraft = useCallback(async () => {
    const key = active.current;
    const session = key ? sessions.current.get(key) : undefined;
    if (!key || !session || selected.current !== key) return;
    clearTimeout(session.timer);
    await session.queue.catch(() => undefined);
    const latest = await loadPageDraft(session.pageData.id);
    const remote = await reloadPageDraft(session.pageData.id, latest.revision, latest.base_published_revision);
    if (user?.id) synchronizeDraftCache(queryClient, user.id, remote);
    // Explicit reload keeps a recovery copy before replacing conflicted content.
    persistLocal(`${key}:conflict-backup`, session);
    Object.assign(session, { pageData: remote.snapshot, chatbotContext: remote.chatbot_context,
      revision: remote.revision, base: remote.base_published_revision,
      publishedDraftRevision: remote.published_draft_revision ?? 0, dirty: false, error: undefined });
    persistLocal(key, session);
    if (active.current === key) {
      setPageData(session.pageData); setChatbotContext(session.chatbotContext); setError(null); setSaveStatus('saved');
      setDirty(session.revision !== session.publishedDraftRevision);
    }
  }, [persistLocal, queryClient, user?.id]);
  const addBlock = useCallback((block: Block, position?: number) => {
    setPageData((prevData) => {
      if (!prevData) return prevData;
      let newBlocks: Block[];
      if (typeof position === 'number') {
        // `position` is an index into the full blocks array (callers use
        // blocks.length / index + 1). It used to be offset by the profile
        // block again, so duplicates and restored blocks landed one slot too low.
        const profileIndex = prevData.blocks.findIndex(b => b.type === 'profile');
        const minIndex = profileIndex >= 0 ? profileIndex + 1 : 0;
        const insertIndex = Math.min(Math.max(position, minIndex), prevData.blocks.length);
        newBlocks = [
          ...prevData.blocks.slice(0, insertIndex),
          block,
          ...prevData.blocks.slice(insertIndex),
        ];
      } else {
        newBlocks = [...prevData.blocks, block];
      }

      const newPageData = {
        ...prevData,
        blocks: newBlocks,
      };


      autoSaveAndPublish(newPageData, chatbotContext);
      return newPageData;
    });
  }, [chatbotContext, autoSaveAndPublish]);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setPageData((prevData) => {
      if (!prevData) return prevData;
      const newPageData = {
        ...prevData,
        blocks: prevData.blocks.map(block =>
          block.id === id ? ({ ...block, ...updates } as Block) : block
        ),
      };


      autoSaveAndPublish(newPageData, chatbotContext);
      return newPageData;
    });
  }, [chatbotContext, autoSaveAndPublish]);

  const deleteBlock = useCallback((id: string) => {
    setPageData((prevData) => {
      if (!prevData) return prevData;
      const newPageData = {
        ...prevData,
        blocks: prevData.blocks.filter(block => block.id !== id),
      };


      autoSaveAndPublish(newPageData, chatbotContext);
      return newPageData;
    });
  }, [chatbotContext, autoSaveAndPublish]);

  // Delete several blocks in one state update (bulk selection). Calling
  // deleteBlock in a loop was blocked by the per-operation guard after the first.
  const deleteBlocks = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setPageData((prevData) => {
      if (!prevData) return prevData;
      const removed = prevData.blocks.filter((block) => idSet.has(block.id) && block.type !== 'profile');
      if (removed.length === 0) return prevData;
      const removedIds = new Set(removed.map((block) => block.id));
      const newPageData = {
        ...prevData,
        blocks: prevData.blocks.filter((block) => !removedIds.has(block.id)),
      };
      autoSaveAndPublish(newPageData, chatbotContext);
      return newPageData;
    });
  }, [chatbotContext, autoSaveAndPublish]);

  const reorderBlocks = useCallback((blocks: Block[]) => {
    setPageData((prevData) => {
      if (!prevData) return prevData;
      const newPageData = {
        ...prevData,
        blocks,
      };
      autoSaveAndPublish(newPageData, chatbotContext);
      return newPageData;
    });
  }, [chatbotContext, autoSaveAndPublish]);

  // Replace all content blocks (keep profile block)
  const replaceBlocks = useCallback((newBlocks: Block[]) => {
    if (!pageData) return;

    // Keep the profile block
    const profileBlock = pageData.blocks.find(b => b.type === 'profile');
    const finalBlocks = profileBlock
      ? [profileBlock, ...newBlocks.filter(b => b.type !== 'profile')]
      : newBlocks;

    const newPageData = {
      ...pageData,
      blocks: finalBlocks,
    };
    setPageData(newPageData);

    // Save the private draft
    autoSaveAndPublish(newPageData, chatbotContext);
  }, [pageData, chatbotContext, autoSaveAndPublish]);

  const updateTheme = useCallback((theme: Partial<PageData['theme']>) => {
    if (!pageData) return;
    const newPageData = {
      ...pageData,
      theme: { ...pageData.theme, ...theme },
    };
    setPageData(newPageData);

    // Save the private draft
    autoSaveAndPublish(newPageData, chatbotContext);
  }, [pageData, chatbotContext, autoSaveAndPublish]);

  const updateEditorMode = useCallback((newMode: EditorMode, newBlocks?: Block[]) => {
    if (!pageData) return;
    const newPageData: PageData = {
      ...pageData,
      editorMode: newMode,
      blocks: newBlocks || pageData.blocks,
    };
    setPageData(newPageData);

    // Save the private draft
    autoSaveAndPublish(newPageData, chatbotContext);
  }, [pageData, chatbotContext, autoSaveAndPublish]);

  const updatePageDataPartial = useCallback((updates: Partial<PageData>) => {
    setPageData((prevData) => {
      if (!prevData) return prevData;
      const newPageData: PageData = {
        ...prevData,
        ...updates,
      };
      autoSaveAndPublish(newPageData, chatbotContext);
      return newPageData;
    });
  }, [chatbotContext, autoSaveAndPublish]);

  const updateNiche = useCallback(async (niche: Niche) => {
    updatePageDataPartial({ niche });
  }, [updatePageDataPartial]);

  const updateEntityFields = useCallback(async (fields: Pick<Partial<PageData>, 'city' | 'profession' | 'contact_email' | 'contact_phone' | 'contact_whatsapp' | 'country_code'> & { entity_type?: string }) => {
    updatePageDataPartial(fields as Partial<PageData>);
  }, [updatePageDataPartial]);
  const refresh = useCallback(async () => {
    if (user?.id) {
      await queryClient.invalidateQueries({
        queryKey: pageQueryKeys.userPage(user.id, requestedPageId)
      });
      await refetch();
    }
  }, [user?.id, requestedPageId, queryClient, refetch]);

  return useMemo(() => ({
    pageData: visiblePageData,
    chatbotContext: visiblePageData ? chatbotContext : '',
    setChatbotContext: updateChatbotContext,
    loading,
    saving: savePageMutation.isPending || publishPageMutation.isPending,
    saveStatus: queryProblem ? 'error' as const : saveStatus,
    draftError: queryProblem ?? error,
    conflict: (queryProblem ?? error)?.kind === 'conflict',
    hasUnpublishedChanges: !!visiblePageData && dirty,
    reloadServerDraft,
    save,
    publish,
    addBlock,
    updateBlock,
    deleteBlock,
    deleteBlocks,
    reorderBlocks,
    replaceBlocks,
    updateTheme,
    updateEditorMode,
    updatePageDataPartial,
    updateNiche,
    updateEntityFields,
    refresh,
  }), [
    visiblePageData,
    queryProblem,
    chatbotContext,
    loading,
    savePageMutation.isPending,
    publishPageMutation.isPending,
    saveStatus,
    error,
    updateChatbotContext,
    dirty,
    reloadServerDraft,
    save,
    publish,
    addBlock,
    updateBlock,
    deleteBlock,
    deleteBlocks,
    reorderBlocks,
    replaceBlocks,
    updateTheme,
    updateEditorMode,
    updatePageDataPartial,
    updateNiche,
    updateEntityFields,
    refresh
  ]);
}
