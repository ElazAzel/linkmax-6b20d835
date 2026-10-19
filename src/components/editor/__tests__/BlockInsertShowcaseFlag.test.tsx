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
  it('offers card and tiles in the primary insert group now that the migration is present', () => {
    render(<BlockInsertButton onInsert={vi.fn()} isOpen onOpenChange={vi.fn()} hideTrigger />);
    expect(screen.getByTestId('add-block-option-text')).toBeInTheDocument();
    expect(screen.getByTestId('add-block-option-card')).toBeInTheDocument();
    expect(screen.getByTestId('add-block-option-tiles')).toBeInTheDocument();
  });
});
