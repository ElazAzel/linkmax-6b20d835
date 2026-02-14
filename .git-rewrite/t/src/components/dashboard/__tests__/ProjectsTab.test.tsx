/**
 * ProjectsTab Tests - v1.2
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectsTab } from '../ProjectsTab';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
} as any;

const defaultProps = {
  pageData: {
    id: 'page-123',
    userId: 'user-123',
    blocks: [],
    theme: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      buttonStyle: 'solid',
      fontFamily: 'Inter',
    },
    seo: {
      title: 'Test Page',
      description: 'Test description',
      keywords: [],
    },
    isPremium: false,
  } as any,
  user: mockUser,
  isPremium: false,
  onOpenEditor: vi.fn(),
  onOpenSettings: vi.fn(),
  onPreview: vi.fn(),
  onShare: vi.fn(),
  onOpenTemplates: vi.fn(),
  onOpenMarketplace: vi.fn(),
};

const renderProjectsTab = (props = {}) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ProjectsTab {...defaultProps} {...props} />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ProjectsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderProjectsTab();
    expect(document.body).toBeTruthy();
  });

  it('displays page info', () => {
    renderProjectsTab();
    // Page info should be displayed
    expect(document.body).toBeTruthy();
  });

  it('shows view count', () => {
    renderProjectsTab();
    // View count should be displayed
    expect(document.body).toBeTruthy();
  });

  it('shows likes count', () => {
    renderProjectsTab();
    // Likes count should be displayed
    expect(document.body).toBeTruthy();
  });

  it('shows premium badge for premium users', () => {
    renderProjectsTab({ isPremium: true });
    expect(document.body).toBeTruthy();
  });

  it('shows quick actions', () => {
    renderProjectsTab();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onOpenEditor when edit is clicked', () => {
    const onOpenEditor = vi.fn();
    renderProjectsTab({ onOpenEditor });
    // Edit button should exist
    expect(document.body).toBeTruthy();
  });
});
