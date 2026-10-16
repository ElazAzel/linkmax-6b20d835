import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardSidebar } from '@/components/dashboard-v2/layout/DashboardSidebar';
import { EditorTopBar } from '../EditorTopBar';
import { SmartActionDock } from '../SmartActionDock';
import { setBusinessFeaturesEnabled } from '@/lib/features';

vi.mock('@/lib/router-compat', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/contexts/ZoneContext', () => ({ useHasBusinessZone: () => true }));
vi.mock('@/components/dashboard-v2/organizations/OrganizationSwitcher', () => ({ OrganizationSwitcher: () => null }));
vi.mock('@/components/zones/ZoneSwitcherSlot', () => ({ default: () => null }));
vi.mock('@/components/editor/v2/PageHealthMeter', () => ({ PageHealthMeter: () => <button>Готовность страницы</button> }));
vi.mock('@/pwa/OfflineBadge', () => ({ OfflineBadge: () => null }));
vi.mock('@/hooks/ui/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/platform/native/haptics', () => ({ hapticLight: vi.fn(), hapticSelection: vi.fn() }));

describe('the working page editor workspace', () => {
  afterEach(() => setBusinessFeaturesEnabled(false));

  it('hides the business area until business tools are switched on', () => {
    render(<DashboardSidebar activeTab="editor" onTabChange={vi.fn()} isPremium onSignOut={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Бизнес' })).not.toBeInTheDocument();
  });

  it('shows one clear navigation while editing, with business tools behind Business', () => {
    const navigate = vi.fn();
    setBusinessFeaturesEnabled(true);
    render(<DashboardSidebar activeTab="editor" onTabChange={navigate} isPremium onSignOut={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: 'Настройки' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Лиды' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Сделки' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Бизнес' }));
    expect(navigate).toHaveBeenCalledWith('business');
  });

  it('retains the business workspace destinations in their own context', () => {
    setBusinessFeaturesEnabled(true);
    const navigate = vi.fn();
    render(<DashboardSidebar activeTab="business" onTabChange={navigate} isPremium onSignOut={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Сделки' }));
    expect(navigate).toHaveBeenCalledWith('zone-deals');
  });

  it('keeps page editing focused on preview and publication, with assistance in More', () => {
    const preview = vi.fn();
    const publish = vi.fn();
    render(<EditorTopBar titleSlot={<span>@elazart</span>}
      health={{ steps: [], completedCount: 0, totalCount: 4, progress: 0, isComplete: false, onStepClick: vi.fn() }}
      isPublished={false} onPreview={preview} onPublish={publish} onShare={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Готовность страницы' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Превью' }));
    fireEvent.click(screen.getByRole('button', { name: 'Опубликовать' }));
    expect(preview).toHaveBeenCalledOnce();
    expect(publish).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Ещё' })).toBeEnabled();
  });

  it('offers a distinct reorder action alongside Add and Appearance', () => {
    const reorder = vi.fn();
    const add = vi.fn();
    const customize = vi.fn();
    render(<SmartActionDock onAddBlock={add} onCustomize={customize} onToggleOrder={reorder} reordering={false} inline />);
    const order = screen.getByRole('button', { name: 'Порядок блоков' });
    expect(order).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(order);
    fireEvent.click(screen.getByRole('button', { name: 'Добавить блок' }));
    fireEvent.click(screen.getByRole('button', { name: 'Оформление страницы' }));
    expect(reorder).toHaveBeenCalledOnce();
    expect(add).toHaveBeenCalledOnce();
    expect(customize).toHaveBeenCalledOnce();
  });
});
