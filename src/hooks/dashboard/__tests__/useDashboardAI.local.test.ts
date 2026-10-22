import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useDashboardAI } from '../useDashboardAI';
it('applies a local page and theme without AI achievements or token rewards', () => {
  const onReplaceBlocks = vi.fn(), onApplyTheme = vi.fn(), onClaimAIToken = vi.fn(), onQuestComplete = vi.fn();
  const { result } = renderHook(() => useDashboardAI({ onAddBlock: vi.fn(), onUpdateProfile: vi.fn(), onReplaceBlocks, onApplyTheme, onClaimAIToken, onQuestComplete }));
  const blocks = [{ id: 'actual', type: 'profile', name: 'Luna' }];
  act(() => result.current.handleAIResult({ generationMode: 'algorithmic', blocks, theme: { backgroundColor: '#101010' } }));
  expect(onReplaceBlocks).toHaveBeenCalledWith(blocks);
  expect(onApplyTheme).toHaveBeenCalledWith({ backgroundColor: '#101010' });
  expect(onClaimAIToken).not.toHaveBeenCalled();
  expect(onQuestComplete).not.toHaveBeenCalled();
});
