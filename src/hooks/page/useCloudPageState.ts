import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/user/useAuth';
import { logger } from '@/lib/utils/logger';
import { useUserPage, useSavePageMutation, usePublishPageMutation, pageQueryKeys } from '@/hooks/page/usePageCache';
import { updatePageNiche, updatePageEntityFields } from '@/services/pages';
import { deleteEventBlock, syncEventBlock } from '@/services/events';
import { ensureBlockIds, deduplicateBlocks } from '@/lib/blocks/block-utils';
import { supabase } from '@/platform/supabase/client';
import { computeQualityScore } from '@/lib/seo/quality-score';
import { notifyIndexNow } from '@/lib/seo/indexnow-client';
import type { ServiceSlugEntryRaw } from '@/lib/seo/indexnow-client';
import type { PageData, Block, EditorMode } from '@/types/page';
import type { Niche } from '@/lib/niches';
import { toast } from 'sonner';
import type { SaveStatus } from '@/components/editor/AutoSaveIndicator';
import { normalizeAppError } from '@/lib/errors/app-error-normalizer';

// Request versioning to prevent stale writes
let saveRequestVersion = 0;

interface UseCloudPageStateOptions {
  onPublish?: (pageData: PageData) => void;
}

export function useCloudPageState(options?: UseCloudPageStateOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [chatbotContext, setChatbotContext] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveVersionRef = useRef<number>(0);
  // Track if user has made local changes that shouldn't be overwritten by cache
  const hasLocalChangesRef = useRef<boolean>(false);
  // Track initial load to only sync from cache once
  const initialLoadDoneRef = useRef<boolean>(false);
  // P2.11: Track previous service_slugs snapshot for diff-based IndexNow
  const previousServiceSlugsRef = useRef<Record<string, ServiceSlugEntryRaw> | null>(null);

  // Use React Query for cached page loading
  const { data: userData, isLoading: loading, refetch } = useUserPage(user?.id);
  const savePageMutation = useSavePageMutation(user?.id);
  const publishPageMutation = usePublishPageMutation(user?.id);

  // Update local state when cached data loads - ONLY on initial load
  // This prevents cache updates from overwriting local changes
  useEffect(() => {
    if (userData && !initialLoadDoneRef.current) {
      setPageData(userData.pageData);
      setChatbotContext(userData.chatbotContext || '');
      initialLoadDoneRef.current = true;
      hasLocalChangesRef.current = false;
      // P2.11: Seed previous service_slugs on initial load
      if (userData.pageData?.id) {
        void (async () => {
          try {
            const { data: row } = await supabase
              .from('pages')
              .select('service_slugs')
              .eq('id', userData.pageData.id)
              .single();
            if (row?.service_slugs) {
              previousServiceSlugsRef.current = row.service_slugs as unknown as Record<string, ServiceSlugEntryRaw>;
            }
          } catch {
            // Non-critical
          }
        })();
      }
    }
  }, [userData]);

  // Reset initial load flag when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      initialLoadDoneRef.current = false;
      hasLocalChangesRef.current = false;
      setPageData(null);
    }
  }, [user]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const autoSaveAndPublish = useCallback((data: PageData, context: string) => {
    if (!user) return;

    // Increment version for this save request
    saveRequestVersion++;
    const thisRequestVersion = saveRequestVersion;

    // Set pending status immediately
    setSaveStatus('pending');

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Debounce auto-save and publish with longer delay for stability
    autoSaveTimerRef.current = setTimeout(async () => {
      // Check if this request is still the latest
      if (thisRequestVersion !== saveRequestVersion) {
        // Stale request - a newer save was triggered, skip this one
        return;
      }

      try {
        setSaveStatus('saving');

        // Ensure block integrity before saving
        const sanitizedData = {
          ...data,
          blocks: deduplicateBlocks(ensureBlockIds(data.blocks)),
        };

        // Save first with retry logic
        let retries = 2;
        let lastError: any = null;
        let savedPageId: string | undefined;

        while (retries > 0) {
          // Check again before each retry
          if (thisRequestVersion !== saveRequestVersion) {
            return;
          }

          try {
            const result = await savePageMutation.mutateAsync({
              pageData: sanitizedData,
              chatbotContext: context
            });
            // Get pageId from the saved result
            savedPageId = result.dbPage?.id;
            lastSaveVersionRef.current = thisRequestVersion;
            break;
          } catch (err) {
            lastError = err;
            retries--;
            if (retries > 0) {
              await new Promise(r => setTimeout(r, 1000)); // Increased backoff
            }
          }
        }

        if (retries === 0 && lastError) {
          throw lastError;
        }

        // Use saved pageId or fallback to data.id
        const pageIdToUse = savedPageId || data.id;

        // Sync event blocks after page is saved (now we have pageId)
        if (pageIdToUse && user?.id) {
          const eventBlocks = sanitizedData.blocks.filter((b) => b.type === 'event');
          for (const block of eventBlocks) {
            if (block.type === 'event') {
              void syncEventBlock(block, pageIdToUse, user.id);
            }
          }
        }

        // Final stale check before publish
        if (thisRequestVersion !== saveRequestVersion) {
          return;
        }

        // Then auto-publish
        await publishPageMutation.mutateAsync();

        // P2.11: Diff-based IndexNow — only submit changed child URLs
        const slug = sanitizedData.slug;
        const pageIdForIndexing = savedPageId || sanitizedData.id;
        if (slug && pageIdForIndexing) {
          const { score } = computeQualityScore(sanitizedData);
          void (async () => {
            try {
              const { data: pageRow } = await supabase
                .from('pages')
                .select('service_slugs')
                .eq('id', pageIdForIndexing)
                .single();
              const currentSvcSlugs = pageRow?.service_slugs as unknown as Record<string, ServiceSlugEntryRaw> | null;
              const previousSvcSlugs = previousServiceSlugsRef.current;
              
              await notifyIndexNow(
                slug, score, !!sanitizedData.isPublished,
                pageIdForIndexing, 'update',
                currentSvcSlugs, previousSvcSlugs,
              );
              
              // Update snapshot for next diff
              previousServiceSlugsRef.current = currentSvcSlugs;
            } catch {
              // Fallback: send without diff (treats as first snapshot)
              await notifyIndexNow(slug, score, !!sanitizedData.isPublished, pageIdForIndexing, 'update').catch(() => {});
            }
          })();
        }

        // Invalidate server diagnostics so SearchReadinessCard refetches
        if (pageIdForIndexing) {
          queryClient.invalidateQueries({
            queryKey: ['search-diagnostics', pageIdForIndexing],
          });
        }
        
        // Final check after all async ops
        if (thisRequestVersion === saveRequestVersion) {
          setSaveStatus('saved');
        }
      } catch (error) {
        // Only set error if this is still the active request
        if (thisRequestVersion === saveRequestVersion) {
          const normalized = normalizeAppError(error);
          setSaveStatus('error');
          logger.error('Auto-save/publish error normalized:', normalized, { context: 'useCloudPageState' });
        }
      }
    }, 2000); // Slightly more conservative debounce
  }, [user, savePageMutation, publishPageMutation, queryClient]);

  const save = useCallback(async () => {
    if (!user || !pageData) return;

    // Clear any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    try {
      setSaveStatus('saving');
      await savePageMutation.mutateAsync({
        pageData,
        chatbotContext
      });
      await publishPageMutation.mutateAsync();
      setSaveStatus('saved');
      toast.success('Changes saved and published!');
    } catch (error) {
      setSaveStatus('error');
      const normalized = normalizeAppError(error);
      toast.error(normalized.safeMessage);
      throw error;
    }
  }, [user, pageData, chatbotContext, savePageMutation, publishPageMutation]);

  const publish = useCallback(async () => {
    if (!user || !pageData) return null;

    // Clear any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    try {
      setSaveStatus('saving');
      await savePageMutation.mutateAsync({
        pageData,
        chatbotContext
      });
      const slug = await publishPageMutation.mutateAsync();
      setSaveStatus('saved');

      // Call onPublish callback to save version
      if (options?.onPublish) {
        options.onPublish(pageData);
      }

      return slug;
    } catch (error) {
      setSaveStatus('error');
      throw error;
    }
  }, [user, pageData, chatbotContext, savePageMutation, publishPageMutation, options]);

  const addBlock = useCallback((block: Block, position?: number) => {
    setPageData((prevData) => {
      if (!prevData) return prevData;
      let newBlocks: Block[];
      if (typeof position === 'number') {
        const profileIndex = prevData.blocks.findIndex(b => b.type === 'profile');
        const insertIndex = profileIndex >= 0 ? profileIndex + 1 + position : position;
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

      if (block.type === 'event') {
        void syncEventBlock(block, prevData.id, user?.id);
      }

      autoSaveAndPublish(newPageData, chatbotContext);
      return newPageData;
    });
  }, [chatbotContext, autoSaveAndPublish, user]);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setPageData((prevData) => {
      if (!prevData) return prevData;
      const newPageData = {
        ...prevData,
        blocks: prevData.blocks.map(block =>
          block.id === id ? ({ ...block, ...updates } as Block) : block
        ),
      };

      const updatedBlock = newPageData.blocks.find(b => b.id === id);
      if (updatedBlock?.type === 'event') {
        void syncEventBlock(updatedBlock, prevData.id, user?.id);
      }

      autoSaveAndPublish(newPageData, chatbotContext);
      return newPageData;
    });
  }, [chatbotContext, autoSaveAndPublish, user]);

  const deleteBlock = useCallback((id: string) => {
    setPageData((prevData) => {
      if (!prevData) return prevData;
      const blockToDelete = prevData.blocks.find((block) => block.id === id);
      const newPageData = {
        ...prevData,
        blocks: prevData.blocks.filter(block => block.id !== id),
      };

      if (blockToDelete?.type === 'event') {
        void deleteEventBlock(blockToDelete.eventId, user?.id);
      }

      autoSaveAndPublish(newPageData, chatbotContext);
      return newPageData;
    });
  }, [chatbotContext, autoSaveAndPublish, user]);

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

    // Auto-save and publish
    autoSaveAndPublish(newPageData, chatbotContext);
  }, [pageData, chatbotContext, autoSaveAndPublish]);

  const updateTheme = useCallback((theme: Partial<PageData['theme']>) => {
    if (!pageData) return;
    const newPageData = {
      ...pageData,
      theme: { ...pageData.theme, ...theme },
    };
    setPageData(newPageData);

    // Auto-save and publish
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

    // Auto-save and publish
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
    if (!user || !pageData) return;

    // Update local state immediately
    const newPageData = { ...pageData, niche };
    setPageData(newPageData);

    // Save to database
    const { error } = await updatePageNiche(user.id, niche);
    if (error) {
      toast.error('Failed to update category');
      // Revert on error
      setPageData(pageData);
    }
  }, [user, pageData]);

  const updateEntityFields = useCallback(async (fields: {
    city?: string;
    profession?: string;
    entity_type?: string;
    contact_email?: string;
    contact_phone?: string;
    contact_whatsapp?: string;
  }) => {
    if (!user || !pageData) return;

    // Update local state immediately
    const newPageData = { ...pageData, ...fields };
    setPageData(newPageData as PageData);

    // Save to database
    const { error } = await updatePageEntityFields(user.id, fields);
    if (error) {
      toast.error('Failed to update');
      setPageData(pageData);
    }
  }, [user, pageData]);

  const refresh = useCallback(async () => {
    if (user?.id) {
      await queryClient.invalidateQueries({
        queryKey: pageQueryKeys.userPage(user.id)
      });
      await refetch();
    }
  }, [user?.id, queryClient, refetch]);

  return useMemo(() => ({
    pageData,
    chatbotContext,
    setChatbotContext,
    loading,
    saving: savePageMutation.isPending || publishPageMutation.isPending,
    saveStatus,
    save,
    publish,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    replaceBlocks,
    updateTheme,
    updateEditorMode,
    updatePageDataPartial,
    updateNiche,
    updateEntityFields,
    refresh,
  }), [
    pageData,
    chatbotContext,
    loading,
    savePageMutation.isPending,
    publishPageMutation.isPending,
    saveStatus,
    save,
    publish,
    addBlock,
    updateBlock,
    deleteBlock,
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
