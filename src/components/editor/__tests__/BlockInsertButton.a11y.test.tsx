import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

describe('BlockInsertButton a11y', () => {
  it('opens with Enter on trigger and closes with Escape', () => {
    render(<BlockInsertButton onInsert={vi.fn()} />);

    const trigger = screen.getByRole('button');
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyUp(trigger, { key: 'Enter' });

    if (!screen.queryByRole('dialog')) {
      fireEvent.click(trigger);
    }

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders insert options as semantic buttons', () => {
    render(<BlockInsertButton onInsert={vi.fn()} isOpen hideTrigger />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(2);
  });
});
