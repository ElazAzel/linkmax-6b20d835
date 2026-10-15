import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCloudPageState } from '../useCloudPageState';
import { useAuth } from '@/hooks/user/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useUserPage, useSavePageMutation, usePublishPageMutation } from '@/hooks/page/usePageCache';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { loadDraft, saveDraft } from '@/pwa/offlineDraftCache';
import { pageDraftCacheKey } from '@/lib/page-draft-cache';
import { useActivePageStore } from '@/store/useActivePageStore';
import { usePageVersions } from '../usePageVersions';

// Mock dependencies
vi.mock('@/hooks/user/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
}));

vi.mock('@/hooks/page/usePageCache', () => ({
  useUserPage: vi.fn(),
  useSavePageMutation: vi.fn(),
  usePublishPageMutation: vi.fn(),
  pageQueryKeys: {
    userPage: vi.fn((id) => ['userPage', id]),
  },
}));

vi.mock('@/platform/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/services/pages', () => ({
  updatePageNiche: vi.fn(),
  updatePageEntityFields: vi.fn(),
}));

describe('useCloudPageState', () => {
  const mockUser = { id: 'user-123' };
  const mockPageData = {
    id: 'page-123',
    userId: 'user-123',
    slug: 'test-page',
    blocks: [{ id: 'b1', type: 'profile', title: 'Profile' }],
    theme: { backgroundColor: '#ffffff' },
    seo: {},
  };

  const mockMutateAsyncSave = vi.fn();
  const mockMutateAsyncPublish = vi.fn();

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
    useActivePageStore.setState({ activePageId: null });

    (useAuth as any).mockReturnValue({ user: mockUser });
    (useQueryClient as any).mockReturnValue({ invalidateQueries: vi.fn() });

    (useUserPage as any).mockReturnValue({
      data: { pageData: mockPageData, chatbotContext: 'hello' },
      isLoading: false,
      refetch: vi.fn(),
    });

    (useSavePageMutation as any).mockReturnValue({
      mutateAsync: mockMutateAsyncSave,
      isPending: false,
    });

    (usePublishPageMutation as any).mockReturnValue({
      mutateAsync: mockMutateAsyncPublish,
      isPending: false,
    });

    const { updatePageNiche, updatePageEntityFields } = await import('@/services/pages');
    vi.mocked(updatePageNiche).mockReset();
    vi.mocked(updatePageEntityFields).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with page data from cache', async () => {
    const { result } = renderHook(() => useCloudPageState());

    expect(result.current.pageData).toEqual(mockPageData);
    expect(result.current.chatbotContext).toBe('hello');
  });

  it('persists immediately and sends a private save at exactly 1000ms', async () => {
    mockMutateAsyncSave.mockResolvedValue({ draft: { revision: 1, base_published_revision: 0 } });
    const { result } = renderHook(() => useCloudPageState());
    act(() => result.current.updateTheme({ backgroundColor: 'red' }));
    const local = loadDraft<any>(pageDraftCacheKey(mockUser.id, mockPageData.id));
    expect(local?.data.pageData.theme.backgroundColor).toBe('red');
    await act(async () => { await vi.advanceTimersByTimeAsync(999); });
    expect(mockMutateAsyncSave).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(mockMutateAsyncSave).toHaveBeenCalledWith(expect.objectContaining({ revision: 0, basePublishedRevision: 0 }));
    expect(mockMutateAsyncPublish).not.toHaveBeenCalled();
  });

  it('explicit Publish uses the revision acknowledged by private save', async () => {
    mockMutateAsyncSave.mockResolvedValue({ draft: { revision: 7, base_published_revision: 3 } });
    mockMutateAsyncPublish.mockResolvedValue({ base_published_revision: 4, slug: 'test-page' });
    const { result } = renderHook(() => useCloudPageState());
    await act(async () => { expect(await result.current.publish()).toBe('test-page'); });
    expect(mockMutateAsyncPublish).toHaveBeenCalledWith({ pageId: 'page-123', revision: 7, basePublishedRevision: 3 });
    expect(result.current.hasUnpublishedChanges).toBe(false);
  });

  it('missing RPC retains local draft and exposes actionable unavailable error', async () => {
    mockMutateAsyncSave.mockRejectedValue({ code: 'PGRST202', message: 'missing function' });
    const { result } = renderHook(() => useCloudPageState());
    act(() => result.current.updateTheme({ backgroundColor: 'offline' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(result.current.draftError?.kind).toBe('unavailable');
    expect(result.current.saveStatus).toBe('error');
    expect(loadDraft<any>(pageDraftCacheKey(mockUser.id, mockPageData.id))?.data.dirty).toBe(true);
    expect(mockMutateAsyncPublish).not.toHaveBeenCalled();
  });

  it('recovers local changes with their original CAS token and detects remote conflict', async () => {
    saveDraft(pageDraftCacheKey(mockUser.id, mockPageData.id), { pageData: { ...mockPageData, city: 'Local' }, chatbotContext: 'local', revision: 2, base: 1, dirty: true });
    vi.mocked(useUserPage).mockReturnValue({ data: { pageData: mockPageData, chatbotContext: '', draft: { revision: 3, base_published_revision: 1 } }, isLoading: false, refetch: vi.fn() } as any);
    const { result } = renderHook(() => useCloudPageState());
    expect(result.current.pageData?.city).toBe('Local');
    expect(result.current.conflict).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(mockMutateAsyncSave).not.toHaveBeenCalled();
  });

  it.each([
    { code: '42501', message: 'Access denied' },
    { code: 'PGRST116', message: 'Page deleted' },
    { message: 'Network unavailable' },
  ])('gates failed selected page without losing the previous session: %s', async problem => {
    const aData = { pageData: mockPageData, chatbotContext: 'hello' };
    const refetch = vi.fn();
    const { result, rerender } = renderHook(({ id }) => useCloudPageState({ pageId: id }), { initialProps: { id: 'page-123' } });
    act(() => result.current.updateTheme({ backgroundColor: 'local-A' }));
    vi.mocked(useUserPage).mockReturnValue({ data: undefined, isLoading: true, refetch } as any);
    rerender({ id: 'page-B' });
    expect(result.current.pageData).toBeNull();
    await act(async () => { await result.current.save(); await result.current.publish(); });
    expect(mockMutateAsyncSave).not.toHaveBeenCalled();
    expect(mockMutateAsyncPublish).not.toHaveBeenCalled();
    vi.mocked(useUserPage).mockReturnValue({ data: undefined, error: problem, isLoading: false, refetch } as any);
    rerender({ id: 'page-B' });
    expect(result.current.pageData).toBeNull();
    expect(result.current.draftError?.message).toBeTruthy();
    await act(async () => { await result.current.save(); await result.current.publish(); });
    expect(mockMutateAsyncSave).not.toHaveBeenCalled();
    expect(mockMutateAsyncPublish).not.toHaveBeenCalled();
    await act(async () => { await result.current.refresh(); });
    expect(refetch).toHaveBeenCalled();
    vi.mocked(useUserPage).mockReturnValue({ data: aData, isLoading: false, refetch } as any);
    rerender({ id: 'page-123' });
    expect(result.current.pageData?.theme.backgroundColor).toBe('local-A');
    expect(result.current.draftError).toBeNull();
    expect(loadDraft<any>(pageDraftCacheKey(mockUser.id, mockPageData.id))?.data.pageData.theme.backgroundColor).toBe('local-A');
    mockMutateAsyncSave.mockResolvedValue({ draft: { revision: 1, base_published_revision: 0 } });
    await act(async () => { await result.current.save(); });
    expect(mockMutateAsyncSave).toHaveBeenCalledWith(expect.objectContaining({ pageData: expect.objectContaining({ id: 'page-123', theme: { backgroundColor: 'local-A' } }) }));
  });

  it('does not cancel an independent page save when switching pages', async () => {
    mockMutateAsyncSave.mockResolvedValue({ draft: { revision: 1, base_published_revision: 0 } });
    const { result, rerender } = renderHook(({ id }) => useCloudPageState({ pageId: id }), { initialProps: { id: 'page-123' } });
    act(() => result.current.updateTheme({ backgroundColor: 'first' }));
    vi.mocked(useUserPage).mockReturnValue({ data: { pageData: { ...mockPageData, id: 'second' }, chatbotContext: '' }, isLoading: false, refetch: vi.fn() } as any);
    rerender({ id: 'second' });
    act(() => result.current.updateTheme({ backgroundColor: 'second' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(mockMutateAsyncSave.mock.calls.map(([input]) => input.pageData.id)).toEqual(['page-123', 'second']);
  });

  it('serializes pending writes without losing edits made during a save', async () => {
    let resolveFirst!: (value: unknown) => void;
    mockMutateAsyncSave.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }));
    mockMutateAsyncSave.mockResolvedValue({ draft: { revision: 2, base_published_revision: 0 } });
    const { result } = renderHook(() => useCloudPageState());
    act(() => result.current.updateTheme({ backgroundColor: 'first' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    act(() => result.current.updateTheme({ backgroundColor: 'second' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(mockMutateAsyncSave).toHaveBeenCalledTimes(1);
    await act(async () => { resolveFirst({ draft: { revision: 1, base_published_revision: 0 } }); });
    expect(mockMutateAsyncSave).toHaveBeenLastCalledWith(expect.objectContaining({ revision: 1, pageData: expect.objectContaining({ theme: { backgroundColor: 'second' } }) }));
    expect(result.current.pageData?.theme.backgroundColor).toBe('second');
  });

  it('restores history into the private draft without publishing', async () => {
    mockMutateAsyncSave.mockResolvedValue({ draft: { revision: 1, base_published_revision: 0 } });
    const { result } = renderHook(() => {
      const editor = useCloudPageState();
      const versions = usePageVersions((blocks, theme) => editor.updatePageDataPartial({ blocks, ...(theme ? { theme } : {}) }));
      return { editor, versions };
    });
    act(() => result.current.versions.restoreVersion({ id: 'v1', versionId: 'draft-1', publishedAt: '', blocks: [{ id: 'restored', type: 'text', content: 'old content' }] as any }));
    expect(result.current.editor.pageData?.blocks[0].id).toBe('restored');
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(mockMutateAsyncSave).toHaveBeenCalled();
    expect(mockMutateAsyncPublish).not.toHaveBeenCalled();
  });

  it('should update block and trigger auto-save', async () => {
    mockMutateAsyncSave.mockResolvedValue({ dbPage: { id: 'page-123' }, draft: { revision: 1, base_published_revision: 0 } });
    mockMutateAsyncPublish.mockResolvedValue('test-page');

    const { result } = renderHook(() => useCloudPageState());

    act(() => {
      result.current.updateBlock('b1', { title: 'New Title' });
    });

    // Save status should be 'pending' immediately
    expect(result.current.saveStatus).toBe('pending');

    // Fast-forward 2 seconds for the debounce
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });

    // Now it should be 'saving' or 'saved'
    // Since we await mutations in the hook, we might need more act wraps or waitFor

    // Check if mutateAsync was called
    expect(mockMutateAsyncSave).toHaveBeenCalled();
  });

  it('should handle manual save correctly', async () => {
    mockMutateAsyncSave.mockResolvedValue({ dbPage: { id: 'page-123' }, draft: { revision: 1, base_published_revision: 0 } });
    mockMutateAsyncPublish.mockResolvedValue('test-page');

    const { result } = renderHook(() => useCloudPageState());

    await act(async () => {
      await result.current.save();
    });

    expect(mockMutateAsyncSave).toHaveBeenCalled();
    expect(mockMutateAsyncPublish).not.toHaveBeenCalled();

    expect(result.current.saveStatus).toBe('saved');
  });

  it('should delete block and sync event deletion', async () => {
    const pageWithEvent = {
        ...mockPageData,
        blocks: [
            { id: 'b1', type: 'profile' },
            { id: 'b2', type: 'event', eventId: 'event-456' }
        ]
    };
    (useUserPage as any).mockReturnValue({
        data: { pageData: pageWithEvent, chatbotContext: '' },
        isLoading: false,
        refetch: vi.fn(),
    });

    const { result } = renderHook(() => useCloudPageState());

    act(() => {
      result.current.deleteBlock('b2');
    });

    expect(result.current.pageData?.blocks.length).toBe(1);
  });

  it('should update niche successfully', async () => {
    const { updatePageNiche } = await import('@/services/pages');
    vi.mocked(updatePageNiche).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useCloudPageState());

    await act(async () => {
      await result.current.updateNiche('realestate');
    });

    expect(result.current.pageData?.niche).toBe('realestate');
    expect(updatePageNiche).not.toHaveBeenCalled();
  });

  it('should update entity fields successfully', async () => {
    const { updatePageEntityFields } = await import('@/services/pages');
    vi.mocked(updatePageEntityFields).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useCloudPageState());

    await act(async () => {
      await result.current.updateEntityFields({ city: 'Almaty' });
    });

    expect(result.current.pageData?.city).toBe('Almaty');
    expect(updatePageEntityFields).not.toHaveBeenCalled();
  });

  describe('block positions and bulk operations', () => {
    const blocks = [
      { id: 'p', type: 'profile' },
      { id: 'a', type: 'text' },
      { id: 'b', type: 'text' },
      { id: 'c', type: 'text' },
    ];

    beforeEach(() => {
      // Offline draft snapshots from earlier tests would be restored otherwise
      localStorage.clear();
      (useUserPage as any).mockReturnValue({
        data: { pageData: { ...mockPageData, id: 'page-positions', blocks }, chatbotContext: '' },
        isLoading: false,
        refetch: vi.fn(),
      });
    });

    it('inserts at a full-array index (duplicate lands right after the original)', () => {
      const { result } = renderHook(() => useCloudPageState());
      act(() => {
        // duplicate of 'a' (index 1) is inserted at index 2
        result.current.addBlock({ id: 'a-copy', type: 'text' } as any, 2);
      });
      expect(result.current.pageData?.blocks.map((b) => b.id)).toEqual(['p', 'a', 'a-copy', 'b', 'c']);
    });

    it('never inserts above the profile block and clamps to the end', () => {
      const { result } = renderHook(() => useCloudPageState());
      act(() => {
        result.current.addBlock({ id: 'top', type: 'text' } as any, 0);
        result.current.addBlock({ id: 'end', type: 'text' } as any, 999);
      });
      expect(result.current.pageData?.blocks.map((b) => b.id)).toEqual(['p', 'top', 'a', 'b', 'c', 'end']);
    });

    it('deleteBlocks removes every selected block but keeps the profile', () => {
      const { result } = renderHook(() => useCloudPageState());
      act(() => {
        result.current.deleteBlocks(['a', 'c', 'p']);
      });
      expect(result.current.pageData?.blocks.map((b) => b.id)).toEqual(['p', 'b']);
    });

    it('never publishes after autosave', async () => {
      mockMutateAsyncSave.mockResolvedValue({ dbPage: { id: 'page-positions' }, draft: { revision: 1, base_published_revision: 0 } });
      mockMutateAsyncPublish.mockResolvedValue('test-page');
      const { result } = renderHook(() => useCloudPageState());
      act(() => {
        result.current.updateBlock('a', { content: 'x' } as any);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2100);
      });
      expect(mockMutateAsyncPublish).not.toHaveBeenCalled();
    });
  });
});
