import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';

import { BlockInsertButton } from '../BlockInsertButton';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'ru' },
  }),
}));

vi.mock('@/hooks/ui/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/lib/utils/icon-utils', () => ({
  getLucideIcon: () => (props: { className?: string }) => <svg aria-hidden="true" {...props} />,
}));

vi.mock('@/lib/blocks/block-manifest', () => ({
  BLOCK_MANIFEST: {
    text: { type: 'text', labelKey: 'Text', icon: 'type', isPremium: false },
    image: { type: 'image', labelKey: 'Image', icon: 'image', isPremium: false },
  },
}));

vi.mock('@/lib/blocks/block-recommendations', () => ({
  getRecommendedBlocks: () => [],
}));

function SharedSheetHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <BlockInsertButton
        onInsert={vi.fn()}
        renderSheet={false}
        onOpenChange={(nextOpen) => {
          if (nextOpen) setOpen(true);
        }}
      />
      <BlockInsertButton
        onInsert={vi.fn()}
        isOpen={open}
        onOpenChange={setOpen}
        hideTrigger
      />
    </>
  );
}

describe('BlockInsertButton shared sheet', () => {
  it('closes shared sheet via close button', async () => {
    render(<SharedSheetHarness />);

    fireEvent.click(screen.getByTestId('add-block-trigger'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
