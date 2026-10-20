import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BlockInsertButton } from '../BlockInsertButton';

vi.mock('@/lib/router-compat', () => ({ useNavigate: () => vi.fn() }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key, i18n: { language: 'ru' } }),
}));
vi.mock('@/hooks/ui/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/lib/blocks/block-manifest', () => ({
  BLOCK_MANIFEST: {
    card: { type: 'card', labelKey: 'Card', icon: 'LayoutPanelLeft', isPremium: false },
    tiles: { type: 'tiles', labelKey: 'Tiles', icon: 'LayoutGrid', isPremium: false },
    text: { type: 'text', labelKey: 'Text', icon: 'Type', isPremium: false },
    avatar: { type: 'avatar', labelKey: 'Avatar', icon: 'UserCircle', isPremium: false },
    event: { type: 'event', labelKey: 'Event', icon: 'CalendarDays', isPremium: true },
    product: { type: 'product', labelKey: 'Product', icon: 'ShoppingBag', isPremium: true },
  },
  isBlockPremium: () => false,
}));
vi.mock('@/lib/blocks/block-recommendations', () => ({ getRecommendedBlocks: () => [] }));

describe('BlockInsertButton showcase blocks', () => {
  afterEach(() => window.localStorage.removeItem('lm-business-features'));

  it('offers card and tiles in the primary insert group now that the migration is present', () => {
    render(<BlockInsertButton onInsert={vi.fn()} isOpen onOpenChange={vi.fn()} hideTrigger />);
    expect(screen.getByTestId('add-block-option-text')).toBeInTheDocument();
    expect(screen.getByTestId('add-block-option-card')).toBeInTheDocument();
    expect(screen.getByTestId('add-block-option-tiles')).toBeInTheDocument();
  });

  it('offers events without enabling business tools and inserts the selected event', async () => {
    window.localStorage.setItem('lm-business-features', 'off');
    const onInsert = vi.fn();
    render(<BlockInsertButton onInsert={onInsert} isOpen onOpenChange={vi.fn()} hideTrigger />);

    fireEvent.click(screen.getByTestId('add-block-option-event'));
    await waitFor(() => expect(onInsert).toHaveBeenCalledWith('event'));
    expect(screen.queryByTestId('add-block-option-product')).not.toBeInTheDocument();
  });

  it('omits avatars from the insert list and search results', () => {
    render(<BlockInsertButton onInsert={vi.fn()} isOpen onOpenChange={vi.fn()} hideTrigger />);
    expect(screen.queryByTestId('add-block-option-avatar')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'avatar' } });
    expect(screen.queryByTestId('add-block-option-avatar')).not.toBeInTheDocument();
  });
});
