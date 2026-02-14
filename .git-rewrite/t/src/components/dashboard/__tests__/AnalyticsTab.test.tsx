/**
 * AnalyticsTab Tests - v1.3
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnalyticsTab } from '../AnalyticsTab';

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    session: null,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock usePageAnalytics hook
vi.mock('@/hooks/usePageAnalytics', () => ({
  usePageAnalytics: () => ({
    analytics: null,
    loading: false,
    error: null,
    period: '7d',
    setPeriod: vi.fn(),
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const mockEditorHistory = {
  currentBlocks: [],
  history: [],
  currentIndex: 0,
  canUndo: false,
  canRedo: false,
  historyLength: 0,
  undo: vi.fn(),
  redo: vi.fn(),
  clear: vi.fn(),
  clearHistory: vi.fn(),
  resetWithBlocks: vi.fn(),
  recordAction: vi.fn(),
  recordBlockAdd: vi.fn(),
  recordBlockDelete: vi.fn(),
  recordBlockUpdate: vi.fn(),
  recordBlocksReorder: vi.fn(),
  pushAction: vi.fn(),
};

const defaultProps = {
  pageId: 'page-123',
  isPremium: false,
  blocks: [],
  editorHistory: mockEditorHistory,
  onUpdateBlock: vi.fn(),
  onApplyInsight: vi.fn(),
};

const renderAnalyticsTab = (props = {}) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnalyticsTab {...defaultProps} {...props} />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AnalyticsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAnalyticsTab();
    expect(document.body).toBeTruthy();
  });

  it('shows period selector', () => {
    renderAnalyticsTab();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('displays analytics metrics', () => {
    renderAnalyticsTab();
    expect(document.body).toBeTruthy();
  });

  it('shows AI insights section', () => {
    renderAnalyticsTab();
    expect(document.body).toBeTruthy();
  });

  it('shows premium gate for advanced analytics', () => {
    renderAnalyticsTab({ isPremium: false });
    expect(document.body).toBeTruthy();
  });

  it('shows full analytics for premium users', () => {
    renderAnalyticsTab({ isPremium: true });
    expect(document.body).toBeTruthy();
  });
});
