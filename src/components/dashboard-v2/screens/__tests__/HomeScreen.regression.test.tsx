import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { PageData } from '@/types/page';
import { HomeScreen } from '../HomeScreen';

vi.mock('@/hooks/user/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/hooks/onboarding/useActivationChecklist', () => ({
  useActivationChecklist: () => ({
    steps: [],
    completedCount: 0,
    totalCount: 0,
    progress: 0,
    canDismiss: false,
    isVisible: false,
    showCelebration: false,
    dismiss: vi.fn(),
    dismissCelebration: vi.fn(),
    handleStepClick: vi.fn(),
  }),
}));

vi.mock('@/hooks/crm/useRepeatCustomers', () => ({
  useRepeatCustomers: () => ({ repeatCount: 0 }),
}));

vi.mock('@/components/dashboard-v2/widgets/IncomingWidget', () => ({ IncomingWidget: () => null }));
vi.mock('@/components/dashboard-v2/widgets/OperatorSummaryWidget', () => ({ OperatorSummaryWidget: () => null }));
vi.mock('@/components/dashboard-v2/widgets/WalletOverviewWidget', () => ({ WalletOverviewWidget: () => null }));
vi.mock('@/components/dashboard-v2/widgets/KaspiQRWidget', () => ({ KaspiQRWidget: () => null }));
vi.mock('@/components/dashboard-v2/widgets/SearchReadinessCard', () => ({ SearchReadinessCard: () => null }));
vi.mock('@/components/dashboard-v2/widgets/MetricsGrid', () => ({ MetricsGrid: () => <div>25</div> }));
vi.mock('@/components/dashboard-v2/widgets/ConversionFunnelWidget', () => ({ ConversionFunnelWidget: () => <div>funnel</div> }));
vi.mock('@/components/dashboard-v2/widgets/SourcesWidget', () => ({ SourcesWidget: () => <div>sources</div> }));

const pageData = {
  id: 'page-1',
  userId: 'owner-1',
  slug: 'aigerim-nails',
  blocks: [
    {
      id: 'profile-1',
      type: 'profile',
      name: 'Айгерим',
      bio: 'Мастер маникюра',
      avatar: '',
      blockSize: 'full',
    },
  ],
  theme: {
    backgroundColor: '#ffffff',
    textColor: '#111111',
    buttonStyle: 'rounded',
    fontFamily: 'sans',
  },
  seo: { title: 'Айгерим', description: 'Маникюр', keywords: [] },
  isPublished: true,
  viewCount: 25,
  niche: 'beauty',
} as PageData;

describe('HomeScreen trust baseline', () => {
  it('renders one performance region and one next-action region without unsupported uplift claims', () => {
    const noop = vi.fn();

    render(
      <MemoryRouter>
        <HomeScreen
          pageData={pageData}
          loading={false}
          isPremium={false}
          realLeadsCount={0}
          onOpenEditor={noop}
          onPreview={noop}
          onShare={noop}
          onOpenTemplates={noop}
          onOpenMarketplace={noop}
          onOpenInsights={noop}
          onOpenActivity={noop}
          kaspiWidgetEnabled={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByTestId('home-performance-region')).toHaveLength(1);
    expect(screen.getAllByTestId('home-next-action-region')).toHaveLength(1);
    expect(screen.getAllByText('25')).toHaveLength(1);
    expect(screen.queryByText(/40%|25%|30%|5 из 10|каждая 5-я/i)).not.toBeInTheDocument();
  });
});
