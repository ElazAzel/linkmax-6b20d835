/**
 * AppTabBar Tests - v1.2
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppTabBar } from '../AppTabBar';

// Mock next/navigation
const useRouterMock = vi.fn();
const usePathnameMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: useRouterMock,
  }),
  usePathname: () => usePathnameMock(),
}));

const renderAppTabBar = (props = {}) => {
  return render(
    <AppTabBar {...props} />
  );
};

describe('AppTabBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue('/dashboard/editor');
  });

  it('renders all 6 tabs', () => {
    renderAppTabBar();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
  });

  it('highlights active tab', () => {
    renderAppTabBar({ activeTab: 'editor' });
    // Active tab should have primary color class
    const buttons = screen.getAllByRole('button');
    const editorButton = buttons[1]; // Editor is second tab
    expect(editorButton.className).toContain('text-primary');
  });

  it('calls onTabChange when tab is clicked', () => {
    const onTabChange = vi.fn();
    renderAppTabBar({ onTabChange });

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]); // Click CRM tab

    expect(onTabChange).toHaveBeenCalledWith('crm');
  });

  it('displays badge when provided', () => {
    renderAppTabBar({ crmBadge: 5 });
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('caps badge at 99+', () => {
    renderAppTabBar({ crmBadge: 150 });
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('has compact design that fits 6 tabs', () => {
    const { container } = renderAppTabBar();
    // Check grid-cols-6 is applied
    const grid = container.querySelector('.grid-cols-6');
    expect(grid).toBeInTheDocument();
  });
});
