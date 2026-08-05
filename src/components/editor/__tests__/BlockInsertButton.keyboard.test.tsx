import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BlockInsertButton } from '../BlockInsertButton';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/hooks/ui/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/lib/blocks/block-manifest', () => ({
  BLOCK_MANIFEST: {
    text: {
      type: 'text',
      labelKey: 'blocks.text',
      icon: 'FileText',
      isPremium: false,
    },
  },
}));

vi.mock('@/lib/blocks/block-recommendations', () => ({
  getRecommendedBlocks: () => [],
}));


vi.mock('@/lib/utils/icon-utils', () => ({
  getLucideIcon: () => () => <span data-testid="mock-icon" />,
}));

describe('BlockInsertButton keyboard flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('supports Enter and Space on block cards', async () => {
    const onInsert = vi.fn();

    render(
      <BlockInsertButton
        onInsert={onInsert}
        hideTrigger
        isOpen
        onOpenChange={vi.fn()}
      />,
    );

    const card = screen.getByRole('button', { name: /добавить блок/i });

    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });

    await waitFor(() => {
      expect(onInsert).toHaveBeenCalledTimes(2);
    });
    expect(onInsert).toHaveBeenNthCalledWith(1, 'text');
    expect(onInsert).toHaveBeenNthCalledWith(2, 'text');
  });

  it('renders visible focus styles for keyboard navigation', () => {
    render(
      <BlockInsertButton
        onInsert={vi.fn()}
        hideTrigger
        isOpen
        onOpenChange={vi.fn()}
      />,
    );

    const card = screen.getByRole('button', { name: /добавить блок/i });
    expect(card.className).toContain('focus-visible:ring-2');
  });

});
