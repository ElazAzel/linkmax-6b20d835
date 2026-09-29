import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCloudPageState } from '../useCloudPageState';
import { useAuth } from '@/hooks/user/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useUserPage, useSavePageMutation, usePublishPageMutation } from '@/hooks/page/usePageCache';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';

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

  it('should update block and trigger auto-save', async () => {
    mockMutateAsyncSave.mockResolvedValue({ dbPage: { id: 'page-123' } });
    mockMutateAsyncPublish.mockResolvedValue('test-page');

    const { result } = renderHook(() => useCloudPageState());

    act(() => {
      result.current.updateBlock('b1', { title: 'New Title' });
    });

    // Save status should be 'pending' immediately
    expect(result.current.saveStatus).toBe('pending');

    // Fast-forward 2 seconds for the debounce
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Now it should be 'saving' or 'saved'
    // Since we await mutations in the hook, we might need more act wraps or waitFor
    
    // Check if mutateAsync was called
    expect(mockMutateAsyncSave).toHaveBeenCalled();
  });

  it('should handle manual save correctly', async () => {
    mockMutateAsyncSave.mockResolvedValue({ dbPage: { id: 'page-123' } });
    mockMutateAsyncPublish.mockResolvedValue('test-page');

    const { result } = renderHook(() => useCloudPageState());

    await act(async () => {
      await result.current.save();
    });

    expect(mockMutateAsyncSave).toHaveBeenCalled();
    expect(mockMutateAsyncPublish).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Changes saved and published!');
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
    expect(updatePageNiche).toHaveBeenCalled();
  });

  it('should update entity fields successfully', async () => {
    const { updatePageEntityFields } = await import('@/services/pages');
    vi.mocked(updatePageEntityFields).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useCloudPageState());

    await act(async () => {
      await result.current.updateEntityFields({ city: 'Almaty' });
    });

    expect(result.current.pageData?.city).toBe('Almaty');
    expect(updatePageEntityFields).toHaveBeenCalled();
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

    it('publishes only the edited page after autosave', async () => {
      mockMutateAsyncSave.mockResolvedValue({ dbPage: { id: 'page-positions' } });
      mockMutateAsyncPublish.mockResolvedValue('test-page');
      const { result } = renderHook(() => useCloudPageState());
      act(() => {
        result.current.updateBlock('a', { content: 'x' } as any);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2100);
      });
      expect(mockMutateAsyncPublish).toHaveBeenCalledWith('page-positions');
    });
  });
});
