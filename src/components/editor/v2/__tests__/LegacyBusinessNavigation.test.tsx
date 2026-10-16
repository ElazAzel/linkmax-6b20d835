import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardSidebar } from '@/components/dashboard-v2/layout/DashboardSidebar';
import { LegacyBottomNav } from '@/components/dashboard-v2/layout/LegacyBottomNav';
import { setBusinessFeaturesEnabled } from '@/lib/features';

vi.mock('@/lib/ui-v2', () => ({ LINKMAX_UI_V2: false }));
vi.mock('@/lib/router-compat', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/contexts/ZoneContext', () => ({ useHasBusinessZone: () => true }));
vi.mock('@/components/dashboard-v2/organizations/OrganizationSwitcher', () => ({ OrganizationSwitcher: () => null }));
vi.mock('@/components/zones/ZoneSwitcherSlot', () => ({ default: () => null }));
vi.mock('@/platform/native/haptics', () => ({ hapticLight: vi.fn(), hapticSelection: vi.fn() }));

describe('business tools in legacy navigation', () => {
  afterEach(() => setBusinessFeaturesEnabled(false));

  it('hides business destinations in the sidebar and restores them when enabled', () => {
    setBusinessFeaturesEnabled(false);
    const props = { activeTab: 'editor', onTabChange: vi.fn(), isPremium: true, onSignOut: vi.fn() };
    const { rerender } = render(<DashboardSidebar {...props} />);
    for (const id of ['clients', 'calendar', 'offers', 'activity', 'leads', 'events', 'finance', 'team', 'zone-deals']) {
      expect(screen.queryByTestId(id + '-tab')).not.toBeInTheDocument();
    }
    expect(screen.getByTestId('insights-tab')).toBeVisible();
    expect(screen.getByTestId('settings-tab')).toBeVisible();
    setBusinessFeaturesEnabled(true);
    rerender(<DashboardSidebar {...props} />);
    expect(screen.getByTestId('clients-tab')).toBeVisible();
    expect(screen.getByTestId('zone-deals-tab')).toBeVisible();
  });

  it('keeps business tools out of both the mobile tabs and More menu', () => {
    setBusinessFeaturesEnabled(false);
    render(<LegacyBottomNav activeTab="editor" onTabChange={vi.fn()} isPremium />);
    expect(screen.queryByTestId('activity-tab')).not.toBeInTheDocument();
    expect(screen.getByTestId('insights-tab')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));
    for (const id of ['leads', 'events', 'monetize', 'finance', 'team', 'zone-deals']) {
      expect(screen.queryByTestId(id + '-tab')).not.toBeInTheDocument();
    }
    expect(screen.getByTestId('pages-tab')).toBeVisible();
    expect(screen.getByTestId('settings-tab')).toBeVisible();
  });
});
