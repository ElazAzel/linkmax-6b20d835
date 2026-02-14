/**
 * AppTabBar Tests - v1.2
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppTabBar } from '../AppTabBar';

const renderAppTabBar = (props = {}) => {
  return render(
    <BrowserRouter>
      <AppTabBar {...props} />
    </BrowserRouter>
  );
};

describe('AppTabBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
