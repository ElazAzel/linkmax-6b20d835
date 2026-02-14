/**
 * PublicPage Tests
 * Tests public bio page rendering, loading states, and error handling
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock usePublicPage hook
const mockUsePublicPage = vi.fn();
vi.mock('@/hooks/usePageCache', () => ({
    usePublicPage: (slug: string | undefined) => mockUsePublicPage(slug),
}));

// ... (existing mocks) ...

// Mock LanguageContext
vi.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        currentLanguage: 'ru',
        translateBlocksToLanguage: vi.fn().mockResolvedValue([]),
        isTranslating: false,
        autoTranslateEnabled: false,
    }),
}));

// ... (other mocks) ...

// Mock heatmap tracking
vi.mock('@/hooks/useHeatmapTracking', () => ({
    useHeatmapTracking: vi.fn(),
}));

// Mock analytics tracking
vi.mock('@/hooks/useAnalyticsTracking', () => ({
    AnalyticsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock services
vi.mock('@/services/analytics', () => ({
    trackShare: vi.fn(),
}));

vi.mock('@/services/user', () => ({
    checkPremiumStatus: vi.fn().mockResolvedValue({ isPremium: false, tier: 'free' }),
}));

// Mock components
vi.mock('@/components/public/PublicPageSkeleton', () => ({
    PublicPageSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

vi.mock('@/components/public/PublicPageError', () => ({
    PublicPageError: ({ type }: { type: string }) => (
        <div data-testid="error">{type}</div>
    ),
}));

vi.mock('@/components/blocks/GridBlocksRenderer', () => ({
    GridBlocksRenderer: ({ blocks }: { blocks: unknown[] }) => (
        <div data-testid="grid-blocks">{blocks.length} blocks</div>
    ),
}));

vi.mock('@/components/seo/EnhancedSEOHead', () => ({
    EnhancedSEOHead: () => null,
}));

vi.mock('@/components/seo/SEOMetaEnhancer', () => ({
    SEOMetaEnhancer: () => null,
}));

vi.mock('@/components/seo/AISearchOptimizer', () => ({
    AISearchOptimizer: () => null,
}));

vi.mock('@/components/seo/CrawlerFriendlyContent', () => ({
    CrawlerFriendlyContent: () => null,
}));

vi.mock('@/components/seo/GEOEnhancedContent', () => ({
    GEOEnhancedContent: () => null,
}));

vi.mock('@/components/LanguageSwitcher', () => ({
    LanguageSwitcher: () => null,
}));

vi.mock('@/components/FreemiumWatermark', () => ({
    FreemiumWatermark: () => null,
}));

vi.mock('@/components/ChatbotWidget', () => ({
    ChatbotWidget: () => null,
}));

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

const renderPublicPage = async (slug: string) => {
    const queryClient = createTestQueryClient();
    const PublicPage = (await import('../PublicPage')).default;

    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[`/${slug}`]}>
                <Routes>
                    <Route path="/:slug" element={<PublicPage />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
};

describe('PublicPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('loading state', () => {
        it('shows skeleton while loading', async () => {
            mockUsePublicPage.mockReturnValue({
                data: null,
                isLoading: true,
                error: null,
            });

            await renderPublicPage('testuser');

            expect(screen.getByTestId('skeleton')).toBeInTheDocument();
        });
    });

    describe('error state', () => {
        it('shows error when page not found', async () => {
            mockUsePublicPage.mockReturnValue({
                data: null,
                isLoading: false,
                error: { message: 'Not found' },
            });

            await renderPublicPage('testuser');

            expect(screen.getByTestId('error')).toBeInTheDocument();
        });
    });

    describe('successful render', () => {
        const mockPageData = {
            id: 'page-123',
            slug: 'testuser',
            userId: 'user-123',
            blocks: [
                { id: 'block-1', type: 'profile', content: { name: 'Test User' } },
                { id: 'block-2', type: 'link', content: { url: 'https://example.com', title: 'Example' } },
            ],
            theme: {
                customBackground: { type: 'solid', value: '#ffffff' },
            },
            seo: {
                title: 'Test User Profile',
                description: 'This is a test profile',
            },
            isPremium: false,
        };

        it('renders blocks when page data is loaded', async () => {
            mockUsePublicPage.mockReturnValue({
                data: mockPageData,
                isLoading: false,
                error: null,
            });

            await renderPublicPage('testuser');

            await waitFor(() => {
                expect(screen.getByTestId('grid-blocks')).toBeInTheDocument();
            });

            expect(screen.getByTestId('grid-blocks')).toHaveTextContent('2 blocks');
        });

        it('renders share button', async () => {
            mockUsePublicPage.mockReturnValue({
                data: mockPageData,
                isLoading: false,
                error: null,
            });

            await renderPublicPage('testuser');

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /поделиться/i })).toBeInTheDocument();
            });
        });

        it('renders QR code button', async () => {
            mockUsePublicPage.mockReturnValue({
                data: mockPageData,
                isLoading: false,
                error: null,
            });

            await renderPublicPage('testuser');

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /qr/i })).toBeInTheDocument();
            });
        });
    });
});
