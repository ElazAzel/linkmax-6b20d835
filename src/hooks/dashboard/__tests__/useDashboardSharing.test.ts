import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDashboardSharing } from '../useDashboardSharing';
vi.mock('@/services/social', () => ({ incrementChallengeProgress: vi.fn(), recordActivity: vi.fn() }));
vi.mock('@/lib/utils/url-helpers', () => ({ getPublicPageUrl: (slug: string) => `https://example.test/${slug}`, copyToClipboard: vi.fn().mockResolvedValue(true) }));
describe('explicit publication', () => {
  it('opens local preview without saving or publishing', async () => {
    const onSave = vi.fn(); const onPublish = vi.fn().mockResolvedValue('public-page'); const onPreview = vi.fn();
    const { result } = renderHook(() => useDashboardSharing({ onSave, onPublish, onPreview }));
    await act(async () => result.current.handlePreview());
    expect(onPreview).toHaveBeenCalledOnce(); expect(onSave).not.toHaveBeenCalled(); expect(onPublish).not.toHaveBeenCalled();
  });
  it('never publishes when a preview callback is unavailable', async () => {
    const onPublish = vi.fn().mockResolvedValue('public-page');
    const { result } = renderHook(() => useDashboardSharing({ onSave: vi.fn(), onPublish }));
    await act(async () => result.current.handlePreview());
    expect(onPublish).not.toHaveBeenCalled();
  });
  it('Share copies the existing public URL without publishing the draft', async () => {
    const onPublish = vi.fn().mockResolvedValue('new-page');
    const { result } = renderHook(() => useDashboardSharing({ onSave: vi.fn(), onPublish, publishedSlug: 'existing-page' }));
    await act(async () => result.current.handleShare());
    expect(onPublish).not.toHaveBeenCalled();
    expect(result.current.publishedUrl).toBe('https://example.test/existing-page');
  });
});
