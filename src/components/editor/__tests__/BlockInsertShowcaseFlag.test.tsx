import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  },
  isBlockPremium: () => false,
}));
vi.mock('@/lib/blocks/block-recommendations', () => ({ getRecommendedBlocks: () => [] }));

describe('BlockInsertButton showcase blocks', () => {
  it('hides card and tiles until the database migration flag is on', () => {
    render(<BlockInsertButton onInsert={vi.fn()} isOpen onOpenChange={vi.fn()} hideTrigger />);
    expect(screen.getByTestId('add-block-option-text')).toBeInTheDocument();
    expect(screen.queryByTestId('add-block-option-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-block-option-tiles')).not.toBeInTheDocument();
  });
});
